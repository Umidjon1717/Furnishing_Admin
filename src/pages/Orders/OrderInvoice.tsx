import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { Printer, ChevronLeft } from 'lucide-react'
import { api } from '../../api'
import { OrderDetail as OD, normalizeOrder } from '../../types'

export default function OrderInvoice() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  function getFromListCache() {
    for (let page = 1; page <= 10; page++) {
      const cached = queryClient.getQueryData<{ orders: ReturnType<typeof normalizeOrder>[] }>(['orders', page])
      const found = cached?.orders?.find((o) => String(o.id) === id)
      if (found) return found
    }
    const single = queryClient.getQueryData<ReturnType<typeof normalizeOrder>>(['order', id])
    return single ?? undefined
  }

  const { data: order, isLoading } = useQuery({
    queryKey: ['order-invoice', id],
    initialData: getFromListCache,
    queryFn: async () => {
      const res = await api.get(`/api/order/${id}`)
      const d = res.data?.data
      let raw: Record<string, unknown> | null = null
      if (d && typeof d === 'object') {
        if ('id' in d) raw = d as Record<string, unknown>
        else if (Array.isArray(d)) raw = (d as Record<string, unknown>[]).find((o) => String(o.id) === id) ?? d[0] ?? null
        else if ('orders' in d) {
          const list = (d as { orders: Record<string, unknown>[] }).orders
          raw = list.find((o) => String(o.id) === id) ?? list[0] ?? null
        }
      }
      if (!raw?.id) return getFromListCache() ?? normalizeOrder({})
      return normalizeOrder(raw)
    },
  })

  if (isLoading) return <p className="p-8 text-gray-400">Loading invoice…</p>
  if (!order?.id) return <p className="p-8 text-gray-500">Order not found.</p>

  const items = order.order_details ?? []
  const addr = order.order_address
  const itemsTotal = items.reduce((s, i) => s + (i.product?.price ?? 0) * i.quantity, 0)
  const total = order.total_price ?? itemsTotal
  const date = order.order_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)

  return (
    <>
      {/* Print-hidden toolbar */}
      <div className="print:hidden flex items-center gap-3 mb-6">
        <button onClick={() => navigate(`/orders/${id}`)} className="p-1.5 rounded hover:bg-gray-100">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-gray-900 flex-1">Invoice — Order #{order.id}</h2>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >
          <Printer size={14} />
          Print / Save PDF
        </button>
      </div>

      {/* Invoice document */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-2xl print:shadow-none print:border-none print:rounded-none print:max-w-full print:p-0">

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">INVOICE</h1>
            <p className="text-gray-400 text-sm mt-1">#{order.id}</p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p className="font-semibold text-gray-800 text-base">Furnishing Admin</p>
            <p>furnishing-admin.vercel.app</p>
            <p className="mt-1">Date: {date}</p>
          </div>
        </div>

        {/* Bill to / ship to */}
        <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Bill To</p>
            <p className="font-medium text-gray-800">Customer #{order.customerId ?? '—'}</p>
          </div>
          {addr && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Ship To</p>
              {addr.region    && <p className="text-gray-700">{addr.region}{addr.district ? `, ${addr.district}` : ''}</p>}
              {addr.street    && <p className="text-gray-700">{addr.street}</p>}
              {addr.zip_code  && <p className="text-gray-700">ZIP {addr.zip_code}</p>}
              {addr.additional_info && <p className="text-gray-500 text-xs mt-1">{addr.additional_info}</p>}
            </div>
          )}
        </div>

        {/* Items table */}
        <table className="w-full text-sm mb-8 border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="py-2 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
              <th className="py-2 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
              <th className="py-2 text-center text-xs font-semibold text-gray-500 uppercase">Qty</th>
              <th className="py-2 text-right text-xs font-semibold text-gray-500 uppercase">Unit Price</th>
              <th className="py-2 text-right text-xs font-semibold text-gray-500 uppercase">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-gray-400 text-xs">No items</td>
              </tr>
            ) : items.map((item: OD, idx: number) => {
              const price = item.product?.price ?? 0
              return (
                <tr key={item.id ?? idx} className="border-b border-gray-100">
                  <td className="py-2.5 text-gray-400">{idx + 1}</td>
                  <td className="py-2.5 text-gray-700 font-medium">{item.product?.name ?? `Product #${idx + 1}`}</td>
                  <td className="py-2.5 text-center text-gray-600">{item.quantity}</td>
                  <td className="py-2.5 text-right text-gray-600">${price.toLocaleString()}</td>
                  <td className="py-2.5 text-right font-semibold text-gray-800">${(price * item.quantity).toLocaleString()}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-56 space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${itemsTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t-2 border-gray-900 pt-1.5 font-bold text-gray-900 text-base">
              <span>Total</span>
              <span>${total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Status / notes */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-xs text-gray-400 flex justify-between">
          <span>Status: <span className="font-semibold text-gray-600">{order.status}</span></span>
          <span>Thank you for your business.</span>
        </div>
      </div>

      <style>{`
        @media print {
          body > * { display: none !important; }
          #root > * { display: none !important; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-none { border: none !important; }
          .print\\:rounded-none { border-radius: 0 !important; }
          .print\\:max-w-full { max-width: 100% !important; }
          .print\\:p-0 { padding: 0 !important; }
        }
      `}</style>
    </>
  )
}
