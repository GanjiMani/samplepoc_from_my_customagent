import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import AppShell from './components/AppShell.jsx';
import Dashboard from './components/Dashboard.jsx';
import TransactionManager from './components/TransactionManager.jsx';
import BudgetManager from './components/BudgetManager.jsx';
import Reports from './components/Reports.jsx';
import Settings from './components/Settings.jsx';

export default function App() {
  const [active, setActive] = useState('Dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(async (successMessage = '') => {
    setLoading(true); setError('');
    try {
      const summary = await api.dashboard();
      setDashboard(summary);
      setRefreshKey((key) => key + 1);
      if (successMessage) setMessage(successMessage);
    } catch (problem) { setError(problem.message); throw problem; }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh().catch(() => {}); }, [refresh]);
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => setMessage(''), 3500);
    return () => clearTimeout(timer);
  }, [message]);

  async function resetDemo() {
    setError(''); setLoading(true);
    try {
      await api.reset();
      const summary = await api.dashboard();
      setDashboard(summary); setRefreshKey((key) => key + 1); setMessage('Demo data restored to its original state.');
    } catch (problem) { setError(problem.message); throw problem; }
    finally { setLoading(false); }
  }
  function notify(text, isError = false) {
    if (isError) setError(text);
    else { setError(''); setMessage(text); }
  }

  let content;
  if (active === 'Dashboard') content = <Dashboard data={dashboard} />;
  else if (active === 'Transactions') content = <TransactionManager key="transactions" onChanged={refresh} notify={notify} />;
  else if (active === 'Budgets') content = <BudgetManager refreshKey={refreshKey} onChanged={refresh} notify={notify} />;
  else if (active === 'Reports') content = <Reports refreshKey={refreshKey} />;
  else content = <Settings onReset={resetDemo} />;

  return <AppShell active={active} onNavigate={(page) => { setActive(page); setError(''); }} loading={loading} error={error} message={message}>{content}</AppShell>;
}
