import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { api } from '../api'
import { Customer } from '../types'
import DataTable from '../components/DataTable'
import ConfirmDialog from '../components/ConfirmDialog'
import Pagination from '../components/Pagination'

export default function Customers() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const limit = 20

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page],
    queryFn: async () => {
      const res = await api.get(`/api/customer?page=${page}&limit=${limit}`)
      const d = res.data?.data
      return {
        customers: (d?.customers ?? d?.items ?? []) as Customer[],
        total: d?.total ?? 0,
      }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/customer/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setDeleteId(null)
    },
  })

  const columns = [
    { header: 'ID', accessor: 'id' as keyof Customer },
    { header: 'Full Name', accessor: 'full_name' as keyof Customer },
    { header: 'Email', accessor: 'email' as keyof Customer },
    { header: 'Phone', accessor: 'phone_number' as keyof Customer },
    {
      header: 'Active',
      render: (c: Customer) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
          {c.is_active ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (c: Customer) => (
        <button
          onClick={() => setDeleteId(c.id)}
          className="p-1.5 rounded hover:bg-red-50 text-red-500"
        >
          <Trash2 size={15} />
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
      <DataTable columns={columns} data={data?.customers ?? []} keyField="id" loading={isLoading} />
      <Pagination page={page} total={data?.total ?? 0} limit={limit} onChange={setPage} />
      <ConfirmDialog
        open={deleteId !== null}
        message="Delete this customer?"
        onConfirm={() => deleteId !== null && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
