import enum
from datetime import datetime
from sqlalchemy import DateTime, Enum, Float, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ServiceType(str, enum.Enum):
    DESIGNATED = "designated"  # Daiko: driver drives the CUSTOMER's own car home
    RIDE = "ride"              # Driver picks customer up in the driver's car


class BookingStatus(str, enum.Enum):
    PENDING = "pending"         # Customer created, waiting for driver
    ACCEPTED = "accepted"       # Driver accepted
    DRIVER_ARRIVED = "driver_arrived"  # Driver at pickup location
    IN_PROGRESS = "in_progress" # Trip has started
    COMPLETED = "completed"     # Trip finished
    CANCELLED = "cancelled"     # Cancelled by customer or driver


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    driver_id: Mapped[int | None] = mapped_column(
        ForeignKey("drivers.id"), nullable=True, index=True
    )

    service_type: Mapped[ServiceType] = mapped_column(
        Enum(ServiceType), default=ServiceType.DESIGNATED
    )
    # Customer's car (required for DESIGNATED — the driver drives this car)
    car_model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    car_plate: Mapped[str | None] = mapped_column(String(20), nullable=True)
    car_transmission: Mapped[str | None] = mapped_column(String(10), nullable=True)  # "auto" | "manual"

    # Pickup location
    pickup_address: Mapped[str] = mapped_column(String(300))
    pickup_lat: Mapped[float] = mapped_column(Float)
    pickup_lng: Mapped[float] = mapped_column(Float)

    # Destination
    destination_address: Mapped[str] = mapped_column(String(300))
    destination_lat: Mapped[float] = mapped_column(Float)
    destination_lng: Mapped[float] = mapped_column(Float)

    # Driver location snapshot at time of acceptance
    driver_accept_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    driver_accept_lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    # ETA in minutes from driver to pickup (calculated on accept)
    eta_minutes: Mapped[int | None] = mapped_column(nullable=True)

    # Fare
    distance_km: Mapped[float | None] = mapped_column(Float, nullable=True)
    estimated_fare: Mapped[float | None] = mapped_column(Float, nullable=True)
    final_fare: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_night_surge: Mapped[bool] = mapped_column(default=False)

    # Money split (set when trip completes)
    commission_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    commission_amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    driver_earnings: Mapped[float | None] = mapped_column(Float, nullable=True)

    status: Mapped[BookingStatus] = mapped_column(
        Enum(BookingStatus), default=BookingStatus.PENDING
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    cancel_reason: Mapped[str | None] = mapped_column(String(300), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    accepted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    customer: Mapped["User"] = relationship(  # noqa: F821
        "User", back_populates="bookings", foreign_keys=[customer_id]
    )
    driver: Mapped["Driver"] = relationship(  # noqa: F821
        "Driver", back_populates="bookings"
    )
    review: Mapped["Review"] = relationship(  # noqa: F821
        "Review", back_populates="booking", uselist=False
    )
