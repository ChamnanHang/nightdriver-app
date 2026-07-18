from datetime import datetime

from sqlalchemy import DateTime, Float, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class PricingSetting(Base):
    """Single-row table (id=1) holding live pricing config, editable by admin."""

    __tablename__ = "pricing_settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    # RIDE service (driver's own car)
    base_fare: Mapped[float] = mapped_column(Float, default=2.50)
    price_per_km: Mapped[float] = mapped_column(Float, default=1.80)
    # DESIGNATED / daiko service (driver drives the customer's car) — priced
    # higher, plus a call-out fee covering the driver's moto ride to the venue
    designated_base_fare: Mapped[float] = mapped_column(Float, default=5.00)
    designated_price_per_km: Mapped[float] = mapped_column(Float, default=2.20)
    pickup_fee: Mapped[float] = mapped_column(Float, default=1.00)
    # Riel display rate (fares are charged in USD, shown also in KHR)
    khr_per_usd: Mapped[float] = mapped_column(Float, default=4100.0)
    night_surge_multiplier: Mapped[float] = mapped_column(Float, default=1.5)
    night_start_hour: Mapped[int] = mapped_column(default=20)
    night_end_hour: Mapped[int] = mapped_column(default=6)
    # Platform commission taken from each completed fare (0.20 = 20%)
    commission_rate: Mapped[float] = mapped_column(Float, default=0.20)
    minimum_fare: Mapped[float] = mapped_column(Float, default=2.00)

    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), nullable=True
    )
