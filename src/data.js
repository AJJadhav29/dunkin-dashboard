// ---------------------------------------------------------------------------
// Dunkin' — sample data for three stores.
//
// Numbers are realistic but invented. Everything financial is DERIVED from the
// per-item sales below (see deriveStore), so the KPIs always stay internally
// consistent. To use your real figures, edit the `items` arrays and the
// fixed operating costs (payroll / rent / utilities) for each store.
// ---------------------------------------------------------------------------

// Each item: monthly unitsSold, costPrice (what we pay to make/buy one),
// sellPrice (menu price), and trendPct = change in units vs the previous month.
const rawStores = [
  {
    id: 'downtown',
    name: 'JSQ Store',
    city: 'Boston, MA',
    // Fixed monthly operating costs (not part of cost-of-goods)
    payroll: 21500,
    rent: 8200,
    utilities: 2600,
    // 6-month turnover trend ($) for the line chart, oldest → newest
    history: [62100, 64800, 61200, 67400, 70100, 72850],
    items: [
      { name: 'Glazed Donut',        category: 'Donuts',   unitsSold: 9800, costPrice: 0.42, sellPrice: 1.49, trendPct: 4 },
      { name: 'Boston Kreme',        category: 'Donuts',   unitsSold: 7200, costPrice: 0.55, sellPrice: 1.79, trendPct: 11 },
      { name: 'Old Fashioned',       category: 'Donuts',   unitsSold: 1600, costPrice: 0.40, sellPrice: 1.49, trendPct: -18 },
      { name: 'Iced Latte',          category: 'Coffee',   unitsSold: 12400, costPrice: 0.68, sellPrice: 4.29, trendPct: 17 },
      { name: 'Hot Coffee (med)',    category: 'Coffee',   unitsSold: 15600, costPrice: 0.31, sellPrice: 2.49, trendPct: 2 },
      { name: 'Cold Brew',           category: 'Coffee',   unitsSold: 6100, costPrice: 0.59, sellPrice: 3.99, trendPct: 22 },
      { name: 'Caramel Macchiato',   category: 'Coffee',   unitsSold: 4800, costPrice: 0.74, sellPrice: 4.69, trendPct: 9 },
      { name: 'Bacon Egg Wake-Up',   category: 'Food',     unitsSold: 5400, costPrice: 1.35, sellPrice: 4.49, trendPct: 6 },
      { name: 'Hash Browns',         category: 'Food',     unitsSold: 3900, costPrice: 0.48, sellPrice: 2.29, trendPct: 1 },
      { name: 'Bagel w/ Cream Ch.',  category: 'Bakery',   unitsSold: 2100, costPrice: 0.62, sellPrice: 2.99, trendPct: -9 },
    ],
  },
  {
    id: 'quincy',
    name: 'Newport Store',
    city: 'Quincy, MA',
    payroll: 16800,
    rent: 5400,
    utilities: 1900,
    history: [41200, 39800, 42600, 44100, 43500, 45900],
    items: [
      { name: 'Glazed Donut',        category: 'Donuts',   unitsSold: 6400, costPrice: 0.42, sellPrice: 1.49, trendPct: 3 },
      { name: 'Boston Kreme',        category: 'Donuts',   unitsSold: 3900, costPrice: 0.55, sellPrice: 1.79, trendPct: 5 },
      { name: 'Strawberry Frosted',  category: 'Donuts',   unitsSold: 2800, costPrice: 0.50, sellPrice: 1.69, trendPct: 14 },
      { name: 'Old Fashioned',       category: 'Donuts',   unitsSold: 900,  costPrice: 0.40, sellPrice: 1.49, trendPct: -24 },
      { name: 'Iced Latte',          category: 'Coffee',   unitsSold: 7600, costPrice: 0.68, sellPrice: 4.29, trendPct: 12 },
      { name: 'Hot Coffee (med)',    category: 'Coffee',   unitsSold: 10200, costPrice: 0.31, sellPrice: 2.49, trendPct: 0 },
      { name: 'Cold Brew',           category: 'Coffee',   unitsSold: 3300, costPrice: 0.59, sellPrice: 3.99, trendPct: 19 },
      { name: 'Bacon Egg Wake-Up',   category: 'Food',     unitsSold: 3100, costPrice: 1.35, sellPrice: 4.49, trendPct: 4 },
      { name: 'Hash Browns',         category: 'Food',     unitsSold: 2400, costPrice: 0.48, sellPrice: 2.29, trendPct: -3 },
      { name: 'Muffin (Blueberry)',  category: 'Bakery',   unitsSold: 1500, costPrice: 0.58, sellPrice: 2.49, trendPct: -12 },
    ],
  },
  {
    id: 'braintree',
    name: 'Riverdrive Store',
    city: 'Braintree, MA',
    payroll: 14200,
    rent: 4600,
    utilities: 1700,
    history: [33800, 35200, 36100, 35400, 37800, 39600],
    items: [
      { name: 'Glazed Donut',        category: 'Donuts',   unitsSold: 4200, costPrice: 0.42, sellPrice: 1.49, trendPct: 1 },
      { name: 'Boston Kreme',        category: 'Donuts',   unitsSold: 2600, costPrice: 0.55, sellPrice: 1.79, trendPct: 2 },
      { name: 'Old Fashioned',       category: 'Donuts',   unitsSold: 700,  costPrice: 0.40, sellPrice: 1.49, trendPct: -15 },
      { name: 'Iced Latte',          category: 'Coffee',   unitsSold: 6900, costPrice: 0.68, sellPrice: 4.29, trendPct: 21 },
      { name: 'Hot Coffee (lg)',     category: 'Coffee',   unitsSold: 11800, costPrice: 0.36, sellPrice: 2.89, trendPct: 5 },
      { name: 'Cold Brew',           category: 'Coffee',   unitsSold: 4400, costPrice: 0.59, sellPrice: 3.99, trendPct: 27 },
      { name: 'Caramel Macchiato',   category: 'Coffee',   unitsSold: 2900, costPrice: 0.74, sellPrice: 4.69, trendPct: 8 },
      { name: 'Bacon Egg Wake-Up',   category: 'Food',     unitsSold: 2700, costPrice: 1.35, sellPrice: 4.49, trendPct: 7 },
      { name: 'Hash Browns',         category: 'Food',     unitsSold: 2200, costPrice: 0.48, sellPrice: 2.29, trendPct: 3 },
      { name: 'Donut Holes (10pk)',  category: 'Bakery',   unitsSold: 1100, costPrice: 0.90, sellPrice: 3.49, trendPct: -7 },
    ],
  },
]

