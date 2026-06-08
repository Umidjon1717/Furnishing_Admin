import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import { Payment } from '../types'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'
import Pagination from '../components/Pagination'

export default function Payments() {
  const [page, setPage] = useState(1)
  const limit = 20

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page],
    queryFn: async () => {
      const res = await api.get(`/api/payment?page=${page}&limit=${limit}`)
      const d = res.data?.data
      return {
        payments: (d?.payment ?? d?.payments ?? d?.items ?? []) as Payment[],
        total: d?.total ?? 0,
      }
    },
  })

  const columns = [
    { header: 'ID', accessor: 'id' as keyof Payment },
    { header: 'Order ID', accessor: 'orderId' as keyof Payment },
    {
      header: 'Amount',
      render: (p: Payment) => <span>${p.amount?.toLocaleString()}</span>,
    },
    { header: 'Method', accessor: 'method' as keyof Payment },
    {
      header: 'Status',
      render: (p: Payment) => <StatusBadge status={p.status} />,
    },
    {
      header: 'Date',
      render: (p: Payment) => <span>{p.createdAt?.slice(0, 10)}</span>,
    },
  ]

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-900">Payments</h2>
      <DataTable columns={columns} data={data?.payments ?? []} keyField="id" loading={isLoading} />
      <Pagination page={page} total={data?.total ?? 0} limit={limit} onChange={setPage} />
    </div>
  )
}
