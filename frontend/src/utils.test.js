import { describe, expect, it } from 'vitest';
import { formatCurrency, formatDate, currentMonth, monthTitle } from './utils.js';

describe('presentation helpers', () => {
  it('formats amounts using Indian Rupees', () => {
    expect(formatCurrency(125000)).toContain('₹');
    expect(formatCurrency(125000)).toContain('1,25,000');
  });

  it('formats valid dates and handles missing or invalid values', () => {
    expect(formatDate('2024-01-05')).toContain('2024');
    expect(formatDate('')).toBe('—');
    expect(formatDate('not-a-date')).toBe('—');
  });

  it('returns a usable month label and current month key', () => {
    expect(currentMonth()).toMatch(/^\d{4}-\d{2}$/);
    expect(monthTitle('2024-05')).toContain('2024');
  });
});
