from datetime import datetime
from pydantic import BaseModel, field_validator


class ReviewCreate(BaseModel):
    rating: int
    comment: str | None = None

    @field_validator("rating")
    @classmethod
    def rating_range(cls, v: int) -> int:
        if not 1 <= v <= 5:
            raise ValueError("Rating must be between 1 and 5")
        return v


class ReviewOut(BaseModel):
    id: int
    booking_id: int
    customer_id: int
    driver_id: int
    rating: int
    comment: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
