from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.database import get_db
from app.models.driver import Driver
from app.models.user import User
from app.schemas.auth import Token
from app.schemas.driver import DriverLogin, DriverRegister
from app.schemas.user import UserLogin, UserRegister

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_customer(payload: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.phone == payload.phone).first():
        raise HTTPException(status_code=400, detail="Phone already registered")

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": "customer"})
    return Token(access_token=token, role="customer")


@router.post("/login", response_model=Token)
def login_customer(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    token = create_access_token({"sub": str(user.id), "role": "customer"})
    return Token(access_token=token, role="customer")


@router.post("/driver/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_driver(payload: DriverRegister, db: Session = Depends(get_db)):
    if db.query(Driver).filter(Driver.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(Driver).filter(Driver.phone == payload.phone).first():
        raise HTTPException(status_code=400, detail="Phone already registered")
    if db.query(Driver).filter(Driver.license_number == payload.license_number).first():
        raise HTTPException(status_code=400, detail="License number already registered")
    if db.query(Driver).filter(Driver.vehicle_plate == payload.vehicle_plate).first():
        raise HTTPException(status_code=400, detail="Vehicle plate already registered")

    driver = Driver(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        hashed_password=hash_password(payload.password),
        license_number=payload.license_number,
        vehicle_model=payload.vehicle_model,
        vehicle_plate=payload.vehicle_plate,
        can_drive_manual=payload.can_drive_manual,
    )
    db.add(driver)
    db.commit()
    db.refresh(driver)

    token = create_access_token({"sub": str(driver.id), "role": "driver"})
    return Token(access_token=token, role="driver")


@router.post("/driver/login", response_model=Token)
def login_driver(payload: DriverLogin, db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.email == payload.email).first()
    if not driver or not verify_password(payload.password, driver.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not driver.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    token = create_access_token({"sub": str(driver.id), "role": "driver"})
    return Token(access_token=token, role="driver")
