from collections import defaultdict
from datetime import date, timedelta
from typing import Any


def month_range(month: str | None) -> tuple[date, date, str]:
    selected = month or date.today().strftime("%Y-%m")
    try:
        year, month_number = (int(part) for part in selected.split("-"))
        start = date(year, month_number, 1)
    except (ValueError, TypeError):
        raise ValueError("month must use YYYY-MM format")
    if not 1 <= start.month <= 12:
        raise ValueError("month must use YYYY-MM format")
    end = date(start.year + (start.month == 12), 1 if start.month == 12 else start.month + 1, 1) - timedelta(days=1)
    return start, end, selected


def _as_date(transaction: dict[str, Any]) -> date:
    return date.fromisoformat(transaction["date"])


def filter_transactions(
    items: list[dict[str, Any]], *, search: str | None = None,
    kind: str | None = None, category: str | None = None,
    start_date: date | None = None, end_date: date | None = None,
    sort_by: str = "date", sort_order: str = "desc",
) -> list[dict[str, Any]]:
    result = list(items)
    if search:
        needle = search.casefold().strip()
        result = [item for item in result if needle in item["title"].casefold()]
    if kind:
        result = [item for item in result if item["type"] == kind]
    if category:
        result = [item for item in result if item["category"].casefold() == category.casefold()]
    if start_date:
        result = [item for item in result if _as_date(item) >= start_date]
    if end_date:
        result = [item for item in result if _as_date(item) <= end_date]
    key = "amount" if sort_by == "amount" else "date"
    result.sort(key=lambda item: (item[key], item["id"]), reverse=sort_order == "desc")
    return result


def dashboard_summary(items: list[dict[str, Any]], month: str | None = None) -> dict[str, Any]:
    start, end, month_label = month_range(month)
    current = [item for item in items if start <= _as_date(item) <= end]
    income = sum(item["amount"] for item in current if item["type"] == "income")
    expenses = sum(item["amount"] for item in current if item["type"] == "expense")
    categories: dict[str, float] = defaultdict(float)
    for item in current:
        if item["type"] == "expense":
            categories[item["category"]] += item["amount"]

    comparison = [{"name": "Income", "income": income, "expenses": expenses}]
    trend = []
    year, month_number = start.year, start.month
    for offset in range(5, -1, -1):
        index = year * 12 + month_number - 1 - offset
        item_year, month_zero = divmod(index, 12)
        first = date(item_year, month_zero + 1, 1)
        following = date(item_year + (first.month == 12), 1 if first.month == 12 else first.month + 1, 1)
        values = [row for row in items if first <= _as_date(row) < following and row["type"] == "expense"]
        trend.append({"month": first.strftime("%b"), "year": first.year, "expenses": sum(row["amount"] for row in values)})

    return {
        "month": month_label,
        "monthly_income": income,
        "monthly_expenses": expenses,
        "remaining_balance": income - expenses,
        "cumulative_net_savings": sum(item["amount"] if item["type"] == "income" else -item["amount"] for item in items),
        "category_expenses": [{"category": key, "amount": value} for key, value in sorted(categories.items())],
        "income_expenses_series": comparison,
        "monthly_trend": trend,
        "recent_transactions": sorted(items, key=lambda item: (item["date"], item["id"]), reverse=True)[:6],
    }


def budget_usage(items: list[dict[str, Any]], definitions: dict[str, Any], month: str | None = None) -> dict[str, Any]:
    start, end, label = month_range(month)
    expenses = [item for item in items if item["type"] == "expense" and start <= _as_date(item) <= end]
    total_spent = sum(item["amount"] for item in expenses)

    def usage(name: str, limit: float, spent: float) -> dict[str, Any]:
        percent = (spent / limit * 100) if limit else (100.0 if spent else 0.0)
        status = "exceeded" if percent > 100 else "warning" if percent >= 80 else "normal"
        return {"category": name, "limit": limit, "spent": spent, "remaining": limit - spent,
                "percent_used": round(percent, 1), "status": status}

    category_rows = []
    for category, limit in definitions["category_limits"].items():
        spent = sum(item["amount"] for item in expenses if item["category"].casefold() == category.casefold())
        category_rows.append(usage(category, limit, spent))
    category_rows.sort(key=lambda row: row["category"].casefold())
    return {
        "month": label,
        "monthly": usage("Overall monthly budget", definitions["monthly_limit"], total_spent),
        "categories": category_rows,
    }


def report_summary(items: list[dict[str, Any]], period: str, start_date: date | None = None,
                   end_date: date | None = None) -> dict[str, Any]:
    today = date.today()
    if (start_date is None) != (end_date is None):
        raise ValueError("Provide both start_date and end_date for a custom range")
    if start_date and end_date:
        start, end = start_date, end_date
        period_name = "custom"
    elif period == "weekly":
        start, end, period_name = today - timedelta(days=today.weekday()), today, "weekly"
    elif period == "monthly":
        start, _, _ = month_range(today.strftime("%Y-%m"))
        end, period_name = today, "monthly"
    elif period == "yearly":
        start, end, period_name = date(today.year, 1, 1), today, "yearly"
    else:
        raise ValueError("period must be weekly, monthly, or yearly")
    if start > end:
        raise ValueError("start_date must be on or before end_date")

    selected = [item for item in items if start <= _as_date(item) <= end]
    income = sum(item["amount"] for item in selected if item["type"] == "income")
    expenses = sum(item["amount"] for item in selected if item["type"] == "expense")
    categories: dict[str, float] = defaultdict(float)
    for item in selected:
        if item["type"] == "expense":
            categories[item["category"]] += item["amount"]
    return {
        "period": period_name,
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "total_income": income,
        "total_expenses": expenses,
        "net_savings": income - expenses,
        "category_breakdown": [{"category": key, "amount": value} for key, value in sorted(categories.items())],
    }
