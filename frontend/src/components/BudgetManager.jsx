import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { formatCurrency } from '../utils.js';

function BudgetCard({ item, overall = false }) {
  const percent = item.percent_used || 0;
  const state = item.status;
  const barWidth = Math.min(percent, 100);
  return <article className={`budget-card ${overall ? 'overall-budget' : ''}`}><div className="budget-card-top"><div><span className="budget-category">{overall ? 'MONTHLY SPENDING LIMIT' : item.category}</span>{overall && <h2>Overall monthly budget</h2>}</div><span className={`budget-status ${state}`}>{state === 'exceeded' ? 'Over budget' : state === 'warning' ? 'Near limit' : 'On track'}</span></div>
    <div className="budget-amount-line"><strong>{formatCurrency(item.spent)}</strong><span>of {formatCurrency(item.limit)}</span></div>
    <div className="progress-track" role="progressbar" aria-label={`${overall ? 'Overall' : item.category} budget used`} aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100"><span className={`progress-fill ${state}`} style={{ width: `${barWidth}%` }} /></div>
    <div className="budget-foot"><span>{Math.round(percent)}% used</span><span className={item.remaining < 0 ? 'over-amount' : ''}>{item.remaining >= 0 ? `${formatCurrency(item.remaining)} left` : `${formatCurrency(Math.abs(item.remaining))} over`}</span></div>
    {state !== 'normal' && <p className={`budget-alert ${state}`}>{state === 'exceeded' ? 'You have exceeded this budget.' : 'You have used at least 80% of this budget.'}</p>}
  </article>;
}

export default function BudgetManager({ refreshKey, onChanged, notify }) {
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [monthly, setMonthly] = useState('');
  const [categories, setCategories] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.budgets().then((result) => {
      if (!active) return;
      setData(result); setMonthly(String(result.monthly.limit));
      setCategories(Object.fromEntries(result.categories.map((row) => [row.category, String(row.limit)])));
      setError('');
    }).catch((problem) => { if (active) setError(problem.message); });
    return () => { active = false; };
  }, [refreshKey]);

  async function save(event) {
    event.preventDefault();
    const monthlyLimit = Number(monthly);
    const categoryLimits = {};
    for (const [name, value] of Object.entries(categories)) {
      if (value === '' || !Number.isFinite(Number(value)) || Number(value) < 0) { setError('Budget values must be zero or greater.'); return; }
      categoryLimits[name] = Number(value);
    }
    if (!Number.isFinite(monthlyLimit) || monthlyLimit < 0) { setError('Monthly budget must be zero or greater.'); return; }
    setSaving(true); setError('');
    try {
      await api.updateBudgets({ monthly_limit: monthlyLimit, category_limits: categoryLimits });
      await onChanged('Budgets updated.'); setEditing(false);
    } catch (problem) { setError(problem.message); }
    finally { setSaving(false); }
  }

  if (!data && !error) return <div className="page-heading"><h1>Budgets</h1><p>Loading your budgets…</p></div>;
  return <>
    <div className="page-heading heading-row"><div><span className="eyebrow">PLAN WITH CONFIDENCE</span><h1>Budgets</h1><p>Keep an eye on spending and stay within your monthly goals.</p></div><button className="button primary" onClick={() => setEditing(!editing)}>{editing ? 'Cancel editing' : '✎ Edit budgets'}</button></div>
    {error && <div className="inline-error" role="alert">{error}</div>}
    {editing && data && <form className="panel budget-editor" onSubmit={save}><div className="panel-heading"><div><h2>Update budget limits</h2><p>Changes apply to the current in-memory demo data.</p></div></div><label className="field">Monthly spending limit (₹)<input type="number" min="0" step="1" value={monthly} onChange={(e) => setMonthly(e.target.value)} /></label><h3>Category limits</h3><div className="budget-edit-grid">{Object.entries(categories).map(([name, value]) => <label className="field" key={name}>{name} (₹)<input type="number" min="0" step="1" value={value} onChange={(e) => setCategories({ ...categories, [name]: e.target.value })} /></label>)}</div><div className="form-actions"><button className="button primary" disabled={saving}>{saving ? 'Saving…' : 'Save budgets'}</button></div></form>}
    {data && <><div className="budget-overview"><BudgetCard item={data.monthly} overall /><div className="budget-tip"><span>✦</span><div><strong>A little awareness goes a long way</strong><p>You’ll see a heads-up at 80% and an alert when any budget goes over its limit.</p></div></div></div>
      <div className="section-heading"><div><h2>Category budgets</h2><p>Your spending limits by category</p></div><span className="count-chip">{data.categories.length} categories</span></div>
      {data.categories.length ? <div className="budget-grid">{data.categories.map((item) => <BudgetCard key={item.category} item={item} />)}</div> : <div className="panel empty-state"><strong>No category budgets</strong><p>Edit budgets to add category limits.</p></div>}
    </>}
  </>;
}
