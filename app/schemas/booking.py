from datetime import datetime
from pydantic import BaseModel

from app.models.booking import BookingStatus
from app.schemas.driver import DriverPublic
from app.schemas.user import UserOut


class BookingCreate(BaseModel):
    pickup_address: str
    pickup_lat: float
    pickup_lng: float
    destination_address: str
    destination_lat: float
    destination_lng: float
    notes: str | None = None


class BookingOut(BaseModel):
    id: int
    customer_id: int
    driver_id: int | None
    pickup_address: str
    pickup_lat: float
    pickup_lng: float
    destination_address: str
    destination_lat: float
    destination_lng: float
    driver_accept_lat: float | None
    driver_accept_lng: float | None
    eta_minutes: int | None
    distance_km: float | None
    estimated_fare: float | None
    final_fare: float | None
    is_night_surge: bool
    status: BookingStatus
    notes: str | None
    cancel_reason: str | None
    created_at: datetime
    accepted_at: datetime | None
    started_at: datetime | None
    completed_at: datetime | None

    model_config = {"from_attributes": True}


class BookingDetail(BookingOut):
    customer: UserOut | None = None
    driver: DriverPublic | None = None


class BookingCancel(BaseModel):
    reason: str | None = None
