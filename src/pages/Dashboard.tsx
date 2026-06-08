import { useQueries } from '@tanstack/react-query'
import { Box, Users, ShoppingCart, CreditCard, TrendingUp, AlertTriangle } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { api } from '../api'
import StatCard from '../components/StatCard'
import { Order, Product } from '../types'

function useStat(key: string, url: string) {
  return {
    queryKey: [key],
    queryFn: async () => {
      const res = await api.get(url)
      return res.data?.data?.total ?? res.data?.data?.totalCount ?? 0
    },
  }
}

function groupByDate(orders: Order[]) {
  const map: Record<string, number> = {}
  orders.forEach((o) => {
    const date = o.order_date?.slice(0, 10) ?? 'Unknown'
    map[date] = (map[date] ?? 0) + 1
  })
  return Object.entries(map)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-7)
    .map(([date, count]) => ({ date, count }))
}

function groupByStatus(orders: Order[]) {
  const map: Record<string, number> = {}
  orders.forEach((o) => { map[o.status] = (map[o.status] ?? 0) + 1 })
  return Object.entries(map).map(([name, value]) => ({ name, value }))
}

const PIE_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  PROCESSING: '#3b82f6',
  COMPLETED: '#22c55e',
  CANCELLED: '#ef4444',
}

export default function Dashboard() {
  const results = useQueries({
    queries: [
      useStat('stat-products', '/api/products?page=1&limit=1'),
      useStat('stat-customers', '/api/customer?page=1&limit=1'),
      useStat('stat-orders', '/api/order?page=1&limit=1'),
      useStat('stat-payments', '/api/payment?page=1&limit=1'),
    ],
  })

  const [ordersChartResult, lowStockResult] = useQueries({
    queries: [
      {
        queryKey: ['orders-chart'],
        queryFn: async () => {
          const res = await api.get('/api/order?page=1&limit=100')
          const raw = res.data?.data?.orders ?? res.data?.data?.items ?? []
          return { byDate: groupByDate(raw), byStatus: groupByStatus(raw) }
        },
      },
      {
        queryKey: ['low-stock'],
        queryFn: async () => {
          const res = await api.get('/api/products?page=1&limit=100')
          const products = (res.data?.data?.products ?? []) as Product[]
          return products.filter((p) => p.stock <= 5).slice(0, 5)
        },
      },
    ],
  })

  const stats = [
    { title: 'Total Products', icon: <Box size={22} />, color: 'bg-gray-900' },
    { title: 'Total Customers', icon: <Users size={22} />, color: 'bg-blue-600' },
    { title: 'Total Orders', icon: <ShoppingCart size={22} />, color: 'bg-green-600' },
    { title: 'Total Payments', icon: <CreditCard size={22} />, color: 'bg-yellow-500' },
  ]

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>

      {/* Stat Cards */}
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

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Orders per day bar chart */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-gray-500" />
            <h3 className="text-base font-semibold text-gray-800">Orders — Last 7 Days</h3>
          </div>
          {ordersChartResult.isLoading ? (
            <div className="h-56 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ordersChartResult.data?.byDate ?? []} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="Orders" fill="#111827" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Order status pie */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Order Status</h3>
          {ordersChartResult.isLoading ? (
            <div className="h-56 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
          ) : (ordersChartResult.data?.byStatus ?? []).length === 0 ? (
            <div className="h-56 flex items-center justify-center text-gray-400 text-sm">No orders yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={ordersChartResult.data?.byStatus ?? []}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {(ordersChartResult.data?.byStatus ?? []).map((entry) => (
                    <Cell key={entry.name} fill={PIE_COLORS[entry.name] ?? '#9ca3af'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Low stock alert */}
      {(lowStockResult.data ?? []).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-orange-500" />
            <h3 className="text-base font-semibold text-gray-800">Low Stock Alert</h3>
            <span className="ml-auto text-xs text-gray-400">≤ 5 units remaining</span>
          </div>
          <div className="space-y-2">
            {(lowStockResult.data ?? []).map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700 font-medium">{p.name}</span>
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
