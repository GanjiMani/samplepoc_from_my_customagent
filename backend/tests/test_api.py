from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient

from app import data
from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def restore_demo_data():
    data.reset_data()
    yield
    data.reset_data()


def test_transaction_list_route_accepts_sort_parameters():
    response = client.get("/api/transactions", params={"sort_by": "date", "sort_order": "desc"})

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def payload(**overrides):
    values = {"title": "Test purchase", "amount": 100, "category": "Food",
              "date": date.today().isoformat(), "type": "expense", "description": "sample"}
    values.update(overrides)
    return values


def test_dashboard_has_seeded_data_and_consistent_totals():
    result = client.get("/api/dashboard").json()
    assert result["monthly_income"] > 0
    assert result["monthly_expenses"] > 0
    assert result["remaining_balance"] == result["monthly_income"] - result["monthly_expenses"]
    assert result["category_expenses"]
    assert len(result["monthly_trend"]) == 6
    assert result["recent_transactions"]


def test_transaction_crud_validation_and_not_found():
    created_response = client.post("/api/transactions", json=payload())
    assert created_response.status_code == 201
    created = created_response.json()
    assert client.put(f"/api/transactions/{created['id']}", json=payload(title="Edited")).json()["title"] == "Edited"
    assert client.delete(f"/api/transactions/{created['id']}").status_code == 200
    assert client.delete(f"/api/transactions/{created['id']}").status_code == 404
    assert client.put("/api/transactions/missing", json=payload()).status_code == 404
    assert client.post("/api/transactions", json=payload(amount=0)).status_code == 422
    assert client.post("/api/transactions", json=payload(title="  ")).status_code == 422


def test_transaction_search_filter_date_and_sort():
    first = client.post("/api/transactions", json=payload(title="Unique apples", amount=100,
                              category="Food", date="2024-01-01")).json()
    second = client.post("/api/transactions", json=payload(title="Unique bananas", amount=300,
                               category="Food", date="2024-01-02", type="income")).json()
    response = client.get("/api/transactions", params={"search": "unique", "category": "food",
                                "start_date": "2024-01-01", "end_date": "2024-01-02", "sort_by": "amount", "sort_order": "asc"})
    assert [item["id"] for item in response.json()] == [first["id"], second["id"]]
    assert client.get("/api/transactions", params={"start_date": "2024-02-01", "end_date": "2024-01-01"}).status_code == 422


def test_budget_updates_thresholds_and_validation():
    client.post("/api/transactions", json=payload(amount=800))
    client.put("/api/budgets", json={"monthly_limit": 1000, "category_limits": {"Food": 1000}})
    result = client.get("/api/budgets").json()
    assert result["monthly"]["status"] == "warning"
    assert result["categories"][0]["percent_used"] == 80
    client.post("/api/transactions", json=payload(title="More food", amount=300))
    result = client.get("/api/budgets").json()
    assert result["monthly"]["status"] == "exceeded"
    assert result["monthly"]["remaining"] < 0
    assert client.put("/api/budgets", json={"monthly_limit": -1, "category_limits": {}}).status_code == 422


def test_reports_period_and_custom_range():
    today = date.today()
    client.post("/api/transactions", json=payload(title="Report income", amount=900, type="income"))
    client.post("/api/transactions", json=payload(title="Report food", amount=200))
    for period in ("weekly", "monthly", "yearly"):
        response = client.get("/api/reports", params={"period": period})
        assert response.status_code == 200
        assert response.json()["period"] == period
    custom = client.get("/api/reports", params={"start_date": today.isoformat(), "end_date": today.isoformat()}).json()
    assert custom["period"] == "custom"
    assert custom["total_income"] == 900
    assert custom["total_expenses"] == 200
    assert custom["net_savings"] == 700
    assert client.get("/api/reports", params={"start_date": today.isoformat()}).status_code == 422


def test_csv_export_filters_escapes_and_neutralizes_formula_values():
    client.post("/api/transactions", json=payload(title='=1+1, "quoted"', description="line one\nline two"))
    response = client.get("/api/transactions/export.csv", params={"search": "=1+1"})
    assert response.status_code == 200
    assert "amount (INR)" in response.text
    assert "'=1+1" in response.text
    assert '""quoted""' in response.text
    assert response.headers["content-type"].startswith("text/csv")


def test_reset_restores_seed_transactions_and_budgets():
    initial_transactions = client.get("/api/transactions").json()
    client.post("/api/transactions", json=payload(title="Temporary"))
    client.put("/api/budgets", json={"monthly_limit": 12, "category_limits": {"Food": 1}})
    response = client.post("/api/reset")
    assert response.status_code == 200
    assert client.get("/api/transactions").json() == initial_transactions
    assert client.get("/api/budgets").json()["monthly"]["limit"] == data.budgets["monthly_limit"]
