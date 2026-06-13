import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Eye, Trash2 } from 'lucide-react'
import { api } from '../../api'
import { Order, normalizeOrder } from '../../types'
import DataTable from '../../components/DataTable'
import StatusBadge from '../../components/StatusBadge'
import ConfirmDialog from '../../components/ConfirmDialog'
import Pagination from '../../components/Pagination'
import Skeleton from '../../components/Skeleton'
import { useToast } from '../../components/Toast'

const STATUS_OPTIONS = ['', 'NEW', 'PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED']

export default function OrdersList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const limit = 20

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page],
    queryFn: async () => {
      const res = await api.get(`/api/order?page=${page}&limit=${limit}`)
      const d = res.data?.data
      const raw = (d?.orders ?? d?.items ?? []) as Record<string, unknown>[]
      const orders = raw.map(normalizeOrder).reverse() // newest first
      return { orders, total: d?.total ?? 0 }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/order/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      setDeleteId(null)
      toast.success('Order deleted')
    },
    onError: () => toast.error('Failed to delete order'),
  })

  const orders = (data?.orders ?? []).filter((o) => {
    if (statusFilter && o.status !== statusFilter) return false
    const q = search.toLowerCase()
    if (q && !String(o.id).includes(q) && !String(o.customerId).includes(q)) return false
    const date = o.order_date?.slice(0, 10) ?? ''
    if (dateFrom && date < dateFrom) return false
    if (dateTo && date > dateTo) return false
    return true
  })

  const columns = [
    { header: 'Order ID', accessor: 'id' as keyof Order },
    { header: 'Customer ID', accessor: 'customerId' as keyof Order },
    {
      header: 'Total',
      render: (o: Order) => (
        <span className="font-medium">
          {o.totalPrice ? `$${o.totalPrice.toLocaleString()}` : '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (o: Order) => <StatusBadge status={o.status} />,
    },
    {
      header: 'Date',
      render: (o: Order) => (
        <span className="text-gray-500">{(o.order_date ?? o.createdAt ?? '').slice(0, 10)}</span>
      ),
    },
    {
      header: 'Actions',
      render: (o: Order) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/orders/${o.id}`)}
            className="p-1.5 rounded hover:bg-blue-50 text-blue-500"
            title="View"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={() => setDeleteId(o.id)}
            className="p-1.5 rounded hover:bg-red-50 text-red-500"
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-900">Orders</h2>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by order or customer ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={inp + ' w-56'}
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className={inp + ' w-44'}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s || 'All Statuses'}</option>
          ))}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inp} title="From date" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inp} title="To date" />
        {(statusFilter || dateFrom || dateTo || search) && (
          <button
            onClick={() => { setStatusFilter(''); setDateFrom(''); setDateTo(''); setSearch('') }}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Clear
          </button>
        )}
      </div>

      {isLoading ? (
        <Skeleton rows={8} cols={6} />
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center">
          <p className="text-gray-400 text-sm">No orders match your filters.</p>
        </div>
      ) : (
        <DataTable columns={columns} data={orders} keyField="id" />
      )}

      {!isLoading && <Pagination page={page} total={data?.total ?? 0} limit={limit} onChange={setPage} />}

      <ConfirmDialog
        open={deleteId !== null}
        message="Delete this order?"
        onConfirm={() => deleteId !== null && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

const inp = 'px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900'
