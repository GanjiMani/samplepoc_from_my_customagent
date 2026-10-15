import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from './api.js';

function jsonResponse(body = {}) {
  return {
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => body,
  };
}

describe('API client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse()));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('routes transaction calls through the relative /api path and preserves filters', async () => {
    await api.transactions({
      search: 'coffee & tea',
      type: 'expense',
      category: '',
      start_date: '2024-01-01',
      sort_by: 'date',
      sort_order: 'desc',
      ignored: null,
    });

    expect(fetch).toHaveBeenCalledWith(
      '/api/transactions?search=coffee+%26+tea&type=expense&start_date=2024-01-01&sort_by=date&sort_order=desc',
      { headers: {} },
    );
  });

  it('preserves the dashboard month query parameter', async () => {
    await api.dashboard({ month: '2024-03' });

    expect(fetch).toHaveBeenCalledWith('/api/dashboard?month=2024-03', {
      headers: {},
    });
  });

  it('preserves JSON request method, body, and content type', async () => {
    const payload = { title: 'Coffee', amount: 5 };
    await api.createTransaction(payload);

    expect(fetch).toHaveBeenCalledWith('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('shows an actionable message when the backend cannot be reached', async () => {
    fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(api.dashboard()).rejects.toThrow(
      'Could not reach the API. Start the FastAPI server at http://localhost:8000.',
    );
  });
});
