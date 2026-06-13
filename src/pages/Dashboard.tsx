import { useQueries } from '@tanstack/react-query'
import {
  Box, Users, ShoppingCart, CreditCard,
  TrendingUp, AlertTriangle, DollarSign, TrendingDown, Activity, Trophy,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts'
import { api } from '../api'
import StatCard from '../components/StatCard'
import { Order, Payment, Product, normalizeOrder } from '../types'

function useStat(key: string, url: string) {
  return {
    queryKey: [key],
    queryFn: async () => {
      const res = await api.get(url)
      return res.data?.data?.total ?? 0
    },
  }
}

function groupByDate(orders: Order[]) {
  const map: Record<string, number> = {}
  orders.forEach((o) => {
    const date = (o.order_date ?? '').slice(0, 10) || 'Unknown'
    map[date] = (map[date] ?? 0) + 1
  })
  return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).slice(-7).map(([date, count]) => ({ date, count }))
}

function groupByStatus(orders: Order[]) {
  const map: Record<string, number> = {}
  orders.forEach((o) => { map[o.status] = (map[o.status] ?? 0) + 1 })
  return Object.entries(map).map(([name, value]) => ({ name, value }))
}

function revenueByDay(payments: Payment[]) {
  const map: Record<string, number> = {}
  payments.filter((p) => p.status === 'COMPLETED').forEach((p) => {
    const date = p.createdAt?.slice(0, 10) ?? 'Unknown'
    map[date] = (map[date] ?? 0) + (p.amount ?? 0)
  })
  return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).slice(-14).map(([date, revenue]) => ({ date, revenue }))
}

function computeBestSelling(orders: Order[]) {
  const map: Record<number, { name: string; count: number; image?: string }> = {}
  orders.forEach((o) => {
    ;(o.order_details ?? []).forEach((d) => {
      const pid = d.product?.id
      if (pid === undefined) return
      if (!map[pid]) map[pid] = { name: d.product?.name ?? `#${pid}`, count: 0, image: d.product?.images?.[0] }
      map[pid].count += d.quantity
    })
  })
  return Object.entries(map)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([id, v]) => ({ id: Number(id), ...v }))
}

function computeRevenueByCategory(orders: Order[], catMap: Record<number, string>) {
  const map: Record<string, number> = {}
  orders.forEach((o) => {
    ;(o.order_details ?? []).forEach((d) => {
      const pid = d.product?.id
      if (pid === undefined) return
      const cat = catMap[pid] ?? 'Unknown'
      map[cat] = (map[cat] ?? 0) + (d.product?.price ?? 0) * d.quantity
    })
  })
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }))
}

const PIE_COLORS: Record<string, string> = {
  NEW: '#3b82f6', PENDING: '#f59e0b', PROCESSING: '#8b5cf6', COMPLETED: '#22c55e', CANCELLED: '#ef4444',
}
const CAT_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6']

const card = 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700'

