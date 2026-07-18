from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ServiceZone(Base):
    """Circular operating area. Pickups must fall inside an active zone;
    if no active zones are configured, bookings are accepted anywhere."""

    __tablename__ = "service_zones"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    center_lat: Mapped[float] = mapped_column(Float)
    center_lng: Mapped[float] = mapped_column(Float)
    radius_km: Mapped[float] = mapped_column(Float, default=20.0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
