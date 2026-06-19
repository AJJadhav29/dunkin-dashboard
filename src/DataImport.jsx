import { useState } from 'react'
import { parseFile, detectType, buildStores } from './parseCsv.js'
import { saveStores } from './storage.js'

const SLOTS = [
  {
    key: 'inventory',
    title: 'Inventory / sales',
    hint: 'one row per item per store',
    columns: 'store, item, category, unitsSold, costPrice, sellPrice, trendPct',
  },
  {
    key: 'weekly',
    title: 'Weekly earnings & expense',
    hint: 'one row per week per store',
    columns: 'store, week, earnings, rent, utilities, otherExpense',
  },
  {
    key: 'payroll',
    title: 'Biweekly payroll',
    hint: 'one row per employee per pay period',
    columns: 'store, employee, grossPay',
  },
]

export default function DataImport({ currentStores, onImported, onClose }) {
  const [files, setFiles] = useState({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [warnings, setWarnings] = useState([])

  const pick = (key) => (e) => {
    const f = e.target.files?.[0] ?? null
    setFiles((prev) => ({ ...prev, [key]: f }))
    setError(null)
    setWarnings([])
  }

  const anyFile = SLOTS.some((s) => files[s.key])

  async function runImport() {
    setBusy(true)
    setError(null)
    setWarnings([])
    try {
      const parsed = {}
      const notes = []
      for (const slot of SLOTS) {
        const f = files[slot.key]
        if (!f) continue
        const rows = await parseFile(f)
        if (!rows.length) { notes.push(`${slot.title}: no data rows found.`); continue }
        const detected = detectType(rows)
        if (detected && detected !== slot.key) {
          notes.push(`Heads up: "${f.name}" looks like ${detected} data but was uploaded as ${slot.key}.`)
        }
        parsed[slot.key] = rows
      }
      if (!Object.keys(parsed).length) {
        setError('No usable rows in the selected file(s). Check the headers match the expected columns.')
        setBusy(false)
        return
      }
      const { stores, warnings } = buildStores(parsed, currentStores)
      saveStores(stores)
      onImported(stores)
      setWarnings([...notes, ...warnings])
      // keep the modal open briefly so warnings are visible; close if clean
      if (notes.length === 0 && warnings.length === 0) onClose()
    } catch (err) {
      setError(err?.message ?? 'Failed to parse CSV.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Import store data</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <p className="modal-sub">
          Upload one or more CSVs. Files you skip keep their current values. Column
          names are matched loosely (case &amp; spacing ignored).
        </p>

        <div className="slots">
          {SLOTS.map((slot) => (
            <label key={slot.key} className={`slot ${files[slot.key] ? 'filled' : ''}`}>
              <div className="slot-head">
                <span className="slot-title">{slot.title}</span>
                <span className="slot-hint">{slot.hint}</span>
              </div>
              <code className="slot-cols">{slot.columns}</code>
              <input type="file" accept=".csv,text/csv" onChange={pick(slot.key)} />
              <span className="slot-file">
                {files[slot.key]?.name ?? 'Choose CSV…'}
              </span>
            </label>
          ))}
        </div>

        {error && <div className="msg error">{error}</div>}
        {warnings.length > 0 && (
          <div className="msg warn">
            <strong>Imported with notes:</strong>
            <ul>{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={!anyFile || busy} onClick={runImport}>
            {busy ? 'Importing…' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  )
}
