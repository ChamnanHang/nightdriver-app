from datetime import datetime
from pydantic import BaseModel, EmailStr


class DriverRegister(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    password: str
    license_number: str
    vehicle_model: str
    vehicle_plate: str
    can_drive_manual: bool = True


class DriverLogin(BaseModel):
    email: EmailStr
    password: str


class DriverOut(BaseModel):
    id: int
    full_name: str
    email: str
    phone: str
    license_number: str
    vehicle_model: str
    vehicle_plate: str
    is_available: bool
    can_drive_manual: bool
    average_rating: float
    total_trips: int
    total_earnings: float
    current_lat: float | None
    current_lng: float | None
    created_at: datetime

    model_config = {"from_attributes": True}


class DriverPublic(BaseModel):
    """Subset shown to customers when searching for drivers."""
    id: int
    full_name: str
    vehicle_model: str
    vehicle_plate: str
    is_available: bool
    average_rating: float
    total_trips: int
    current_lat: float | None
    current_lng: float | None

    model_config = {"from_attributes": True}


class DriverLocationUpdate(BaseModel):
    lat: float
    lng: float


class DriverAvailabilityUpdate(BaseModel):
    is_available: bool
