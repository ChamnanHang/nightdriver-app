"""Seed the database with test data — Phnom Penh, Cambodia."""
from datetime import datetime, timezone

from app.core.security import hash_password
from app.database import SessionLocal
from app.models.booking import Booking, BookingStatus
from app.models.driver import Driver
from app.models.review import Review
from app.models.user import User

db = SessionLocal()

print("Clearing old seed data…")
db.query(Review).delete()
db.query(Booking).delete()
db.query(Driver).delete()
db.query(User).delete()
db.commit()

# ── Users ───────────────────────────────────────────────────────────────────
print("Seeding users…")
users = [
    User(full_name="Sophea Chan",   email="alice@test.com",  phone="0811111111", hashed_password=hash_password("test1234")),
    User(full_name="Dara Kim",      email="bob@test.com",    phone="0822222222", hashed_password=hash_password("test1234")),
    User(full_name="Maly Pich",     email="carol@test.com",  phone="0833333333", hashed_password=hash_password("test1234")),
]
db.add_all(users)
db.commit()
for u in users:
    db.refresh(u)

# ── Drivers ─────────────────────────────────────────────────────────────────
# Phnom Penh coordinates — BKK Market area, Riverside, Toul Kork
print("Seeding drivers…")
drivers = [
    Driver(
        full_name="Rith Sok",
        email="david@driver.com",
        phone="0844444444",
        hashed_password=hash_password("test1234"),
        license_number="DL-10001",
        vehicle_model="Toyota Camry 2022",
        vehicle_plate="2A-1234",
        is_available=True,
        average_rating=4.8,
        total_trips=42,
        current_lat=11.5721,   # Near BKK Market
        current_lng=104.9217,
    ),
    Driver(
        full_name="Vanna Ly",
        email="emma@driver.com",
        phone="0855555555",
        hashed_password=hash_password("test1234"),
        license_number="DL-10002",
        vehicle_model="Honda Civic 2023",
        vehicle_plate="2B-5678",
        is_available=True,
        average_rating=4.6,
        total_trips=28,
        current_lat=11.5636,   # Near Riverside
        current_lng=104.9282,
    ),
    Driver(
        full_name="Piseth Nhem",
        email="frank@driver.com",
        phone="0866666666",
        hashed_password=hash_password("test1234"),
        license_number="DL-10003",
        vehicle_model="Mazda 3 2021",
        vehicle_plate="2C-9012",
        is_available=False,
        average_rating=4.9,
        total_trips=87,
        current_lat=11.5817,   # Near Toul Kork
        current_lng=104.9178,
    ),
]
db.add_all(drivers)
db.commit()
for d in drivers:
    db.refresh(d)

# ── Bookings ─────────────────────────────────────────────────────────────────
# Real Phnom Penh landmarks
print("Seeding bookings…")
now = datetime.now(timezone.utc)

bookings = [
    # Completed — Sophea with Rith, Bassac Lane → Toul Kork
    Booking(
        customer_id=users[0].id,
        driver_id=drivers[0].id,
        pickup_address="Bassac Lane, Sothearos Blvd, Phnom Penh",
        pickup_lat=11.5559, pickup_lng=104.9282,
        destination_address="Toul Kork, Phnom Penh",
        destination_lat=11.5817, destination_lng=104.9178,
        distance_km=3.4,
        estimated_fare=8.62,
        final_fare=8.62,
        is_night_surge=True,
        status=BookingStatus.COMPLETED,
        notes="I'll be wearing a blue shirt",
        driver_accept_lat=11.5721, driver_accept_lng=104.9217,
        eta_minutes=4,
        accepted_at=now, started_at=now, completed_at=now,
    ),
    # Completed — Dara with Vanna, Riverside → BKK1
    Booking(
        customer_id=users[1].id,
        driver_id=drivers[1].id,
        pickup_address="Phnom Penh Riverside, Sisowath Quay",
        pickup_lat=11.5697, pickup_lng=104.9300,
        destination_address="BKK1, Phnom Penh",
        destination_lat=11.5557, destination_lng=104.9235,
        distance_km=2.1,
        estimated_fare=6.28,
        final_fare=6.28,
        is_night_surge=True,
        status=BookingStatus.COMPLETED,
        notes=None,
        driver_accept_lat=11.5636, driver_accept_lng=104.9282,
        eta_minutes=3,
        accepted_at=now, started_at=now, completed_at=now,
    ),
    # Pending — Maly, Wat Phnom → Chamkarmon
    Booking(
        customer_id=users[2].id,
        driver_id=None,
        pickup_address="Wat Phnom, Phnom Penh",
        pickup_lat=11.5764, pickup_lng=104.9218,
        destination_address="Chamkarmon District, Phnom Penh",
        destination_lat=11.5480, destination_lng=104.9220,
        distance_km=3.2,
        estimated_fare=8.26,
        final_fare=None,
        is_night_surge=True,
        status=BookingStatus.PENDING,
        notes="Please call when you arrive",
    ),
    # Accepted — Sophea with Piseth, Night Market → Daun Penh
    Booking(
        customer_id=users[0].id,
        driver_id=drivers[2].id,
        pickup_address="Phnom Penh Night Market, Chroy Changvar",
        pickup_lat=11.5784, pickup_lng=104.9393,
        destination_address="Daun Penh District, Phnom Penh",
        destination_lat=11.5696, destination_lng=104.9279,
        distance_km=2.8,
        estimated_fare=7.54,
        final_fare=None,
        is_night_surge=True,
        status=BookingStatus.ACCEPTED,
        notes=None,
        driver_accept_lat=11.5817, driver_accept_lng=104.9178,
        eta_minutes=6,
        accepted_at=now,
    ),
    # Cancelled — Dara
    Booking(
        customer_id=users[1].id,
        driver_id=None,
        pickup_address="Aeon Mall 1, Phnom Penh",
        pickup_lat=11.5529, pickup_lng=104.9289,
        destination_address="Olympia City Mall, Phnom Penh",
        destination_lat=11.5608, destination_lng=104.9094,
        distance_km=2.5,
        estimated_fare=7.00,
        final_fare=None,
        is_night_surge=False,
        status=BookingStatus.CANCELLED,
        cancel_reason="Found a ride with friends",
    ),
]
db.add_all(bookings)
db.commit()
for b in bookings:
    db.refresh(b)

# ── Reviews ──────────────────────────────────────────────────────────────────
print("Seeding reviews…")
reviews = [
    Review(
        booking_id=bookings[0].id,
        customer_id=users[0].id,
        driver_id=drivers[0].id,
        rating=5,
        comment="Rith was super professional and arrived on time. Highly recommend!",
    ),
    Review(
        booking_id=bookings[1].id,
        customer_id=users[1].id,
        driver_id=drivers[1].id,
        rating=4,
        comment="Great ride, smooth and safe. Vanna was very friendly.",
    ),
]
db.add_all(reviews)
db.commit()
db.close()

print()
print("✅ Seed complete! (Phnom Penh, Cambodia)")
print(f"   {len(users)} users     → alice@test.com / bob@test.com / carol@test.com")
print(f"   {len(drivers)} drivers  → david@driver.com / emma@driver.com / frank@driver.com")
print(f"   {len(bookings)} bookings → 2 completed, 1 pending, 1 accepted, 1 cancelled")
print(f"   {len(reviews)} reviews")
print()
print("   All passwords: test1234")
