import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { api } from '../../api'
import { Order, OrderItem } from '../../types'
import StatusBadge from '../../components/StatusBadge'
import Skeleton from '../../components/Skeleton'
import { useToast } from '../../components/Toast'

const statuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED']

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const res = await api.get(`/api/order/${id}`)
      return (res.data?.data ?? res.data) as Order
    },
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/api/order/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Order status updated')
    },
    onError: () => toast.error('Failed to update status'),
  })

  if (isLoading) return (
    <div className="max-w-2xl space-y-4">
      <Skeleton rows={4} cols={2} />
    </div>
  )
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

        <div className="pt-2 border-t border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
          <div className="flex gap-2 flex-wrap">
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => statusMutation.mutate(s)}
                disabled={statusMutation.isPending || order.status === s}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  order.status === s
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                } disabled:opacity-50`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {(order.items ?? []).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 text-sm">Items ({order.items!.length})</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(order.items ?? []).map((item: OrderItem) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700 font-medium">{item.product?.name ?? `Product #${item.productId}`}</td>
                  <td className="px-4 py-3 text-gray-600">{item.quantity}</td>
                  <td className="px-4 py-3 text-gray-600">${item.price?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-800 font-medium">${(item.price * item.quantity)?.toLocaleString()}</td>
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
