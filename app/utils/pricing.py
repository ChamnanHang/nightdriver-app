from datetime import datetime, timezone
from math import asin, cos, radians, sin, sqrt

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.pricing import PricingSetting


def get_pricing(db: Session) -> PricingSetting:
    """Return the live pricing row, creating it from env defaults on first use."""
    pricing = db.get(PricingSetting, 1)
    if pricing is None:
        pricing = PricingSetting(
            id=1,
            base_fare=settings.BASE_FARE,
            price_per_km=settings.PRICE_PER_KM,
            night_surge_multiplier=settings.NIGHT_SURGE_MULTIPLIER,
            night_start_hour=settings.NIGHT_START_HOUR,
            night_end_hour=settings.NIGHT_END_HOUR,
        )
        db.add(pricing)
        db.commit()
        db.refresh(pricing)
    return pricing


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate great-circle distance in kilometres between two lat/lng points."""
    R = 6371.0
    phi1, phi2 = radians(lat1), radians(lat2)
    dphi = radians(lat2 - lat1)
    dlambda = radians(lng2 - lng1)
    a = sin(dphi / 2) ** 2 + cos(phi1) * cos(phi2) * sin(dlambda / 2) ** 2
    return R * 2 * asin(sqrt(a))


def is_night_time(pricing: PricingSetting, dt: datetime | None = None) -> bool:
    """Return True if the given datetime falls in the night surge window."""
    now = dt or datetime.now(timezone.utc)
    hour = now.hour
    start = pricing.night_start_hour  # e.g. 20 (8 PM)
    end = pricing.night_end_hour      # e.g. 6  (6 AM)
    if start > end:  # crosses midnight
        return hour >= start or hour < end
    return start <= hour < end


def calculate_fare(pricing: PricingSetting, distance_km: float, night_surge: bool) -> float:
    fare = pricing.base_fare + distance_km * pricing.price_per_km
    if night_surge:
        fare *= pricing.night_surge_multiplier
    fare = max(fare, pricing.minimum_fare)
    return round(fare, 2)


def split_fare(pricing: PricingSetting, fare: float) -> tuple[float, float]:
    """Split a fare into (commission_amount, driver_earnings)."""
    commission = round(fare * pricing.commission_rate, 2)
    driver_earnings = round(fare - commission, 2)
    return commission, driver_earnings
