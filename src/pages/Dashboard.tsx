import { useQueries } from '@tanstack/react-query'
import { Box, Users, ShoppingCart, CreditCard } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { api } from '../api'
import StatCard from '../components/StatCard'
import { Order } from '../types'

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

export default function Dashboard() {
  const results = useQueries({
    queries: [
      useStat('stat-products', '/api/products?page=1&limit=1'),
      useStat('stat-customers', '/api/customer?page=1&limit=1'),
      useStat('stat-orders', '/api/order?page=1&limit=1'),
      useStat('stat-payments', '/api/payment?page=1&limit=1'),
    ],
  })

  const ordersQuery = {
    queryKey: ['orders-chart'],
    queryFn: async () => {
      const res = await api.get('/api/order?page=1&limit=50')
      const raw = res.data?.data?.orders ?? res.data?.data?.items ?? []
      return groupByDate(raw)
    },
  }
  const [chartResult] = useQueries({ queries: [ordersQuery] })

  const stats = [
    { title: 'Total Products', icon: <Box size={22} />, color: 'bg-gray-900' },
    { title: 'Total Customers', icon: <Users size={22} />, color: 'bg-blue-600' },
    { title: 'Total Orders', icon: <ShoppingCart size={22} />, color: 'bg-green-600' },
    { title: 'Total Payments', icon: <CreditCard size={22} />, color: 'bg-yellow-500' },
  ]

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>

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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Orders — Last 7 Days</h3>
        {chartResult.isLoading ? (
          <p className="text-gray-400 text-sm">Loading chart…</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartResult.data ?? []} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" name="Orders" fill="#111827" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
