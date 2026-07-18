import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import admin, auth, bookings, drivers, reviews, telegram, users

import app.models.user      # noqa: F401
import app.models.driver    # noqa: F401
import app.models.booking   # noqa: F401
import app.models.review    # noqa: F401
import app.models.pricing   # noqa: F401
import app.models.zone      # noqa: F401

try:
    Base.metadata.create_all(bind=engine)
except Exception as exc:
    import logging
    logging.getLogger(__name__).warning("DB init skipped: %s", exc)

app = FastAPI(
    title="NightDriver — Designated Driver Booking API",
    description=(
        "Book a sober driver to take you home safely at night. "
        "Supports customer & driver registration, real-time booking lifecycle, "
        "fare calculation with night-surge pricing, and trip reviews."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(drivers.router)
app.include_router(bookings.router)
app.include_router(reviews.router)
app.include_router(telegram.router)


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "service": "NightDriver API"}


# Serve built React frontend locally — Vercel handles static files on its own
STATIC_DIR = Path(__file__).parent.parent / "frontend" / "dist"

if STATIC_DIR.exists():
    from fastapi.staticfiles import StaticFiles  # requires aiofiles
    from fastapi.responses import FileResponse

    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str):
        return FileResponse(STATIC_DIR / "index.html")
