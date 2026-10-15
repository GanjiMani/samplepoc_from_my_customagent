import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { formatCurrency, formatDate } from '../utils.js';

export default function Reports({ refreshKey }) {
  const [period, setPeriod] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if ((startDate && !endDate) || (!startDate && endDate)) {
      setError('Choose both a start and end date for a custom report.'); setReport(null); return () => { active = false; };
    }
    setLoading(true); setError('');
    const params = startDate && endDate ? { start_date: startDate, end_date: endDate } : { period };
    api.report(params).then((result) => { if (active) setReport(result); })
      .catch((problem) => { if (active) setError(problem.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [period, startDate, endDate, refreshKey]);

  return <>
    <div className="page-heading"><span className="eyebrow">MAKE SENSE OF THE NUMBERS</span><h1>Reports</h1><p>See how your income and spending add up over time.</p></div>
    <section className="panel report-controls"><div><h2>Choose a reporting period</h2><p>Pick a quick view or set your own date range.</p></div><div className="period-tabs" role="group" aria-label="Report period">{['weekly', 'monthly', 'yearly'].map((value) => <button key={value} className={period === value && !startDate ? 'selected' : ''} onClick={() => { setPeriod(value); setStartDate(''); setEndDate(''); }}>{value[0].toUpperCase() + value.slice(1)}</button>)}</div><div className="custom-dates"><label className="field">Custom start<input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label><label className="field">Custom end<input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></label></div></section>
    {loading && <div className="loading-line"><span className="spinner" /> Building report…</div>}{error && <div className="inline-error" role="alert">{error}</div>}
    {report && <><div className="report-range"><span>REPORTING PERIOD</span><strong>{formatDate(report.start_date)} — {formatDate(report.end_date)}</strong><span className="count-chip">{report.period} summary</span></div>
      <div className="summary-grid report-summary"><article className="summary-card"><div className="summary-top"><span>Total income</span><span className="metric-icon green">↗</span></div><strong className="metric-value">{formatCurrency(report.total_income)}</strong><small>During this period</small></article><article className="summary-card"><div className="summary-top"><span>Total expenses</span><span className="metric-icon coral">↘</span></div><strong className="metric-value">{formatCurrency(report.total_expenses)}</strong><small>During this period</small></article><article className="summary-card"><div className="summary-top"><span>Net savings</span><span className="metric-icon blue">✦</span></div><strong className="metric-value">{formatCurrency(report.net_savings)}</strong><small>Income minus expenses</small></article></div>
      <section className="panel report-breakdown"><div className="panel-heading"><div><h2>Spending by category</h2><p>Expense breakdown for this reporting period</p></div></div>{report.category_breakdown.length ? <div className="report-category-list">{report.category_breakdown.map((item) => { const ratio = report.total_expenses ? item.amount / report.total_expenses * 100 : 0; return <div className="report-category" key={item.category}><div><span>{item.category}</span><strong>{formatCurrency(item.amount)}</strong></div><div className="progress-track"><span className="progress-fill normal" style={{ width: `${ratio}%` }} /></div><small>{ratio.toFixed(1)}% of expenses</small></div>; })}</div> : <div className="empty-state"><span>◎</span><strong>No expenses in this period</strong><p>Choose a different reporting period to explore your spending.</p></div>}</section>
    </>}
  </>;
}
