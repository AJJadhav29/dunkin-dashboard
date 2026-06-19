// ---------------------------------------------------------------------------
// CSV ingestion for the store dashboard.
//
// Three CSV file types are supported. Headers are matched case- and
// punctuation-insensitively, and a handful of common aliases are accepted, so
// "Sell Price", "sellPrice", and "Menu Price" all map to the same field.
//
//   1) INVENTORY  (one row per item, per store) — drives item performance,
//      cost of goods, and the trending / underperforming lists.
//        columns: store, item, category, unitsSold, costPrice, sellPrice, [trendPct]
//
//   2) WEEKLY     (one row per week, per store) — drives the turnover trend
//      line, the Turnover KPI, and the rent/utilities slices.
//        columns: store, week, earnings, [rent], [utilities], [otherExpense]
//
//   3) PAYROLL    (one row per employee, per pay period) — summed per store
//      into the Payroll figure.
//        columns: store, employee, grossPay
//
// A CSV may reference a store by name ("JSQ"), id ("jsq"), or city — matching
// is fuzzy. Any file type you don't upload simply keeps the previous values.
// ---------------------------------------------------------------------------
import Papa from 'papaparse'
import { sampleStores, deriveStore } from './data.js'

const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')

// Pull a numeric value, tolerating "$1,234.50", "1 234", "" → 0.
const num = (v) => {
  if (v == null || v === '') return 0
  const n = Number(String(v).replace(/[^0-9.\-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

// Field alias tables (normalized). First match wins.
const FIELDS = {
  inventory: {
    store: ['store', 'storename', 'location', 'shop', 'site'],
    item: ['item', 'itemname', 'product', 'productname', 'name', 'sku', 'menuitem'],
    category: ['category', 'cat', 'type', 'group', 'department', 'dept'],
    unitsSold: ['unitssold', 'units', 'qtysold', 'quantitysold', 'sold', 'salesunits', 'quantity', 'qty'],
    costPrice: ['costprice', 'cost', 'unitcost', 'costperunit', 'cogsperunit', 'buyprice', 'wholesale'],
    sellPrice: ['sellprice', 'price', 'menuprice', 'retailprice', 'unitprice', 'saleprice'],
    trendPct: ['trendpct', 'trend', 'growth', 'changepct', 'momchange', 'trendpercent', 'change'],
  },
  weekly: {
    store: ['store', 'storename', 'location', 'shop', 'site'],
    week: ['week', 'weekstart', 'weekstartdate', 'weekending', 'weekof', 'date', 'period'],
    earnings: ['earnings', 'earning', 'revenue', 'sales', 'turnover', 'income', 'grosssales', 'netsales', 'totalsales'],
    rent: ['rent', 'rentexpense', 'lease'],
    utilities: ['utilities', 'utility', 'utilitiesexpense', 'powerwater'],
    otherExpense: ['otherexpense', 'other', 'miscexpense', 'expenses', 'expense', 'operatingexpense', 'opex'],
  },
  payroll: {
    store: ['store', 'storename', 'location', 'shop', 'site'],
    employee: ['employee', 'employeename', 'name', 'worker', 'staff', 'associate'],
    grossPay: ['grosspay', 'gross', 'pay', 'amount', 'wages', 'salary', 'totalpay', 'netpay', 'payamount', 'biweeklypay'],
  },
}

// Build a {normalizedHeader -> value} lookup for one row, then resolve fields.
function fieldGetter(row) {
  const lut = {}
  for (const key of Object.keys(row)) lut[norm(key)] = row[key]
  return (aliases) => {
    for (const a of aliases) if (a in lut) return lut[a]
    return undefined
  }
}

// Match a CSV store reference to one of our stores (by id, name, or city).
function resolveStore(ref, stores) {
  const r = norm(ref)
  if (!r) return null
  // exact-ish: the store's id/name/city normalized contains the ref or vice-versa
  return (
    stores.find((s) => norm(s.id) === r || norm(s.name) === r) ||
    stores.find((s) => norm(s.name).includes(r) || r.includes(norm(s.id))) ||
    stores.find((s) => norm(s.city).includes(r)) ||
    null
  )
}

// Parse one File into an array of row objects. Returns a Promise.
export function parseFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.trim(),
      complete: (res) => resolve(res.data),
      error: reject,
    })
  })
}