export default function Dashboard() {
  const results = useQueries({
    queries: [
      useStat('stat-products', '/api/products?page=1&limit=1'),
      useStat('stat-customers', '/api/customer?page=1&limit=1'),
      useStat('stat-orders', '/api/order?page=1&limit=1'),
      useStat('stat-payments', '/api/payment?page=1&limit=1'),
    ],
  })

  const [ordersResult, paymentsResult, productsResult] = useQueries({
    queries: [
      {
        queryKey: ['orders-chart'],
        queryFn: async () => {
          const res = await api.get('/api/order?page=1&limit=100')
          const raw = (res.data?.data?.orders ?? []) as Record<string, unknown>[]
          const orders = raw.map(normalizeOrder)
          return {
            byDate: groupByDate(orders),
            byStatus: groupByStatus(orders),
            bestSelling: computeBestSelling(orders),
            orders,
          }
        },
      },
      {
        queryKey: ['payments-analytics'],
        queryFn: async () => {
          const res = await api.get('/api/payment?page=1&limit=100')
          const payments = (res.data?.data?.payment ?? []) as Payment[]
          const completed = payments.filter((p) => p.status === 'COMPLETED')
          const failed = payments.filter((p) => p.status === 'FAILED')
          const totalRevenue = completed.reduce((s, p) => s + (p.amount ?? 0), 0)
          const totalFailed = failed.reduce((s, p) => s + (p.amount ?? 0), 0)
          return { totalRevenue, totalFailed, byDay: revenueByDay(payments), completed: completed.length, failed: failed.length }
        },
      },
      {
        queryKey: ['products-dashboard'],
        queryFn: async () => {
          const res = await api.get('/api/products?page=1&limit=100')
          const products = (res.data?.data?.products ?? []) as Product[]
          const catMap: Record<number, string> = {}
          products.forEach((p) => { catMap[p.id] = p.category?.name ?? `Cat #${p.categoryId}` })
          return { lowStock: products.filter((p) => p.stock <= 5).slice(0, 5), catMap }
        },
      },
    ],
  })

  const revenue = paymentsResult.data?.totalRevenue ?? 0
  const failedAmt = paymentsResult.data?.totalFailed ?? 0
  const orders = ordersResult.data?.orders ?? []
  const catMap = productsResult.data?.catMap ?? {}
  const revenueByCategory = computeRevenueByCategory(orders, catMap)
  const bestSelling = ordersResult.data?.bestSelling ?? []

  const stats = [
    { title: 'Total Products',  icon: <Box size={22} />,        color: 'bg-gray-900' },
    { title: 'Total Customers', icon: <Users size={22} />,      color: 'bg-blue-600' },
    { title: 'Total Orders',    icon: <ShoppingCart size={22} />, color: 'bg-green-600' },
    { title: 'Total Payments',  icon: <CreditCard size={22} />, color: 'bg-yellow-500' },
  ]

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <StatCard
            key={s.title}
            title={s.title}
            value={results[i].isLoading ? '…' : (results[i].data ?? 0)}
            icon={s.icon}
            color={s.color}
          />
        ))}
      </div>

      {/* Profit / Loss cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`${card} p-5 flex items-center gap-4`}>
          <div className="bg-green-500 text-white p-3 rounded-lg"><DollarSign size={22} /></div>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {paymentsResult.isLoading ? '…' : `$${revenue.toLocaleString()}`}
            </p>
            <p className="text-xs text-green-600 mt-0.5">{paymentsResult.data?.completed ?? 0} completed</p>
          </div>
        </div>
        <div className={`${card} p-5 flex items-center gap-4`}>
          <div className="bg-red-500 text-white p-3 rounded-lg"><TrendingDown size={22} /></div>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Failed / Lost</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {paymentsResult.isLoading ? '…' : `$${failedAmt.toLocaleString()}`}
            </p>
            <p className="text-xs text-red-500 mt-0.5">{paymentsResult.data?.failed ?? 0} failed</p>
          </div>
        </div>
        <div className={`${card} p-5 flex items-center gap-4`}>
          <div className="bg-blue-500 text-white p-3 rounded-lg"><Activity size={22} /></div>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Net Position</p>
            <p className={`text-2xl font-bold ${revenue - failedAmt >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {paymentsResult.isLoading ? '…' : `${revenue - failedAmt >= 0 ? '+' : ''}$${(revenue - failedAmt).toLocaleString()}`}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">revenue minus failed</p>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className={`xl:col-span-2 ${card} p-6`}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-gray-500 dark:text-gray-400" />
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">Orders — Last 7 Days</h3>
          </div>
          {ordersResult.isLoading ? (
            <div className="h-56 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ordersResult.data?.byDate ?? []} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#f3f4f6' }} />
                <Bar dataKey="count" name="Orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={`${card} p-6`}>
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Order Status</h3>
          {ordersResult.isLoading ? (
            <div className="h-56 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
          ) : (ordersResult.data?.byStatus ?? []).length === 0 ? (
            <div className="h-56 flex items-center justify-center text-gray-400 text-sm">No orders yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={ordersResult.data?.byStatus ?? []}
                  cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value"
                >
                  {(ordersResult.data?.byStatus ?? []).map((entry) => (
                    <Cell key={entry.name} fill={PIE_COLORS[entry.name] ?? '#9ca3af'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#f3f4f6' }} />
                <Legend iconType="circle" iconSize={10} formatter={(v) => <span style={{ color: '#9ca3af', fontSize: 12 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Revenue over time */}
      {(paymentsResult.data?.byDay ?? []).length > 0 && (
        <div className={`${card} p-6`}>
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Revenue — Last 14 Days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={paymentsResult.data?.byDay ?? []} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']} contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#f3f4f6' }} />
              <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Best-selling + Revenue by category */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Best-selling products */}
        <div className={`${card} p-6`}>
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={18} className="text-yellow-500" />
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">Best-Selling Products</h3>
          </div>
          {ordersResult.isLoading ? (
            <p className="text-gray-400 text-sm">Loading…</p>
          ) : bestSelling.length === 0 ? (
            <p className="text-gray-400 text-sm">No order detail data available.</p>
          ) : (
            <div className="space-y-3">
              {bestSelling.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className={`text-xs font-bold w-5 text-center ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : 'text-orange-400'}`}>
                    #{i + 1}
                  </span>
                  {p.image
                    ? <img src={p.image} className="w-9 h-9 rounded-lg object-cover border border-gray-200 dark:border-gray-600 flex-shrink-0" alt="" />
                    : <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 flex-shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.count} units sold</p>
                  </div>
                  <div className="w-24 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 flex-shrink-0">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full"
                      style={{ width: `${Math.round((p.count / (bestSelling[0]?.count || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue by category */}
        <div className={`${card} p-6`}>
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Revenue by Category</h3>
          {ordersResult.isLoading || productsResult.isLoading ? (
            <p className="text-gray-400 text-sm">Loading…</p>
          ) : revenueByCategory.length === 0 ? (
            <p className="text-gray-400 text-sm">No category revenue data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueByCategory} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} width={80} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']} contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#f3f4f6' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {revenueByCategory.map((_, i) => (
                    <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Low stock */}
      {(productsResult.data?.lowStock ?? []).length > 0 && (
        <div className={`${card} border-orange-100 dark:border-orange-900/30 p-6`}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-orange-500" />
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">Low Stock Alert</h3>
            <span className="ml-auto text-xs text-gray-400">≤ 5 units remaining</span>
          </div>
          <div className="space-y-2">
            {(productsResult.data?.lowStock ?? []).map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
                <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">{p.name}</span>
                <span className={`text-sm font-bold ${p.stock === 0 ? 'text-red-600' : 'text-orange-500'}`}>
                  {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
