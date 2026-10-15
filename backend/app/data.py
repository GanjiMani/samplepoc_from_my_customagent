from copy import deepcopy
from datetime import date
from typing import Any
import uuid


def _month_offset(day: date, offset: int) -> date:
    """Return a date shifted by whole months, clamping the day if necessary."""
    month_index = day.year * 12 + day.month - 1 + offset
    year, month_zero = divmod(month_index, 12)
    month = month_zero + 1
    # All seeded dates are at most the 28th, so this clamp is sufficient.
    return date(year, month, min(day.day, 28))


def _transaction(title: str, amount: float, category: str, offset: int, day: int,
                 kind: str, description: str = "") -> dict[str, Any]:
    today = date.today()
    target_month = _month_offset(today, offset)
    target_date = target_month.replace(day=min(day, 28))
    return {
        "id": str(uuid.uuid4()),
        "title": title,
        "amount": amount,
        "category": category,
        "date": target_date.isoformat(),
        "type": kind,
        "description": description,
    }


def _make_seed_transactions() -> list[dict[str, Any]]:
    rows = [
        ("Monthly salary", 125000, "Salary", 0, 1, "income", "Monthly take-home pay"),
        ("Apartment rent", 32000, "Rent", 0, 2, "expense", "Monthly rent"),
        ("Grocery market", 6450, "Food", 0, 4, "expense", "Weekly groceries"),
        ("Electricity and internet", 2850, "Bills", 0, 6, "expense", "Home utilities"),
        ("Freelance design project", 18000, "Freelance", 0, 8, "income", "Brand identity project"),
        ("Commute and cabs", 2150, "Transport", 0, 9, "expense", "Local travel"),
        ("Weekend dinner", 2350, "Entertainment", 0, 11, "expense", "Dinner with friends"),
        ("New running shoes", 4200, "Shopping", 0, 13, "expense", "Fitness gear"),
        ("Restaurant supplies", 7800, "Business", 0, 15, "expense", "Small business supplies"),
        ("Monthly salary", 125000, "Salary", -1, 1, "income", "Monthly take-home pay"),
        ("Apartment rent", 32000, "Rent", -1, 2, "expense", "Monthly rent"),
        ("Grocery market", 7100, "Food", -1, 5, "expense", "Weekly groceries"),
        ("Consulting payment", 24000, "Freelance", -1, 10, "income", "Consulting work"),
        ("Water and power", 3100, "Bills", -1, 12, "expense", "Home utilities"),
        ("Monthly salary", 122000, "Salary", -2, 1, "income", "Monthly take-home pay"),
        ("Apartment rent", 32000, "Rent", -2, 2, "expense", "Monthly rent"),
        ("Grocery market", 5900, "Food", -2, 7, "expense", "Weekly groceries"),
        ("Online business order", 14500, "Business", -2, 14, "income", "Small business income"),
        ("Train tickets", 3600, "Transport", -2, 18, "expense", "Out-of-town visit"),
        ("Streaming and cinema", 1800, "Entertainment", -3, 6, "expense", "Monthly entertainment"),
        ("Monthly salary", 120000, "Salary", -3, 1, "income", "Monthly take-home pay"),
        ("Apartment rent", 31000, "Rent", -3, 2, "expense", "Monthly rent"),
        ("Freelance illustration", 12500, "Freelance", -3, 20, "income", "Illustration commission"),
        ("Household shopping", 5200, "Shopping", -4, 16, "expense", "Home essentials"),
        ("Monthly salary", 120000, "Salary", -4, 1, "income", "Monthly take-home pay"),
        ("Apartment rent", 31000, "Rent", -4, 2, "expense", "Monthly rent"),
        ("Food and dining", 8400, "Food", -5, 9, "expense", "Groceries and dining"),
        ("Monthly salary", 118000, "Salary", -5, 1, "income", "Monthly take-home pay"),
    ]
    return [_transaction(*row) for row in rows]


_seed_transactions = _make_seed_transactions()
_seed_budgets = {
    "monthly_limit": 75000.0,
    "category_limits": {
        "Rent": 35000.0,
        "Food": 15000.0,
        "Bills": 7000.0,
        "Transport": 6000.0,
        "Shopping": 8000.0,
        "Entertainment": 5000.0,
        "Business": 10000.0,
    },
}

transactions: list[dict[str, Any]] = deepcopy(_seed_transactions)
budgets: dict[str, Any] = deepcopy(_seed_budgets)


def reset_data() -> None:
    """Restore the original in-memory startup dataset."""
    transactions.clear()
    transactions.extend(deepcopy(_seed_transactions))
    budgets.clear()
    budgets.update(deepcopy(_seed_budgets))
