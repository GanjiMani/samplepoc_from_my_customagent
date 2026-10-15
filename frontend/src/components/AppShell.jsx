const navigation = [
  { id: 'Dashboard', icon: '◫' },
  { id: 'Transactions', icon: '⇄' },
  { id: 'Budgets', icon: '◉' },
  { id: 'Reports', icon: '▤' },
  { id: 'Settings', icon: '⚙' },
];

export default function AppShell({ active, onNavigate, children, loading, error, message }) {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <a className="brand" href="#dashboard" onClick={(event) => { event.preventDefault(); onNavigate('Dashboard'); }}>
          <span className="brand-mark">₹</span><span>pennywise<small>PERSONAL FINANCE</small></span>
        </a>
        <p className="nav-label">WORKSPACE</p>
        <nav aria-label="Main navigation">
          {navigation.map((item) => <button key={item.id} className={`nav-item ${active === item.id ? 'active' : ''}`} onClick={() => onNavigate(item.id)}>
            <span className="nav-icon" aria-hidden="true">{item.icon}</span>{item.id}
          </button>)}
        </nav>
        <div className="sidebar-note"><span className="note-icon">✦</span><strong>Small steps add up.</strong><p>Keep your finances in view and make every rupee count.</p></div>
        <div className="sidebar-footer"><span className="online-dot" /> Demo data · in memory</div>
      </aside>
      <main className="main-area">
        <header className="topbar"><div className="mobile-brand">₹ <strong>pennywise</strong></div><div className="topbar-caption">PERSONAL EXPENSE TRACKER</div><div className="topbar-user"><span className="avatar">A</span><span>My finances</span></div></header>
        <section className="page-content">
          {error && <div className="notice error" role="alert"><span>!</span>{error}</div>}
          {message && <div className="notice success" role="status"><span>✓</span>{message}</div>}
          {loading && <div className="loading-line" role="status"><span className="spinner" /> Updating your finances…</div>}
          {children}
        </section>
      </main>
    </div>
  );
}
