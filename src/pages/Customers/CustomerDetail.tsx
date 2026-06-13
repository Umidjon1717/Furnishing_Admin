import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, User, Mail, Phone, ShoppingCart, Calendar } from 'lucide-react'
import { api } from '../../api'
import { Customer, normalizeOrder } from '../../types'
import StatusBadge from '../../components/StatusBadge'
import Skeleton from '../../components/Skeleton'

export default function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: customer, isLoading: loadingCustomer } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const res = await api.get(`/api/customer/${id}`)
      const d = res.data?.data
      return (d?.customer ?? d) as Customer
    },
  })

  // GET /api/order/:customerId returns orders WHERE customerId = $1 (confirmed backend behaviour)
  const { data: ordersData, isLoading: loadingOrders } = useQuery({
    queryKey: ['customer-orders', id],
    queryFn: async () => {
      const res = await api.get(`/api/order/${id}`)
      const d = res.data?.data
      const raw = (d?.orders ?? (Array.isArray(d) ? d : [])) as Record<string, unknown>[]
      return raw.map(normalizeOrder).reverse()
    },
  })

  if (loadingCustomer) return <div className="max-w-3xl"><Skeleton rows={4} cols={2} /></div>
  if (!customer) return <p className="text-gray-500 p-4">Customer not found.</p>

  const orders = ordersData ?? []
  const totalSpent = orders.reduce((s, o) => s + (o.total_price ?? 0), 0)

  return (
    <div className="max-w-3xl space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/customers')} className="p-1.5 rounded hover:bg-gray-100">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{customer.full_name ?? `Customer #${id}`}</h2>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${customer.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {customer.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MiniCard icon={<ShoppingCart size={15} />} label="Total Orders" value={String(orders.length)} />
        <MiniCard icon={<Calendar size={15} />}     label="Total Spent"  value={`$${totalSpent.toLocaleString()}`} />
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-3">
        <h3 className="text-sm font-semibold text-gray-800 mb-1">Profile</h3>
        <Row icon={<User size={14} />}  label="Full Name" value={customer.full_name ?? '—'} />
        <Row icon={<Mail size={14} />}  label="Email"     value={customer.email ?? '—'} />
        <Row icon={<Phone size={14} />} label="Phone"     value={customer.phone_number ?? '—'} />
      </div>

      {/* Order history */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-sm">Order History</h3>
          <span className="text-xs text-gray-400">{orders.length} orders</span>
        </div>

        {loadingOrders ? (
          <div className="p-5"><Skeleton rows={3} cols={4} /></div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center">
            <ShoppingCart size={26} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">No orders yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Order ID</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Total</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-800">#{o.id}</td>
                  <td className="px-5 py-3 text-gray-500">{(o.order_date ?? '').slice(0, 10) || '—'}</td>
                  <td className="px-5 py-3 font-medium">{o.total_price ? `$${o.total_price.toLocaleString()}` : '—'}</td>
                  <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => navigate(`/orders/${o.id}`)}
                      className="text-xs text-blue-500 hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-gray-400 flex-shrink-0">{icon}</span>
      <span className="text-gray-400 text-sm w-24 flex-shrink-0">{label}</span>
      <span className="text-gray-800 text-sm font-medium">{value}</span>
    </div>
  )
}

function MiniCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-1.5 text-gray-400 mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-base font-bold text-gray-900 truncate">{value}</p>
    </div>
  )
}
