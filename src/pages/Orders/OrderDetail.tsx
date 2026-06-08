import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { api } from '../../api'
import { Order, OrderItem } from '../../types'
import StatusBadge from '../../components/StatusBadge'

const statuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED']

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const res = await api.get(`/api/order/${id}`)
      return (res.data?.data ?? res.data) as Order
    },
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/api/order/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['order', id] }),
  })

  if (isLoading) return <p className="text-gray-400">Loading…</p>
  if (!order) return <p className="text-gray-500">Order not found.</p>

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/orders')} className="p-1.5 rounded hover:bg-gray-100">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Order #{order.id}</h2>
        <StatusBadge status={order.status} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <Row label="Order ID" value={String(order.id)} />
        <Row label="Customer ID" value={String(order.customerId)} />
        <Row label="Date" value={order.order_date?.slice(0, 10)} />
        <Row label="Total Price" value={`$${order.totalPrice?.toLocaleString()}`} />
        {order.deliveryAddress && <Row label="Delivery Address" value={order.deliveryAddress} />}

        <div className="pt-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Update Status</label>
          <select
            value={order.status}
            onChange={(e) => statusMutation.mutate(e.target.value)}
            disabled={statusMutation.isPending}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {(order.items ?? []).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 text-sm">Items</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Price</th>
              </tr>
            </thead>
            <tbody>
              {(order.items ?? []).map((item: OrderItem) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="px-4 py-3 text-gray-700">{item.product?.name ?? `Product #${item.productId}`}</td>
                  <td className="px-4 py-3 text-gray-700">{item.quantity}</td>
                  <td className="px-4 py-3 text-gray-700">${item.price?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 font-medium">{value ?? '—'}</span>
    </div>
  )
}
