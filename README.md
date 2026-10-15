# Personal Expense Tracker

A responsive React dashboard backed by a FastAPI REST API for tracking income, expenses, category budgets, and reports. All money is shown in Indian Rupees (₹).

## Features

- Dashboard with current-month income, expenses, balance, cumulative net savings, category spending, cash-flow comparison, six-month spending trend, and recent activity.
- Transaction create, edit, delete, title search, type/category/date filters, date/amount sorting, and filtered CSV download.
- Monthly and category budgets with spent, remaining, percentage-used indicators, and 80%/over-limit alerts.
- Weekly, monthly, yearly, and custom-date reports with category expense totals.
- Reset to the original sample transactions and budget definitions.
- Responsive navigation and layout for desktop and mobile.

## Requirements

- Python 3.10 or newer
- Node.js 18 or newer and npm

## Run the backend

From the project root:

```bash
python -m venv .venv
# macOS/Linux
source .venv/bin/activate
# Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
cd backend
uvicorn app.main:app --reload
```

Start the backend before the frontend so API requests can be served. The command above launches the existing `app.main:app` from the `backend` directory. The API is available at `http://localhost:8000`; interactive API documentation is at `http://localhost:8000/docs`. If `/api/transactions` still returns 404, stop any existing backend process and restart it with the command above to ensure it is serving this workspace.

## Run the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL, usually `http://localhost:5173`. During development, the browser sends API requests to the same-origin `/api` path and Vite proxies them to FastAPI at `http://localhost:8000`. Keep the backend running while using the frontend; if it is unavailable, the frontend reports that it could not reach the API. Production hosting must independently route `/api` requests to the backend.

## Tests and build

Backend tests (from the project root, with backend requirements installed):

```bash
python -m pytest backend/tests
```

Frontend helper tests and production build:

```bash
cd frontend
npm test
npm run build
```

## API overview

- `GET /api/dashboard` — dashboard calculations, optionally `?month=YYYY-MM`.
- `GET /api/transactions` — list and filter with `search`, `type`, `category`, `start_date`, `end_date`, `sort_by`, and `sort_order`.
- `POST /api/transactions`, `PUT /api/transactions/{id}`, `DELETE /api/transactions/{id}` — transaction CRUD.
- `GET /api/budgets`, `PUT /api/budgets` — budget usage and budget definition updates.
- `GET /api/reports` — `period=weekly|monthly|yearly` or both custom `start_date` and `end_date`.
- `GET /api/transactions/export.csv` — CSV export using the transaction list filters.
- `POST /api/reset` — restore startup demo transactions and budgets.

## Data and limitations

The FastAPI process owns all transaction and budget data in Python memory. No database, browser storage, authentication, or persistence is used. Sample dates are generated relative to backend startup; edits are lost on server restart, and the reset endpoint restores the original startup snapshot. The frontend and backend are started independently for local development.
