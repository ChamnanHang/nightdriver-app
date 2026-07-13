from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    DATABASE_URL: str = "sqlite:///./nightdriver.db"

    TELEGRAM_BOT_TOKEN: str = ""

    BASE_FARE: float = 2.50
    PRICE_PER_KM: float = 1.80
    NIGHT_SURGE_MULTIPLIER: float = 1.5
    NIGHT_START_HOUR: int = 20
    NIGHT_END_HOUR: int = 6

    class Config:
        env_file = ".env"


settings = Settings()
