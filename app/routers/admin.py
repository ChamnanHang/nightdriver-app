from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, decode_token
from app.database import get_db
from app.models.booking import Booking, BookingStatus
from app.models.driver import Driver
from app.models.user import User
from app.utils.pricing import get_pricing

router = APIRouter(prefix="/admin", tags=["Admin"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/admin/login")


def require_admin(token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)
    if not payload or payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return payload


# ── Auth ──────────────────────────────────────────────────────────────────────

class AdminLogin(BaseModel):
    email: str
    password: str


@router.post("/login")
def admin_login(body: AdminLogin):
    if body.email != settings.ADMIN_EMAIL or body.password != settings.ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    token = create_access_token({"sub": "admin", "role": "admin"})
    return {"access_token": token, "token_type": "bearer", "role": "admin"}


# ── Stats ─────────────────────────────────────────────────────────────────────

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), _=Depends(require_admin)):
    revenue = db.scalar(
        select(func.coalesce(func.sum(Booking.final_fare), 0))
        .where(Booking.status == BookingStatus.COMPLETED)
    ) or 0
    commission = db.scalar(
        select(func.coalesce(func.sum(Booking.commission_amount), 0))
        .where(Booking.status == BookingStatus.COMPLETED)
    ) or 0
    driver_payouts = db.scalar(
        select(func.coalesce(func.sum(Booking.driver_earnings), 0))
        .where(Booking.status == BookingStatus.COMPLETED)
    ) or 0
    return {
        "total_users":    db.scalar(select(func.count()).select_from(User)),
        "total_drivers":  db.scalar(select(func.count()).select_from(Driver)),
        "total_bookings": db.scalar(select(func.count()).select_from(Booking)),
        "completed_bookings": db.scalar(select(func.count()).select_from(Booking).where(Booking.status == BookingStatus.COMPLETED)),
        "pending_bookings":   db.scalar(select(func.count()).select_from(Booking).where(Booking.status == BookingStatus.PENDING)),
        "active_drivers":     db.scalar(select(func.count()).select_from(Driver).where(Driver.is_available == True)),  # noqa: E712
        "total_revenue":  round(float(revenue), 2),
        "admin_earnings":  round(float(commission), 2),
        "driver_payouts":  round(float(driver_payouts), 2),
    }


# ── Pricing ───────────────────────────────────────────────────────────────────

class PricingUpdate(BaseModel):
    base_fare: Optional[float] = None
    price_per_km: Optional[float] = None
    night_surge_multiplier: Optional[float] = None
    night_start_hour: Optional[int] = None
    night_end_hour: Optional[int] = None
    commission_rate: Optional[float] = None
    minimum_fare: Optional[float] = None


def _pricing_out(p) -> dict:
    return {
        "base_fare": p.base_fare,
        "price_per_km": p.price_per_km,
        "night_surge_multiplier": p.night_surge_multiplier,
        "night_start_hour": p.night_start_hour,
        "night_end_hour": p.night_end_hour,
        "commission_rate": p.commission_rate,
        "minimum_fare": p.minimum_fare,
        "updated_at": p.updated_at,
    }


@router.get("/pricing")
def get_pricing_settings(db: Session = Depends(get_db), _=Depends(require_admin)):
    return _pricing_out(get_pricing(db))


@router.put("/pricing")
def update_pricing_settings(
    body: PricingUpdate, db: Session = Depends(get_db), _=Depends(require_admin)
):
    if body.commission_rate is not None and not 0 <= body.commission_rate <= 1:
        raise HTTPException(400, "commission_rate must be between 0 and 1")
    for field in ("night_start_hour", "night_end_hour"):
        value = getattr(body, field)
        if value is not None and not 0 <= value <= 23:
            raise HTTPException(400, f"{field} must be between 0 and 23")
    for field in ("base_fare", "price_per_km", "night_surge_multiplier", "minimum_fare"):
        value = getattr(body, field)
        if value is not None and value < 0:
            raise HTTPException(400, f"{field} cannot be negative")

    pricing = get_pricing(db)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(pricing, field, value)
    db.commit()
    db.refresh(pricing)
    return _pricing_out(pricing)


# ── Earnings ──────────────────────────────────────────────────────────────────

@router.get("/earnings")
def earnings_report(db: Session = Depends(get_db), _=Depends(require_admin)):
    """Per-driver earnings breakdown for completed trips."""
    rows = db.execute(
        select(
            Driver.id,
            Driver.full_name,
            Driver.vehicle_plate,
            func.count(Booking.id).label("trips"),
            func.coalesce(func.sum(Booking.final_fare), 0).label("gross"),
            func.coalesce(func.sum(Booking.commission_amount), 0).label("commission"),
            func.coalesce(func.sum(Booking.driver_earnings), 0).label("net"),
        )
        .join(Booking, Booking.driver_id == Driver.id)
        .where(Booking.status == BookingStatus.COMPLETED)
        .group_by(Driver.id, Driver.full_name, Driver.vehicle_plate)
        .order_by(func.coalesce(func.sum(Booking.driver_earnings), 0).desc())
    ).all()
    return {
        "items": [
            {
                "driver_id": r.id,
                "full_name": r.full_name,
                "vehicle_plate": r.vehicle_plate,
                "trips": r.trips,
                "gross_fares": round(float(r.gross), 2),
                "admin_commission": round(float(r.commission), 2),
                "driver_earnings": round(float(r.net), 2),
            }
            for r in rows
        ],
    }


