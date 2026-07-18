from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_driver, get_current_user
from app.database import get_db
from app.models.booking import Booking, BookingStatus
from app.models.driver import Driver
from app.models.user import User
from app.schemas.booking import BookingCancel, BookingCreate, BookingDetail, BookingOut
from app.utils.pricing import (
    calculate_fare,
    get_pricing,
    haversine_km,
    is_night_time,
    split_fare,
)

router = APIRouter(prefix="/bookings", tags=["Bookings"])


# ── Customer endpoints ──────────────────────────────────────────────────────

@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Block if customer already has an active booking
    active = (
        db.query(Booking)
        .filter(
            Booking.customer_id == current_user.id,
            Booking.status.in_([
                BookingStatus.PENDING,
                BookingStatus.ACCEPTED,
                BookingStatus.DRIVER_ARRIVED,
                BookingStatus.IN_PROGRESS,
            ]),
        )
        .first()
    )
    if active:
        raise HTTPException(
            status_code=400, detail="You already have an active booking"
        )

    distance = haversine_km(
        payload.pickup_lat, payload.pickup_lng,
        payload.destination_lat, payload.destination_lng,
    )
    pricing = get_pricing(db)
    night = is_night_time(pricing)
    fare = calculate_fare(pricing, distance, night)

    booking = Booking(
        customer_id=current_user.id,
        pickup_address=payload.pickup_address,
        pickup_lat=payload.pickup_lat,
        pickup_lng=payload.pickup_lng,
        destination_address=payload.destination_address,
        destination_lat=payload.destination_lat,
        destination_lng=payload.destination_lng,
        distance_km=round(distance, 2),
        estimated_fare=fare,
        is_night_surge=night,
        notes=payload.notes,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


@router.get("/my", response_model=list[BookingOut])
def my_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Booking)
        .filter(Booking.customer_id == current_user.id)
        .order_by(Booking.created_at.desc())
        .all()
    )


@router.get("/{booking_id}", response_model=BookingDetail)
def get_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.get(Booking, booking_id)
    if not booking or booking.customer_id != current_user.id:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.post("/{booking_id}/cancel", response_model=BookingOut)
def cancel_booking(
    booking_id: int,
    payload: BookingCancel,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.get(Booking, booking_id)
    if not booking or booking.customer_id != current_user.id:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status in (BookingStatus.COMPLETED, BookingStatus.CANCELLED):
        raise HTTPException(status_code=400, detail="Booking cannot be cancelled")
    if booking.status == BookingStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Cannot cancel a trip in progress")

    booking.status = BookingStatus.CANCELLED
    booking.cancel_reason = payload.reason
    db.commit()
    db.refresh(booking)
    return booking


# ── Driver endpoints ────────────────────────────────────────────────────────

@router.get("/driver/queue", response_model=list[BookingOut])
def pending_bookings(
    current_driver: Driver = Depends(get_current_driver),
    db: Session = Depends(get_db),
):
    """All pending bookings visible to available drivers."""
    if not current_driver.is_available:
        raise HTTPException(status_code=403, detail="You must be available to see the queue")
    return (
        db.query(Booking)
        .filter(Booking.status == BookingStatus.PENDING)
        .order_by(Booking.created_at.asc())
        .all()
    )


@router.post("/{booking_id}/accept", response_model=BookingOut)
def accept_booking(
    booking_id: int,
    current_driver: Driver = Depends(get_current_driver),
    db: Session = Depends(get_db),
):
    booking = db.get(Booking, booking_id)
    if not booking or booking.status != BookingStatus.PENDING:
        raise HTTPException(status_code=404, detail="Booking not available")

    # Make sure driver has no other active trip
    active = (
        db.query(Booking)
        .filter(
            Booking.driver_id == current_driver.id,
            Booking.status.in_([
                BookingStatus.ACCEPTED,
                BookingStatus.DRIVER_ARRIVED,
                BookingStatus.IN_PROGRESS,
            ]),
        )
        .first()
    )
    if active:
        raise HTTPException(status_code=400, detail="You already have an active trip")

    booking.driver_id = current_driver.id
    booking.status = BookingStatus.ACCEPTED
    booking.accepted_at = datetime.now(timezone.utc)
    current_driver.is_available = False

    # Snapshot driver's current location and calculate ETA to pickup
    if current_driver.current_lat and current_driver.current_lng:
        booking.driver_accept_lat = current_driver.current_lat
        booking.driver_accept_lng = current_driver.current_lng
        dist_to_pickup = haversine_km(
            current_driver.current_lat, current_driver.current_lng,
            booking.pickup_lat, booking.pickup_lng,
        )
        # Assume average city speed of 30 km/h at night
        booking.eta_minutes = max(1, round(dist_to_pickup / 30 * 60))
    db.commit()
    db.refresh(booking)
    return booking


@router.post("/{booking_id}/arrived", response_model=BookingOut)
def mark_arrived(
    booking_id: int,
    current_driver: Driver = Depends(get_current_driver),
    db: Session = Depends(get_db),
):
    booking = _get_driver_booking(booking_id, current_driver.id, db)
    if booking.status != BookingStatus.ACCEPTED:
        raise HTTPException(status_code=400, detail="Booking must be accepted first")
    booking.status = BookingStatus.DRIVER_ARRIVED
    db.commit()
    db.refresh(booking)
    return booking


@router.post("/{booking_id}/start", response_model=BookingOut)
def start_trip(
    booking_id: int,
    current_driver: Driver = Depends(get_current_driver),
    db: Session = Depends(get_db),
):
    booking = _get_driver_booking(booking_id, current_driver.id, db)
    if booking.status != BookingStatus.DRIVER_ARRIVED:
        raise HTTPException(status_code=400, detail="Mark as arrived before starting")
    booking.status = BookingStatus.IN_PROGRESS
    booking.started_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(booking)
    return booking


@router.post("/{booking_id}/complete", response_model=BookingOut)
def complete_trip(
    booking_id: int,
    current_driver: Driver = Depends(get_current_driver),
    db: Session = Depends(get_db),
):
    booking = _get_driver_booking(booking_id, current_driver.id, db)
    if booking.status != BookingStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Trip must be in progress")

    booking.status = BookingStatus.COMPLETED
    booking.completed_at = datetime.now(timezone.utc)
    booking.final_fare = booking.estimated_fare

    # Split the fare: platform commission vs. driver earnings
    pricing = get_pricing(db)
    commission, earnings = split_fare(pricing, booking.final_fare or 0.0)
    booking.commission_rate = pricing.commission_rate
    booking.commission_amount = commission
    booking.driver_earnings = earnings

    driver = db.get(Driver, current_driver.id)
    driver.total_trips += 1
    driver.total_earnings = round((driver.total_earnings or 0.0) + earnings, 2)
    driver.is_available = True

    db.commit()
    db.refresh(booking)
    return booking


def _get_driver_booking(booking_id: int, driver_id: int, db: Session) -> Booking:
    booking = db.get(Booking, booking_id)
    if not booking or booking.driver_id != driver_id:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking
