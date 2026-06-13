import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Package, User, MapPin, CreditCard, Calendar } from 'lucide-react'
import { api } from '../../api'
import { normalizeOrder, OrderItem } from '../../types'
import StatusBadge from '../../components/StatusBadge'
import Skeleton from '../../components/Skeleton'
import { useToast } from '../../components/Toast'

const STATUSES = ['NEW', 'PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED']

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const res = await api.get(`/api/order/${id}`)
      const raw = res.data?.data ?? res.data
      console.log('[order raw]', raw)
      return normalizeOrder(raw as Record<string, unknown>)
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
    <div className="max-w-3xl space-y-4">
      <Skeleton rows={5} cols={2} />
    </div>
  )
  if (!order) return <p className="text-gray-500">Order not found.</p>

  const date = (order.order_date ?? order.createdAt ?? order.created_at ?? '').slice(0, 10)
  const total = order.totalPrice ?? order.total_price ?? 0
  const address = order.deliveryAddress ?? order.delivery_address

  const items = (order.items ?? []) as (OrderItem & Record<string, unknown>)[]
  const itemsTotal = items.reduce((sum, i) => {
    const price = (i.price ?? i.unit_price ?? 0) as number
    return sum + price * i.quantity
  }, 0)

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/orders')} className="p-1.5 rounded hover:bg-gray-100">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Order #{order.id}</h2>
          <p className="text-sm text-gray-400 mt-0.5">{date}</p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={order.status} />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MiniCard icon={<User size={16} />} label="Customer ID" value={String(order.customerId ?? '—')} />
        <MiniCard icon={<CreditCard size={16} />} label="Total" value={total ? `$${total.toLocaleString()}` : '—'} />
        <MiniCard icon={<Calendar size={16} />} label="Date" value={date || '—'} />
        <MiniCard icon={<Package size={16} />} label="Items" value={String(items.length)} />
      </div>

      {/* Order info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Order Details</h3>
        <Row label="Order ID" value={String(order.id)} />
        <Row label="Customer ID" value={String(order.customerId ?? '—')} />
        <Row label="Date" value={date || '—'} />
        <Row label="Total Price" value={total ? `$${total.toLocaleString()}` : '—'} />
        {address && (
          <div className="flex gap-2 pt-2 border-t border-gray-50">
            <MapPin size={15} className="text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Delivery Address</p>
              <p className="text-sm text-gray-700 mt-0.5">{address}</p>
            </div>
          </div>
        )}
      </div>

      {/* Status update */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Update Status</h3>
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map((s) => (
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

      {/* Order items */}
      {items.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 text-sm">Items ({items.length})</h3>
            {itemsTotal > 0 && (
              <span className="text-sm font-semibold text-gray-700">
                Subtotal: ${itemsTotal.toLocaleString()}
              </span>
            )}
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">SKU</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Qty</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Unit Price</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const unitPrice = (item.price ?? item.unit_price ?? 0) as number
                const productName = item.product?.name
                  ?? (item.product_name as string | undefined)
                  ?? `Product #${item.productId ?? item.product_id ?? idx + 1}`
                const sku = item.product?.sku ?? (item.sku as string | undefined) ?? '—'
                return (
                  <tr key={item.id ?? idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {item.product?.images?.[0] && (
                          <img src={item.product.images[0]} className="w-8 h-8 object-cover rounded" alt="" />
                        )}
                        <span className="font-medium text-gray-700">{productName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{sku}</td>
                    <td className="px-5 py-3 text-gray-600">{item.quantity}</td>
                    <td className="px-5 py-3 text-gray-600">${unitPrice.toLocaleString()}</td>
                    <td className="px-5 py-3 font-semibold text-gray-800">
                      ${(unitPrice * item.quantity).toLocaleString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {itemsTotal > 0 && (
              <tfoot>
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td colSpan={4} className="px-5 py-3 text-right text-sm font-semibold text-gray-700">Total</td>
                  <td className="px-5 py-3 text-sm font-bold text-gray-900">${itemsTotal.toLocaleString()}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-10 text-center">
          <Package size={28} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">No item details available for this order.</p>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  )
}

function MiniCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-2 text-gray-400 mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-base font-bold text-gray-900">{value}</p>
    </div>
  )
}
