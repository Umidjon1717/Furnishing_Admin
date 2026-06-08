import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Eye, Trash2 } from 'lucide-react'
import { api } from '../../api'
import { Order } from '../../types'
import DataTable from '../../components/DataTable'
import StatusBadge from '../../components/StatusBadge'
import ConfirmDialog from '../../components/ConfirmDialog'
import Pagination from '../../components/Pagination'

export default function OrdersList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const limit = 20

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page],
    queryFn: async () => {
      const res = await api.get(`/api/order?page=${page}&limit=${limit}`)
      const d = res.data?.data
      return { orders: (d?.orders ?? d?.items ?? []) as Order[], total: d?.total ?? 0 }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/order/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      setDeleteId(null)
    },
  })

  const columns = [
    { header: 'Order ID', accessor: 'id' as keyof Order },
    { header: 'Customer ID', accessor: 'customerId' as keyof Order },
    {
      header: 'Total',
      render: (o: Order) => <span>${o.totalPrice?.toLocaleString()}</span>,
    },
    {
      header: 'Status',
      render: (o: Order) => <StatusBadge status={o.status} />,
    },
    {
      header: 'Date',
      render: (o: Order) => <span>{o.order_date?.slice(0, 10)}</span>,
    },
    {
      header: 'Actions',
      render: (o: Order) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/orders/${o.id}`)}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={() => setDeleteId(o.id)}
            className="p-1.5 rounded hover:bg-red-50 text-red-500"
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
      <DataTable columns={columns} data={data?.orders ?? []} keyField="id" loading={isLoading} />
      <Pagination page={page} total={data?.total ?? 0} limit={limit} onChange={setPage} />
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
