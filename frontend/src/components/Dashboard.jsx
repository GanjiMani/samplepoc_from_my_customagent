import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart } from 'recharts';
import { formatCurrency, formatDate, monthTitle } from '../utils.js';

const colors = ['#6485e8', '#ffae62', '#4cbea0', '#ab82e8', '#f27e88', '#59b6ce', '#a6c96a'];

function EmptyChart({ text }) { return <div className="chart-empty">{text}</div>; }

export default function Dashboard({ data }) {
  if (!data) return <div className="page-heading"><h1>Dashboard</h1><p>Loading your overview…</p></div>;
  const cards = [
    { label: 'Income this month', value: data.monthly_income, icon: '↗', tone: 'green', caption: 'Money coming in' },
    { label: 'Expenses this month', value: data.monthly_expenses, icon: '↘', tone: 'coral', caption: 'Money going out' },
    { label: 'Available balance', value: data.remaining_balance, icon: '₹', tone: 'blue', caption: monthTitle(data.month) },
    { label: 'Net savings to date', value: data.cumulative_net_savings, icon: '✦', tone: 'purple', caption: 'Across all activity' },
  ];
  return <>
    <div className="page-heading heading-row"><div><span className="eyebrow">YOUR MONEY, AT A GLANCE</span><h1>Good things are adding up <span className="wave">✦</span></h1><p>Here’s your financial snapshot for {monthTitle(data.month)}.</p></div><span className="date-chip">◷ &nbsp; This month</span></div>
    <div className="summary-grid">{cards.map((card) => <article className="summary-card" key={card.label}><div className="summary-top"><span>{card.label}</span><span className={`metric-icon ${card.tone}`}>{card.icon}</span></div><strong className="metric-value">{formatCurrency(card.value)}</strong><small>{card.caption}</small></article>)}</div>
    <div className="chart-grid">
      <article className="panel chart-panel"><div className="panel-heading"><div><h2>Spending by category</h2><p>Where your money went this month</p></div></div>
        {data.category_expenses?.length ? <div className="pie-layout"><div className="pie-holder"><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={data.category_expenses} dataKey="amount" nameKey="category" innerRadius={62} outerRadius={88} paddingAngle={3}>{data.category_expenses.map((entry, index) => <Cell key={entry.category} fill={colors[index % colors.length]} />)}</Pie><Tooltip formatter={(value) => formatCurrency(value)} /></PieChart></ResponsiveContainer></div><div className="legend-list">{data.category_expenses.map((entry, index) => <div className="legend-row" key={entry.category}><span className="legend-dot" style={{ background: colors[index % colors.length] }} /><span>{entry.category}</span><strong>{formatCurrency(entry.amount)}</strong></div>)}</div></div> : <EmptyChart text="No expenses recorded this month." />}
      </article>
      <article className="panel chart-panel"><div className="panel-heading"><div><h2>Income vs expenses</h2><p>A monthly cash-flow check</p></div><span className="chart-key"><i className="income-key" /> Income <i className="expense-key" /> Expenses</span></div>
        <div className="chart-holder">{data.income_expenses_series?.length ? <ResponsiveContainer width="100%" height={235}><BarChart data={data.income_expenses_series} barGap={12}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f5" /><XAxis dataKey="name" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${Math.round(value / 1000)}k`} /><Tooltip formatter={(value) => formatCurrency(value)} /><Bar dataKey="income" fill="#65c6a7" radius={[5, 5, 0, 0]} /><Bar dataKey="expenses" fill="#f28b8c" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer> : <EmptyChart text="No cash-flow data yet." />}</div>
      </article>
      <article className="panel chart-panel trend-panel"><div className="panel-heading"><div><h2>Monthly spending trend</h2><p>Expense totals over the last six months</p></div><span className="trend-label">LAST 6 MONTHS</span></div>
        <div className="chart-holder">{data.monthly_trend?.length ? <ResponsiveContainer width="100%" height={240}><LineChart data={data.monthly_trend}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f5" /><XAxis dataKey="month" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${Math.round(value / 1000)}k`} /><Tooltip formatter={(value) => formatCurrency(value)} /><Line type="monotone" dataKey="expenses" stroke="#7389e8" strokeWidth={3} dot={{ r: 4, fill: '#7389e8' }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer> : <EmptyChart text="No spending trend available." />}</div>
      </article>
      <article className="panel recent-panel"><div className="panel-heading"><div><h2>Recent transactions</h2><p>Your latest money moves</p></div></div>
        {data.recent_transactions?.length ? <div className="recent-list">{data.recent_transactions.map((item) => <div className="recent-row" key={item.id}><span className={`transaction-symbol ${item.type}`}>{item.type === 'income' ? '↙' : '↗'}</span><span className="recent-description"><strong>{item.title}</strong><small>{item.category} · {formatDate(item.date)}</small></span><strong className={item.type === 'income' ? 'amount-income' : ''}>{item.type === 'income' ? '+' : '−'}{formatCurrency(item.amount)}</strong></div>)}</div> : <EmptyChart text="Your transactions will appear here." />}
      </article>
    </div>
  </>;
}
