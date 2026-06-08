import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import { Payment } from '../types'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'
import Pagination from '../components/Pagination'
import Skeleton from '../components/Skeleton'

const STATUS_OPTIONS = ['', 'PENDING', 'COMPLETED', 'FAILED']
const METHOD_OPTIONS = ['', 'CARD', 'CASH']

export default function Payments() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const limit = 20

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page],
    queryFn: async () => {
      const res = await api.get(`/api/payment?page=${page}&limit=${limit}`)
      const d = res.data?.data
      return {
        payments: (d?.payment ?? []) as Payment[], // backend key is "payment" (no s)
        total: d?.total ?? 0,
      }
    },
  })

  const payments = (data?.payments ?? []).filter((p) => {
    if (statusFilter && p.status !== statusFilter) return false
    if (methodFilter && p.method !== methodFilter) return false
    return true
  })

  const columns = [
    { header: 'ID', accessor: 'id' as keyof Payment },
    { header: 'Order ID', accessor: 'orderId' as keyof Payment },
    {
      header: 'Amount',
      render: (p: Payment) => <span className="font-medium">${p.amount?.toLocaleString()}</span>,
    },
    {
      header: 'Method',
      render: (p: Payment) => (
        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">{p.method}</span>
      ),
    },
    {
      header: 'Status',
      render: (p: Payment) => <StatusBadge status={p.status} />,
    },
    {
      header: 'Date',
      render: (p: Payment) => <span className="text-gray-500">{p.createdAt?.slice(0, 10)}</span>,
    },
  ]

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-900">Payments</h2>

      <div className="flex gap-3 flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          {METHOD_OPTIONS.map((m) => <option key={m} value={m}>{m || 'All Methods'}</option>)}
        </select>
        {(statusFilter || methodFilter) && (
          <button
            onClick={() => { setStatusFilter(''); setMethodFilter('') }}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Clear
          </button>
        )}
      </div>

      {isLoading ? (
        <Skeleton rows={8} cols={6} />
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center">
          <p className="text-gray-400 text-sm">No payments found.</p>
        </div>
      ) : (
        <DataTable columns={columns} data={payments} keyField="id" />
      )}

      {!isLoading && <Pagination page={page} total={data?.total ?? 0} limit={limit} onChange={setPage} />}
    </div>
  )
}
