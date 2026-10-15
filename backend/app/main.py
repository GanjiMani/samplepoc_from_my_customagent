import csv
import io
from datetime import date
from typing import Literal

from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware

from . import data
from .calculations import budget_usage, dashboard_summary, filter_transactions, report_summary
from .schemas import BudgetUpdate, TransactionCreate, TransactionUpdate

app = FastAPI(title="Personal Expense Tracker API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)


def _check_range(start_date: date | None, end_date: date | None) -> None:
    if start_date and end_date and start_date > end_date:
        raise HTTPException(status_code=422, detail="start_date must be on or before end_date")


def _filtered(search: str | None, kind: str | None, category: str | None,
              start_date: date | None, end_date: date | None,
              sort_by: str, sort_order: str) -> list[dict]:
    _check_range(start_date, end_date)
    return filter_transactions(data.transactions, search=search, kind=kind, category=category,
                               start_date=start_date, end_date=end_date,
                               sort_by=sort_by, sort_order=sort_order)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/dashboard")
def get_dashboard(month: str | None = Query(default=None, pattern=r"^\d{4}-(0[1-9]|1[0-2])$")) -> dict:
    return dashboard_summary(data.transactions, month)


@app.get("/api/transactions")
def list_transactions(
    search: str | None = None,
    type: Literal["income", "expense"] | None = None,
    category: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    sort_by: Literal["date", "amount"] = "date",
    sort_order: Literal["asc", "desc"] = "desc",
) -> list[dict]:
    return _filtered(search, type, category, start_date, end_date, sort_by, sort_order)


@app.post("/api/transactions", status_code=201)
def create_transaction(payload: TransactionCreate) -> dict:
    item = payload.model_dump()
    item["date"] = payload.date.isoformat()
    import uuid
    item["id"] = str(uuid.uuid4())
    data.transactions.append(item)
    return item


@app.put("/api/transactions/{transaction_id}")
def update_transaction(transaction_id: str, payload: TransactionUpdate) -> dict:
    for index, item in enumerate(data.transactions):
        if item["id"] == transaction_id:
            updated = payload.model_dump()
            updated["date"] = payload.date.isoformat()
            updated["id"] = transaction_id
            data.transactions[index] = updated
            return updated
    raise HTTPException(status_code=404, detail="Transaction not found")


@app.delete("/api/transactions/{transaction_id}")
def delete_transaction(transaction_id: str) -> dict[str, str]:
    for index, item in enumerate(data.transactions):
        if item["id"] == transaction_id:
            data.transactions.pop(index)
            return {"message": "Transaction deleted"}
    raise HTTPException(status_code=404, detail="Transaction not found")


@app.get("/api/budgets")
def get_budgets(month: str | None = Query(default=None, pattern=r"^\d{4}-(0[1-9]|1[0-2])$")) -> dict:
    return budget_usage(data.transactions, data.budgets, month)


@app.put("/api/budgets")
def update_budgets(payload: BudgetUpdate) -> dict:
    data.budgets["monthly_limit"] = payload.monthly_limit
    data.budgets["category_limits"] = payload.category_limits
    return budget_usage(data.transactions, data.budgets)


@app.get("/api/reports")
def get_report(
    period: Literal["weekly", "monthly", "yearly"] = "monthly",
    start_date: date | None = None,
    end_date: date | None = None,
) -> dict:
    if (start_date is None) != (end_date is None):
        raise HTTPException(status_code=422, detail="Provide both start_date and end_date for a custom range")
    _check_range(start_date, end_date)
    try:
        return report_summary(data.transactions, period, start_date, end_date)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


def _safe_csv_cell(value: object) -> str:
    text = str(value if value is not None else "")
    if text.lstrip().startswith(("=", "+", "-", "@", "\t", "\r")):
        text = "'" + text
    return text


@app.get("/api/transactions/export.csv")
def export_transactions(
    search: str | None = None,
    type: Literal["income", "expense"] | None = None,
    category: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    sort_by: Literal["date", "amount"] = "date",
    sort_order: Literal["asc", "desc"] = "desc",
) -> Response:
    rows = _filtered(search, type, category, start_date, end_date, sort_by, sort_order)
    output = io.StringIO(newline="")
    writer = csv.writer(output)
    writer.writerow(["id", "title", "amount (INR)", "category", "date", "type", "description"])
    for item in rows:
        writer.writerow([_safe_csv_cell(item[key]) for key in
                         ("id", "title", "amount", "category", "date", "type", "description")])
    return Response(content=output.getvalue(), media_type="text/csv; charset=utf-8",
                    headers={"Content-Disposition": "attachment; filename=transactions.csv"})


@app.post("/api/reset")
def reset_demo_data() -> dict:
    data.reset_data()
    return {"message": "Demo data has been reset", "dashboard": dashboard_summary(data.transactions)}
