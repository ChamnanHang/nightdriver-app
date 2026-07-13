from datetime import datetime, timezone
from math import asin, cos, radians, sin, sqrt

from app.core.config import settings


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate great-circle distance in kilometres between two lat/lng points."""
    R = 6371.0
    phi1, phi2 = radians(lat1), radians(lat2)
    dphi = radians(lat2 - lat1)
    dlambda = radians(lng2 - lng1)
    a = sin(dphi / 2) ** 2 + cos(phi1) * cos(phi2) * sin(dlambda / 2) ** 2
    return R * 2 * asin(sqrt(a))


def is_night_time(dt: datetime | None = None) -> bool:
    """Return True if the given datetime falls in the night surge window."""
    now = dt or datetime.now(timezone.utc)
    hour = now.hour
    start = settings.NIGHT_START_HOUR  # e.g. 20 (8 PM)
    end = settings.NIGHT_END_HOUR      # e.g. 6  (6 AM)
    if start > end:  # crosses midnight
        return hour >= start or hour < end
    return start <= hour < end


def calculate_fare(distance_km: float, night_surge: bool) -> float:
    fare = settings.BASE_FARE + distance_km * settings.PRICE_PER_KM
    if night_surge:
        fare *= settings.NIGHT_SURGE_MULTIPLIER
    return round(fare, 2)
