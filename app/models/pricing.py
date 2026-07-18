from datetime import datetime

from sqlalchemy import DateTime, Float, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class PricingSetting(Base):
    """Single-row table (id=1) holding live pricing config, editable by admin."""

    __tablename__ = "pricing_settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    base_fare: Mapped[float] = mapped_column(Float, default=2.50)
    price_per_km: Mapped[float] = mapped_column(Float, default=1.80)
    night_surge_multiplier: Mapped[float] = mapped_column(Float, default=1.5)
    night_start_hour: Mapped[int] = mapped_column(default=20)
    night_end_hour: Mapped[int] = mapped_column(default=6)
    # Platform commission taken from each completed fare (0.20 = 20%)
    commission_rate: Mapped[float] = mapped_column(Float, default=0.20)
    minimum_fare: Mapped[float] = mapped_column(Float, default=2.00)

    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), nullable=True
    )
