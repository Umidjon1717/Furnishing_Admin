import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Package, User, MapPin, CreditCard, Calendar } from 'lucide-react'
import { api } from '../../api'
import { OrderDetail as OD, normalizeOrder } from '../../types'
import StatusBadge from '../../components/StatusBadge'
import Skeleton from '../../components/Skeleton'
import { useToast } from '../../components/Toast'

const STATUSES = ['NEW', 'PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED']

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()

  // Pull the order from the already-fetched list cache first
  function getFromListCache() {
    for (let page = 1; page <= 10; page++) {
      const cached = queryClient.getQueryData<{ orders: ReturnType<typeof normalizeOrder>[] }>(['orders', page])
      const found = cached?.orders?.find((o) => String(o.id) === id)
      if (found) return found
    }
    return undefined
  }

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    initialData: getFromListCache,  // use list cache instantly — no loading flicker
    queryFn: async () => {
      const res = await api.get(`/api/order/${id}`)
      const d = res.data?.data

      // Backend may return: single object, array by customerId, or list wrapper
      let raw: Record<string, unknown> | null = null
      if (d && typeof d === 'object') {
        if ('id' in d) {
          raw = d as Record<string, unknown>                     // { id, total_price, ... }
        } else if (Array.isArray(d)) {
          raw = (d as Record<string, unknown>[]).find((o) => String(o.id) === id) ?? d[0] ?? null
        } else if ('orders' in d) {
          const list = (d as { orders: Record<string, unknown>[] }).orders
          raw = list.find((o) => String(o.id) === id) ?? list[0] ?? null
        }
      }

      // If API didn't return a usable object, fall back to list cache
      if (!raw?.id) return getFromListCache() ?? normalizeOrder({})
      return normalizeOrder(raw)
    },
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/api/order/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Status updated')
    },
    onError: () => toast.error('Failed to update status'),
  })

  if (isLoading) return <div className="max-w-3xl"><Skeleton rows={5} cols={2} /></div>
  if (!order?.id) return <p className="text-gray-500 p-4">Order not found.</p>

  const items = order.order_details ?? []
  const addr  = order.order_address
  const itemsTotal = items.reduce((s, i) => s + (i.product?.price ?? 0) * i.quantity, 0)
  const date = order.order_date?.slice(0, 10) ?? '—'
  const total = order.total_price ?? 0

  return (
    <div className="max-w-3xl space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/orders')} className="p-1.5 rounded hover:bg-gray-100">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Order #{order.id}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{date}</p>
        </div>
        <div className="ml-auto"><StatusBadge status={order.status} /></div>
      </div>

      {/* Summary mini-cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MiniCard icon={<User size={15} />}     label="Customer ID" value={String(order.customerId ?? '—')} />
        <MiniCard icon={<CreditCard size={15} />} label="Total"       value={total ? `$${total.toLocaleString()}` : '—'} />
        <MiniCard icon={<Calendar size={15} />}  label="Date"         value={date} />
        <MiniCard icon={<Package size={15} />}   label="Items"        value={String(items.length)} />
      </div>

      {/* Order info + address */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-3">
        <h3 className="text-sm font-semibold text-gray-800 mb-1">Order Details</h3>
        <Row label="Order ID"    value={String(order.id)} />
        <Row label="Customer ID" value={String(order.customerId ?? '—')} />
        <Row label="Date"        value={date} />
        <Row label="Total Price" value={total ? `$${total.toLocaleString()}` : '—'} />
        <Row label="Status"      value={order.status} />

        {addr && (
          <div className="pt-3 border-t border-gray-100 space-y-2">
            <div className="flex items-center gap-2 text-gray-500">
              <MapPin size={15} />
              <span className="text-xs font-semibold uppercase tracking-wide">Delivery Address</span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm pl-5">
              {addr.region       && <Row label="Region"     value={addr.region} />}
              {addr.district     && <Row label="District"   value={addr.district} />}
              {addr.street       && <Row label="Street"     value={addr.street} />}
              {addr.zip_code     && <Row label="Zip Code"   value={addr.zip_code} />}
              {addr.additional_info && <Row label="Note"    value={addr.additional_info} />}
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
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
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
            <span className="text-sm font-semibold text-gray-700">
              Subtotal: ${itemsTotal.toLocaleString()}
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Qty</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Unit Price</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: OD, idx: number) => {
                const unitPrice = item.product?.price ?? 0
                const name = item.product?.name ?? `Product #${idx + 1}`
                const img  = item.product?.images?.[0]
                return (
                  <tr key={item.id ?? idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {img
                          ? <img src={img} className="w-9 h-9 object-cover rounded-lg border" alt="" />
                          : <div className="w-9 h-9 bg-gray-100 rounded-lg" />
                        }
                        <span className="font-medium text-gray-700">{name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{item.quantity}</td>
                    <td className="px-5 py-3 text-gray-600">${unitPrice.toLocaleString()}</td>
                    <td className="px-5 py-3 font-semibold text-gray-800">
                      ${(unitPrice * item.quantity).toLocaleString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t border-gray-200">
                <td colSpan={3} className="px-5 py-3 text-right text-sm font-semibold text-gray-700">Total</td>
                <td className="px-5 py-3 text-sm font-bold text-gray-900">${itemsTotal.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-12 text-center">
          <Package size={28} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">No item details for this order.</p>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
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
