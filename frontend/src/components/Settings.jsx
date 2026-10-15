import { useState } from 'react';

export default function Settings({ onReset }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function reset() {
    if (!window.confirm('Reset all transactions and budgets to the original demo data? This will discard your changes.')) return;
    setBusy(true); setError('');
    try { await onReset(); }
    catch (problem) { setError(problem.message); }
    finally { setBusy(false); }
  }
  return <>
    <div className="page-heading"><span className="eyebrow">YOUR APP PREFERENCES</span><h1>Settings</h1><p>Manage your demo data and learn how this tracker works.</p></div>
    {error && <div className="inline-error" role="alert">{error}</div>}
    <div className="settings-grid"><section className="panel settings-card"><span className="settings-icon blue">₹</span><span className="eyebrow">DEMO DATA</span><h2>Start fresh, any time</h2><p>Reset all transactions and budgets to the original sample dataset. Any changes you’ve made during this session will be discarded.</p><button className="button danger-button" disabled={busy} onClick={reset}>{busy ? 'Resetting…' : '↻ Reset demo data'}</button></section>
      <section className="panel settings-card"><span className="settings-icon green">✓</span><span className="eyebrow">ABOUT YOUR DATA</span><h2>Private by design</h2><p>This demo keeps data in the FastAPI server’s memory only. Nothing is stored in a database or browser storage, and data returns to its sample state whenever the server restarts.</p><div className="settings-badge"><span className="online-dot" /> In-memory demo · INR (₹)</div></section></div>
  </>;
}
