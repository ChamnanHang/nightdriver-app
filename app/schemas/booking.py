from datetime import datetime
from pydantic import BaseModel

from app.models.booking import BookingStatus, ServiceType
from app.schemas.driver import DriverPublic
from app.schemas.user import UserOut


class BookingCreate(BaseModel):
    service_type: ServiceType = ServiceType.DESIGNATED
    # Customer's car — required when service_type is DESIGNATED
    car_model: str | None = None
    car_plate: str | None = None
    car_transmission: str | None = None  # "auto" | "manual"
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
    service_type: ServiceType
    car_model: str | None
    car_plate: str | None
    car_transmission: str | None
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
    commission_rate: float | None = None
    commission_amount: float | None = None
    driver_earnings: float | None = None
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
