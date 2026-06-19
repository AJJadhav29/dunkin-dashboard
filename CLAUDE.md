# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # install dependencies
npm run dev        # dev server at http://localhost:5173
npm run build      # production build → dist/
npm run preview    # preview the production build locally
npm run deploy     # build + publish to GitHub Pages (gh-pages)
```

No test suite is configured; there is no lint script.

## Architecture

This is a React + Vite SPA with no backend. All data is either hardcoded sample data or parsed from user-uploaded CSVs and persisted in `localStorage`.

### Data flow

```
src/data.js        ← raw store definitions + deriveStore()
src/parseCsv.js    ← CSV ingestion (PapaParse) → calls deriveStore()
src/storage.js     ← localStorage persistence (key: dunkin.stores.v1)

App.jsx            ← root; initializes stores from localStorage ?? sampleStores
  ├── StoreDashboard.jsx   ← renders all charts/KPIs for the active store
  └── DataImport.jsx       ← modal; orchestrates CSV parsing and store update
```

### The store data model

`deriveStore(rawStore)` in `src/data.js` is the single source of truth for all computed financials. It takes a raw store object and returns the fully-derived shape consumed by the UI:

- **Turnover** — uses `turnoverActual` if set (from weekly CSV), otherwise sums `unitsSold × sellPrice` across items.
- **COGS** — summed `unitsSold × costPrice` per item.
- **Operating costs** — `payroll + rent + utilities`.
- **Net profit** — `turnover - cogs - operatingCosts`.
- **trending / underperforming** — top-3 items by `trendPct > 0` / bottom-3 by `trendPct < 0`.

The derived store shape is what `StoreDashboard` receives as its `store` prop and what gets serialized to `localStorage`.

### CSV import (`src/parseCsv.js`)

Three optional file types are supported; uploading one never wipes data from the others:

| Slot | Key columns | What it updates |
|---|---|---|
| Inventory | `store, item, category, unitsSold, costPrice, sellPrice, trendPct` | Item list per store |
| Weekly earnings | `store, week, earnings, [rent], [utilities]` | `history`, `historyLabels`, `turnoverActual`, rent/utilities |
| Payroll | `store, employee, grossPay` | `payroll` per store |

Column headers are matched by `norm()` (lowercase, non-alphanumeric stripped) against alias tables in `FIELDS`. Store names are resolved fuzzily by id, name, or city substring.

After parsing, `buildStores()` merges onto a base (current or sample stores) and calls `deriveStore()` on each result. The derived array is then saved to `localStorage` and passed to `App` via `onImported`.

### Vite config

`base: '/dunkin-dashboard/'` is set for GitHub Pages deployment. Local dev is unaffected.