# ── Users ─────────────────────────────────────────────────────────────────────

@router.get("/users")
def list_users(
    skip: int = 0, limit: int = 50, search: Optional[str] = None,
    db: Session = Depends(get_db), _=Depends(require_admin),
):
    q = select(User).order_by(User.created_at.desc())
    if search:
        q = q.where(User.full_name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%"))
    users = db.scalars(q.offset(skip).limit(limit)).all()
    return {
        "total": db.scalar(select(func.count()).select_from(User)),
        "items": [
            {
                "id": u.id, "full_name": u.full_name, "email": u.email,
                "phone": u.phone, "is_active": u.is_active,
                "created_at": u.created_at, "total_bookings": len(u.bookings),
            }
            for u in users
        ],
    }


@router.put("/users/{user_id}/toggle")
def toggle_user(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    user.is_active = not user.is_active
    db.commit()
    return {"id": user.id, "is_active": user.is_active}


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    db.delete(user)
    db.commit()
    return {"deleted": user_id}


# ── Drivers ───────────────────────────────────────────────────────────────────

@router.get("/drivers")
def list_drivers(
    skip: int = 0, limit: int = 50, search: Optional[str] = None,
    db: Session = Depends(get_db), _=Depends(require_admin),
):
    q = select(Driver).order_by(Driver.created_at.desc())
    if search:
        q = q.where(Driver.full_name.ilike(f"%{search}%") | Driver.email.ilike(f"%{search}%"))
    drivers = db.scalars(q.offset(skip).limit(limit)).all()
    return {
        "total": db.scalar(select(func.count()).select_from(Driver)),
        "items": [
            {
                "id": d.id, "full_name": d.full_name, "email": d.email,
                "phone": d.phone, "license_number": d.license_number,
                "vehicle_model": d.vehicle_model, "vehicle_plate": d.vehicle_plate,
                "is_active": d.is_active, "is_available": d.is_available,
                "average_rating": d.average_rating, "total_trips": d.total_trips,
                "total_earnings": round(d.total_earnings or 0.0, 2),
                "created_at": d.created_at,
            }
            for d in drivers
        ],
    }


@router.put("/drivers/{driver_id}/toggle")
def toggle_driver(driver_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    driver = db.get(Driver, driver_id)
    if not driver:
        raise HTTPException(404, "Driver not found")
    driver.is_active = not driver.is_active
    db.commit()
    return {"id": driver.id, "is_active": driver.is_active}


@router.delete("/drivers/{driver_id}")
def delete_driver(driver_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    driver = db.get(Driver, driver_id)
    if not driver:
        raise HTTPException(404, "Driver not found")
    db.delete(driver)
    db.commit()
    return {"deleted": driver_id}


# ── Bookings ──────────────────────────────────────────────────────────────────

@router.get("/bookings")
def list_bookings(
    skip: int = 0, limit: int = 50, status: Optional[str] = None,
    db: Session = Depends(get_db), _=Depends(require_admin),
):
    q = select(Booking).order_by(Booking.created_at.desc())
    if status:
        try:
            q = q.where(Booking.status == BookingStatus(status))
        except ValueError:
            pass
    bookings = db.scalars(q.offset(skip).limit(limit)).all()
    return {
        "total": db.scalar(select(func.count()).select_from(Booking)),
        "items": [
            {
                "id": b.id, "status": b.status,
                "customer": {"id": b.customer.id, "full_name": b.customer.full_name, "email": b.customer.email} if b.customer else None,
                "driver": {"id": b.driver.id, "full_name": b.driver.full_name} if b.driver else None,
                "pickup_address": b.pickup_address,
                "destination_address": b.destination_address,
                "distance_km": b.distance_km,
                "estimated_fare": b.estimated_fare,
                "final_fare": b.final_fare,
                "commission_amount": b.commission_amount,
                "driver_earnings": b.driver_earnings,
                "is_night_surge": b.is_night_surge,
                "created_at": b.created_at,
                "completed_at": b.completed_at,
            }
            for b in bookings
        ],
    }


@router.put("/bookings/{booking_id}/cancel")
def admin_cancel_booking(booking_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(404, "Booking not found")
    if booking.status in (BookingStatus.COMPLETED, BookingStatus.CANCELLED):
        raise HTTPException(400, f"Cannot cancel a {booking.status} booking")
    booking.status = BookingStatus.CANCELLED
    booking.cancel_reason = "Cancelled by admin"
    db.commit()
    return {"id": booking.id, "status": booking.status}
