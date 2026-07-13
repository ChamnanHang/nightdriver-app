from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_driver
from app.database import get_db
from app.models.driver import Driver
from app.schemas.driver import (
    DriverAvailabilityUpdate,
    DriverLocationUpdate,
    DriverOut,
    DriverPublic,
)

router = APIRouter(prefix="/drivers", tags=["Drivers"])


@router.get("/available", response_model=list[DriverPublic])
def list_available_drivers(db: Session = Depends(get_db)):
    """List all drivers currently marked as available."""
    return (
        db.query(Driver)
        .filter(Driver.is_available == True, Driver.is_active == True)  # noqa: E712
        .all()
    )


@router.get("/me", response_model=DriverOut)
def get_driver_me(current_driver: Driver = Depends(get_current_driver)):
    return current_driver


@router.put("/me/availability", response_model=DriverOut)
def update_availability(
    payload: DriverAvailabilityUpdate,
    current_driver: Driver = Depends(get_current_driver),
    db: Session = Depends(get_db),
):
    current_driver.is_available = payload.is_available
    db.commit()
    db.refresh(current_driver)
    return current_driver


@router.put("/me/location", response_model=DriverOut)
def update_location(
    payload: DriverLocationUpdate,
    current_driver: Driver = Depends(get_current_driver),
    db: Session = Depends(get_db),
):
    current_driver.current_lat = payload.lat
    current_driver.current_lng = payload.lng
    current_driver.location_updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(current_driver)
    return current_driver


@router.get("/{driver_id}", response_model=DriverPublic)
def get_driver(driver_id: int, db: Session = Depends(get_db)):
    driver = db.get(Driver, driver_id)
    if not driver or not driver.is_active:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Driver not found")
    return driver
