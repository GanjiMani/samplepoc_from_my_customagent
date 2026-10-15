const API_BASE = '/api';

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
    });
  } catch {
    throw new Error('Could not reach the API. Start the FastAPI server at http://localhost:8000.');
  }
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      const detail = body.detail;
      message = Array.isArray(detail) ? detail.map((item) => item.msg).join(', ') : detail || message;
    } catch { /* retain the status-based message */ }
    throw new Error(message);
  }
  if (response.headers.get('content-type')?.includes('text/csv')) return response.blob();
  return response.json();
}

function queryString(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value !== undefined && value !== null) query.set(key, value);
  });
  const result = query.toString();
  return result ? `?${result}` : '';
}

export const api = {
  dashboard: (filters = {}) => request(`/dashboard${queryString(filters)}`),
  transactions: (filters = {}) => request(`/transactions${queryString(filters)}`),
  createTransaction: (payload) => request('/transactions', { method: 'POST', body: JSON.stringify(payload) }),
  updateTransaction: (id, payload) => request(`/transactions/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteTransaction: (id) => request(`/transactions/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  budgets: () => request('/budgets'),
  updateBudgets: (payload) => request('/budgets', { method: 'PUT', body: JSON.stringify(payload) }),
  report: (filters = {}) => request(`/reports${queryString(filters)}`),
  reset: () => request('/reset', { method: 'POST' }),
  async exportTransactions(filters = {}) {
    const blob = await request(`/transactions/export.csv${queryString(filters)}`);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'transactions.csv';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  },
};