// Turn a raw store (sample or imported) into the fully-derived shape the
// dashboard renders. Financials stay internally consistent:
//   - item revenue/cogs/profit are always derived from unitsSold × price
//   - the Turnover KPI uses real earnings (turnoverActual) when the weekly
//     CSV provides them, otherwise it falls back to summed item revenue
//   - history is the turnover trend line; historyLabels are optional axis
//     labels (e.g. week-start dates) — when absent the chart auto-labels.
export function deriveStore(store) {
  const items = (store.items ?? []).map((it) => {
    const unitsSold = Number(it.unitsSold) || 0
    const sellPrice = Number(it.sellPrice) || 0
    const costPrice = Number(it.costPrice) || 0
    const revenue = unitsSold * sellPrice
    const cogs = unitsSold * costPrice
    const profit = revenue - cogs
    const margin = revenue ? profit / revenue : 0
    return { ...it, unitsSold, sellPrice, costPrice, trendPct: Number(it.trendPct) || 0, revenue, cogs, profit, margin }
  })

  const itemRevenue = items.reduce((s, i) => s + i.revenue, 0)
  const cogs = items.reduce((s, i) => s + i.cogs, 0)
  const turnover = store.turnoverActual != null ? Number(store.turnoverActual) : itemRevenue
  const payroll = Number(store.payroll) || 0
  const rent = Number(store.rent) || 0
  const utilities = Number(store.utilities) || 0
  const operatingCosts = payroll + rent + utilities
  const profit = turnover - cogs - operatingCosts
  const profitMargin = turnover ? profit / turnover : 0

  const byUnits = [...items].sort((a, b) => b.unitsSold - a.unitsSold)
  const byTrend = [...items].sort((a, b) => b.trendPct - a.trendPct)

  return {
    ...store,
    items,
    payroll,
    rent,
    utilities,
    turnover,
    cogs,
    operatingCosts,
    profit,
    profitMargin,
    history: store.history ?? [],
    historyLabels: store.historyLabels ?? null,
    topSellers: byUnits.slice(0, 3),
    trending: byTrend.filter((i) => i.trendPct > 0).slice(0, 3),
    underperforming: byTrend.filter((i) => i.trendPct < 0).reverse().slice(0, 3),
  }
}

// The built-in sample stores, shown until real CSVs are imported.
export const sampleStores = rawStores.map(deriveStore)

// Back-compat: existing imports of `stores` keep working.
export const stores = sampleStores
