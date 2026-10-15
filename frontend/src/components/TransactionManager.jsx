import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { formatCurrency, formatDate, currentMonth } from '../utils.js';

const emptyForm = () => ({ title: '', amount: '', category: '', date: currentMonth() + '-01', type: 'expense', description: '' });
const categoriesByType = { expense: ['Food', 'Rent', 'Shopping', 'Transport', 'Bills', 'Entertainment', 'Business', 'Health', 'Other'], income: ['Salary', 'Freelance', 'Business', 'Investment', 'Other'] };

export default function TransactionManager({ onChanged, notify }) {
  const [filters, setFilters] = useState({ search: '', type: '', category: '', start_date: '', end_date: '', sort_by: 'date', sort_order: 'desc' });
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState('');
  const [listError, setListError] = useState('');

  const activeFilters = useMemo(() => filters, [filters]);
  useEffect(() => {
    let alive = true;
    const timer = setTimeout(async () => {
      try {
        setListError('');
        const result = await api.transactions(activeFilters);
        if (alive) setRows(result);
      } catch (error) { if (alive) setListError(error.message); }
    }, 180);
    return () => { alive = false; clearTimeout(timer); };
  }, [activeFilters, onChanged]);

  function updateFilter(key, value) {
    setFilters((previous) => ({ ...previous, [key]: value, ...(key === 'type' ? { category: '' } : {}) }));
  }

  function beginCreate() {
    setEditing(null); setForm(emptyForm()); setFormError(''); setFormOpen(true);
  }
  function beginEdit(item) {
    setEditing(item.id); setForm({ ...item, amount: String(item.amount) }); setFormError(''); setFormOpen(true);
  }
  async function submit(event) {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.title.trim() || !form.category.trim() || !form.date || !Number.isFinite(amount) || amount <= 0) {
      setFormError('Add a title, category, date, and an amount greater than zero.'); return;
    }
    setBusy(true); setFormError('');
    try {
      const payload = { ...form, title: form.title.trim(), category: form.category.trim(), amount };
      if (editing) await api.updateTransaction(editing, payload);
      else await api.createTransaction(payload);
      await onChanged(editing ? 'Transaction updated.' : 'Transaction added.');
      setFormOpen(false); setEditing(null);
    } catch (error) { setFormError(error.message); }
    finally { setBusy(false); }
  }
  async function remove(item) {
    if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return;
    try { await api.deleteTransaction(item.id); await onChanged('Transaction deleted.'); }
    catch (error) { notify(error.message, true); }
  }
  async function exportCsv() {
    try { await api.exportTransactions(filters); notify('Filtered transactions exported.'); }
    catch (error) { notify(error.message, true); }
  }

  const categoryOptions = categoriesByType[filters.type] || [...new Set(rows.map((row) => row.category))].sort();
  return <>
    <div className="page-heading heading-row"><div><span className="eyebrow">YOUR MONEY MOVES</span><h1>Transactions</h1><p>Every bit of income and spending, all in one place.</p></div><button className="button primary" onClick={beginCreate}>＋ Add transaction</button></div>
    <section className="panel transaction-panel">
      <div className="filter-toolbar"><label className="search-field"><span>⌕</span><input aria-label="Search title" placeholder="Search transactions…" value={filters.search} onChange={(e) => updateFilter('search', e.target.value)} /></label>
        <select aria-label="Filter by type" value={filters.type} onChange={(e) => updateFilter('type', e.target.value)}><option value="">All types</option><option value="income">Income</option><option value="expense">Expenses</option></select>
        <select aria-label="Filter by category" value={filters.category} onChange={(e) => updateFilter('category', e.target.value)}><option value="">All categories</option>{categoryOptions.map((item) => <option key={item}>{item}</option>)}</select>
        <label className="date-filter"><span>From</span><input aria-label="Start date" type="date" value={filters.start_date} onChange={(e) => updateFilter('start_date', e.target.value)} /></label>
        <label className="date-filter"><span>To</span><input aria-label="End date" type="date" value={filters.end_date} onChange={(e) => updateFilter('end_date', e.target.value)} /></label>
        <select aria-label="Sort transactions" value={`${filters.sort_by}:${filters.sort_order}`} onChange={(e) => { const [sort_by, sort_order] = e.target.value.split(':'); setFilters((f) => ({ ...f, sort_by, sort_order })); }}><option value="date:desc">Newest first</option><option value="date:asc">Oldest first</option><option value="amount:desc">Amount: high to low</option><option value="amount:asc">Amount: low to high</option></select>
        <button className="button subtle" onClick={exportCsv}>↓ Export CSV</button>
      </div>
      {listError && <div className="inline-error" role="alert">{listError}</div>}
      <div className="table-wrap"><table><thead><tr><th>TRANSACTION</th><th>CATEGORY</th><th>DATE</th><th>TYPE</th><th className="align-right">AMOUNT</th><th className="align-right">ACTIONS</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id}><td><strong>{item.title}</strong>{item.description && <small className="table-description">{item.description}</small>}</td><td><span className="category-pill">{item.category}</span></td><td>{formatDate(item.date)}</td><td><span className={`type-pill ${item.type}`}>{item.type}</span></td><td className={`align-right money ${item.type === 'income' ? 'amount-income' : ''}`}>{item.type === 'income' ? '+' : '−'}{formatCurrency(item.amount)}</td><td className="align-right action-cell"><button aria-label={`Edit ${item.title}`} className="icon-button" onClick={() => beginEdit(item)}>✎</button><button aria-label={`Delete ${item.title}`} className="icon-button danger-icon" onClick={() => remove(item)}>⌫</button></td></tr>)}</tbody></table>
        {!rows.length && !listError && <div className="empty-state"><span>◎</span><strong>No transactions found</strong><p>Try changing your filters or add your first transaction.</p><button className="button primary" onClick={beginCreate}>＋ Add transaction</button></div>}
      </div>
      <div className="table-footer">Showing {rows.length} {rows.length === 1 ? 'transaction' : 'transactions'}</div>
    </section>
    {formOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) setFormOpen(false); }}><section className="modal panel" role="dialog" aria-modal="true" aria-labelledby="transaction-form-title"><div className="modal-heading"><div><span className="eyebrow">TRANSACTION DETAILS</span><h2 id="transaction-form-title">{editing ? 'Edit transaction' : 'Add a transaction'}</h2></div><button className="icon-button" aria-label="Close form" onClick={() => setFormOpen(false)}>×</button></div>
      <form onSubmit={submit} className="form-grid"><label className="field full-field">Title<input autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength="120" required placeholder="e.g. Grocery shopping" /></label>
        <label className="field">Amount (₹)<input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required placeholder="0" /></label>
        <label className="field">Type<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, category: '' })}><option value="expense">Expense</option><option value="income">Income</option></select></label>
        <label className="field">Category<input list="transaction-categories" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required placeholder="Choose or type a category" /><datalist id="transaction-categories">{categoriesByType[form.type].map((item) => <option key={item} value={item} />)}</datalist></label>
        <label className="field">Date<input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></label>
        <label className="field full-field">Description <span className="optional">Optional</span><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength="500" rows="3" placeholder="Add a note…" /></label>
        {formError && <div className="inline-error full-field" role="alert">{formError}</div>}
        <div className="form-actions full-field"><button type="button" className="button subtle" disabled={busy} onClick={() => setFormOpen(false)}>Cancel</button><button className="button primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add transaction'}</button></div>
      </form></section></div>}
  </>;
}
