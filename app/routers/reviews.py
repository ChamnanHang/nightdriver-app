from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.booking import Booking, BookingStatus
from app.models.driver import Driver
from app.models.review import Review
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewOut

router = APIRouter(prefix="/bookings", tags=["Reviews"])


@router.post("/{booking_id}/review", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def submit_review(
    booking_id: int,
    payload: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.get(Booking, booking_id)
    if not booking or booking.customer_id != current_user.id:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status != BookingStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Can only review completed bookings")
    if booking.review:
        raise HTTPException(status_code=400, detail="Review already submitted")

    review = Review(
        booking_id=booking.id,
        customer_id=current_user.id,
        driver_id=booking.driver_id,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(review)

    # Recalculate driver average rating
    driver = db.get(Driver, booking.driver_id)
    all_ratings = [r.rating for r in driver.reviews] + [payload.rating]
    driver.average_rating = round(sum(all_ratings) / len(all_ratings), 2)

    db.commit()
    db.refresh(review)
    return review


@router.get("/{booking_id}/review", response_model=ReviewOut)
def get_review(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.get(Booking, booking_id)
    if not booking or booking.customer_id != current_user.id:
        raise HTTPException(status_code=404, detail="Booking not found")
    if not booking.review:
        raise HTTPException(status_code=404, detail="No review found")
    return booking.review
