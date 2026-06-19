import { useState } from 'react'
import { sampleStores } from './data.js'
import { loadStores, clearStores } from './storage.js'
import StoreDashboard from './StoreDashboard.jsx'
import DataImport from './DataImport.jsx'

export default function App() {
  const [stores, setStores] = useState(() => loadStores() ?? sampleStores)
  const [isImported, setIsImported] = useState(() => loadStores() != null)
  const [activeId, setActiveId] = useState(stores[0].id)
  const [importing, setImporting] = useState(false)

  const active = stores.find((s) => s.id === activeId) ?? stores[0]

  const handleImported = (next) => {
    setStores(next)
    setIsImported(true)
    if (!next.find((s) => s.id === activeId)) setActiveId(next[0].id)
  }

  const resetToSample = () => {
    clearStores()
    setStores(sampleStores)
    setIsImported(false)
    setActiveId(sampleStores[0].id)
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">🍩</span>
          <div>
            <h1>Dunkin' Store Dashboard</h1>
            <p className="subtitle">Per-store cost, turnover &amp; product performance</p>
          </div>
          <div className="brand-actions">
            {isImported && (
              <button className="btn ghost small" onClick={resetToSample}>Reset to sample</button>
            )}
            <button className="btn primary small" onClick={() => setImporting(true)}>Import CSV</button>
          </div>
        </div>
        <nav className="tabs">
          {stores.map((s) => (
            <button
              key={s.id}
              className={`tab ${s.id === activeId ? 'active' : ''}`}
              onClick={() => setActiveId(s.id)}
            >
              {s.name}
              <span className="tab-city">{s.city}</span>
            </button>
          ))}
        </nav>
      </header>

      <StoreDashboard store={active} />

      <footer className="footer">
        {isImported
          ? <>Showing imported data · stored in this browser · use <strong>Import CSV</strong> to update</>
          : <>Sample data · click <strong>Import CSV</strong> to load your inventory, weekly earnings &amp; payroll</>}
      </footer>

      {importing && (
        <DataImport
          currentStores={stores}
          onImported={handleImported}
          onClose={() => setImporting(false)}
        />
      )}
    </div>
  )
}