// Detect which file type a set of rows looks like, from its headers.
export function detectType(rows) {
  if (!rows.length) return null
  const get = fieldGetter(rows[0])
  if (get(FIELDS.payroll.grossPay) !== undefined && get(FIELDS.payroll.employee) !== undefined) return 'payroll'
  if (get(FIELDS.weekly.earnings) !== undefined) return 'weekly'
  if (get(FIELDS.inventory.item) !== undefined && get(FIELDS.inventory.sellPrice) !== undefined) return 'inventory'
  return null
}

// Merge parsed CSV rows onto a base set of stores and re-derive.
// `base` defaults to the sample stores so unknown fields keep sensible values;
// pass an explicit base (e.g. the current imported stores) to update in place.
export function buildStores({ inventory, weekly, payroll } = {}, base = sampleStores) {
  // Start from the base values — each file only overwrites the stores it
  // actually references, so uploading one file type never wipes the others.
  const stores = base.map((s) => ({
    id: s.id,
    name: s.name,
    city: s.city,
    items: s.items ?? [],
    history: s.history ?? [],
    historyLabels: s.historyLabels ?? null,
    turnoverActual: s.turnoverActual,
    payroll: s.payroll ?? 0,
    rent: s.rent ?? 0,
    utilities: s.utilities ?? 0,
  }))

  const warnings = []

  if (inventory) {
    // Replace items only for the stores present in this inventory file.
    const byStore = new Map()
    for (const row of inventory) {
      const get = fieldGetter(row)
      const store = resolveStore(get(FIELDS.inventory.store), stores)
      if (!store) { warnings.push(`Inventory row skipped — unknown store "${get(FIELDS.inventory.store) ?? ''}"`); continue }
      const list = byStore.get(store.id) ?? []
      list.push({
        name: String(get(FIELDS.inventory.item) ?? '').trim() || 'Unnamed',
        category: String(get(FIELDS.inventory.category) ?? 'Other').trim() || 'Other',
        unitsSold: num(get(FIELDS.inventory.unitsSold)),
        costPrice: num(get(FIELDS.inventory.costPrice)),
        sellPrice: num(get(FIELDS.inventory.sellPrice)),
        trendPct: num(get(FIELDS.inventory.trendPct)),
      })
      byStore.set(store.id, list)
    }
    for (const store of stores) {
      if (byStore.has(store.id)) store.items = byStore.get(store.id)
    }
  }

  if (weekly) {
    // Group weekly rows per store, preserve order, sum the period totals.
    const byStore = new Map()
    for (const row of weekly) {
      const get = fieldGetter(row)
      const store = resolveStore(get(FIELDS.weekly.store), stores)
      if (!store) { warnings.push(`Weekly row skipped — unknown store "${get(FIELDS.weekly.store) ?? ''}"`); continue }
      const list = byStore.get(store.id) ?? []
      list.push({
        label: String(get(FIELDS.weekly.week) ?? '').trim(),
        earnings: num(get(FIELDS.weekly.earnings)),
        rent: num(get(FIELDS.weekly.rent)),
        utilities: num(get(FIELDS.weekly.utilities)),
      })
      byStore.set(store.id, list)
    }
    for (const store of stores) {
      const weeks = byStore.get(store.id)
      if (!weeks) continue
      store.history = weeks.map((w) => w.earnings)
      store.historyLabels = weeks.map((w) => w.label)
      store.turnoverActual = weeks.reduce((s, w) => s + w.earnings, 0)
      // Only override fixed costs when the file actually carries them.
      const rentTotal = weeks.reduce((s, w) => s + w.rent, 0)
      const utilTotal = weeks.reduce((s, w) => s + w.utilities, 0)
      if (rentTotal) store.rent = rentTotal
      if (utilTotal) store.utilities = utilTotal
    }
  }

  if (payroll) {
    const totals = new Map()
    for (const row of payroll) {
      const get = fieldGetter(row)
      const store = resolveStore(get(FIELDS.payroll.store), stores)
      if (!store) { warnings.push(`Payroll row skipped — unknown store "${get(FIELDS.payroll.store) ?? ''}"`); continue }
      totals.set(store.id, (totals.get(store.id) ?? 0) + num(get(FIELDS.payroll.grossPay)))
    }
    for (const store of stores) {
      if (totals.has(store.id)) store.payroll = totals.get(store.id)
    }
  }

  return { stores: stores.map(deriveStore), warnings }
}
