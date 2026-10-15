from datetime import date
from typing import Literal
from pydantic import BaseModel, Field, field_validator


TransactionType = Literal["income", "expense"]


class TransactionCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    amount: float = Field(gt=0, le=1_000_000_000)
    category: str = Field(min_length=1, max_length=60)
    date: date
    type: TransactionType
    description: str = Field(default="", max_length=500)

    @field_validator("title", "category")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank")
        return value

    @field_validator("description")
    @classmethod
    def strip_description(cls, value: str) -> str:
        return value.strip()


class TransactionUpdate(TransactionCreate):
    pass


class BudgetUpdate(BaseModel):
    monthly_limit: float = Field(ge=0, le=1_000_000_000)
    category_limits: dict[str, float]

    @field_validator("category_limits")
    @classmethod
    def validate_category_limits(cls, value: dict[str, float]) -> dict[str, float]:
        normalized: dict[str, float] = {}
        for category, amount in value.items():
            name = category.strip()
            if not name:
                raise ValueError("Budget category names cannot be blank")
            if amount < 0 or amount > 1_000_000_000:
                raise ValueError("Category budgets must be non-negative and within the supported limit")
            normalized[name] = amount
        return normalized
