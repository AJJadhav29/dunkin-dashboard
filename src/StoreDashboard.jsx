import {
  ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line,
} from 'recharts'

const usd = (n) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const pct = (n) => `${(n * 100).toFixed(1)}%`

const COST_COLORS = ['#FF6E0C', '#DA1884', '#6F4E37', '#7AB648'] // cogs, payroll, rent, utilities

export default function StoreDashboard({ store }) {
  const costData = [
    { name: 'Cost of goods', value: Math.round(store.cogs) },
    { name: 'Payroll', value: store.payroll },
    { name: 'Rent', value: store.rent },
    { name: 'Utilities', value: store.utilities },
  ]

  const itemPerf = [...store.items]
    .sort((a, b) => b.revenue - a.revenue)
    .map((i) => ({
      name: i.name,
      Revenue: Math.round(i.revenue),
      Profit: Math.round(i.profit),
    }))

  // Use real period labels (e.g. week-start dates) when the imported data
  // provides them; otherwise fall back to relative "M-n … Now" labels.
  const labels = store.historyLabels
  const history = (store.history ?? []).map((v, i, arr) => ({
    label: labels?.[i] || `M-${arr.length - 1 - i}`,
    Turnover: v,
  }))
  if (history.length && !labels?.[history.length - 1]) {
    history[history.length - 1].label = 'Now'
  }
  const trendSubtitle = labels?.length ? 'By week' : 'Last 6 months'

  return (
    <main className="dashboard">
      {/* KPI row */}
      <section className="kpis">
        <Kpi label="Turnover" value={usd(store.turnover)} accent="#FF6E0C" sub="monthly revenue" />
        <Kpi label="Cost of Goods" value={usd(store.cogs)} accent="#6F4E37" sub="donuts, beans, food" />
        <Kpi label="Operating Costs" value={usd(store.operatingCosts)} accent="#DA1884"
             sub="payroll + rent + utilities" />
        <Kpi
          label="Net Profit"
          value={usd(store.profit)}
          accent={store.profit >= 0 ? '#2E7D32' : '#C62828'}
          sub={`${pct(store.profitMargin)} margin`}
        />
      </section>

      <div className="grid">
        {/* Cost breakdown */}
        <Panel title="Where the money goes" subtitle="Monthly cost breakdown">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={costData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                   outerRadius={95} innerRadius={55} paddingAngle={2}>
                {costData.map((_, i) => <Cell key={i} fill={COST_COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v) => usd(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Panel>

        {/* Turnover trend */}
        <Panel title="Turnover trend" subtitle={trendSubtitle}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={history} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="label" />
              <YAxis tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip formatter={(v) => usd(v)} />
              <Line type="monotone" dataKey="Turnover" stroke="#FF6E0C" strokeWidth={3}
                    dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        {/* Item revenue vs profit */}
        <Panel title="Item performance" subtitle="Revenue vs profit by product" wide>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={itemPerf} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} height={70}
                     tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip formatter={(v) => usd(v)} />
              <Legend />
              <Bar dataKey="Revenue" fill="#DA1884" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Profit" fill="#FF6E0C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        {/* Trending */}
        <Panel title="🔥 Trending — sell more" subtitle="Biggest month-over-month gains">
          <ItemList items={store.trending} positive />
        </Panel>

        {/* Underperforming */}
        <Panel title="🐌 Underperforming — cut the order" subtitle="Falling demand, reduce stock">
          <ItemList items={store.underperforming} />
        </Panel>
      </div>
    </main>
  )
}

function Kpi({ label, value, sub, accent }) {
  return (
    <div className="kpi" style={{ '--accent': accent }}>
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">{value}</span>
      <span className="kpi-sub">{sub}</span>
    </div>
  )
}

function Panel({ title, subtitle, wide, children }) {
  return (
    <section className={`panel ${wide ? 'wide' : ''}`}>
      <div className="panel-head">
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

function ItemList({ items, positive }) {
  if (!items.length) return <p className="empty">No items in this group.</p>
  return (
    <ul className="item-list">
      {items.map((i) => (
        <li key={i.name}>
          <div className="item-main">
            <span className="item-name">{i.name}</span>
            <span className="item-cat">{i.category}</span>
          </div>
          <div className="item-stats">
            <span className="item-units">{i.unitsSold.toLocaleString()} sold</span>
            <span className={`item-trend ${positive ? 'up' : 'down'}`}>
              {i.trendPct > 0 ? '▲' : '▼'} {Math.abs(i.trendPct)}%
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}
