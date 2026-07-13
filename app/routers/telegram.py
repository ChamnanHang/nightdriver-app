import hashlib
import hmac
import json
import secrets
from urllib.parse import parse_qsl, unquote

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.database import get_db
from app.models.user import User

router = APIRouter(prefix="/telegram", tags=["Telegram Mini App"])


class TelegramAuthRequest(BaseModel):
    init_data: str


def _validate_init_data(init_data: str, bot_token: str) -> dict:
    """Validate Telegram WebApp initData hash and return the parsed user dict."""
    parsed = dict(parse_qsl(init_data, strict_parsing=True))
    received_hash = parsed.pop("hash", None)
    if not received_hash:
        raise ValueError("Missing hash in initData")

    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(parsed.items()))
    secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    expected = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(expected, received_hash):
        raise ValueError("initData hash mismatch")

    return json.loads(unquote(parsed.get("user", "{}")))


@router.post("/auth")
def telegram_auth(payload: TelegramAuthRequest, db: Session = Depends(get_db)):
    """
    Called by the Mini App on launch.
    Validates Telegram initData, then auto-creates or logs in the user.
    Returns a JWT token identical to the regular auth flow.
    """
    if not settings.TELEGRAM_BOT_TOKEN:
        raise HTTPException(status_code=501, detail="TELEGRAM_BOT_TOKEN not configured")

    try:
        tg_user = _validate_init_data(payload.init_data, settings.TELEGRAM_BOT_TOKEN)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    tg_id = str(tg_user.get("id", ""))
    if not tg_id:
        raise HTTPException(status_code=400, detail="No user id in initData")

    # Synthetic email & phone so the user row is always unique per Telegram account
    synthetic_email = f"tg_{tg_id}@telegram.nightdriver.app"
    synthetic_phone = f"tg{tg_id}"

    full_name = (
        f"{tg_user.get('first_name', '')} {tg_user.get('last_name', '')}".strip()
        or tg_user.get("username", f"User {tg_id}")
    )

    user = db.query(User).filter(User.email == synthetic_email).first()
    if not user:
        user = User(
            full_name=full_name,
            email=synthetic_email,
            phone=synthetic_phone,
            hashed_password=hash_password(secrets.token_hex(32)),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": "customer"})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": "customer",
        "user": {"id": user.id, "full_name": user.full_name},
    }
