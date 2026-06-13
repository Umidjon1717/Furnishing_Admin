import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Trash2, Search, Eye, Download } from 'lucide-react'
import { api } from '../api'
import { Customer } from '../types'
import DataTable from '../components/DataTable'
import ConfirmDialog from '../components/ConfirmDialog'
import Pagination from '../components/Pagination'
import Skeleton from '../components/Skeleton'
import { useToast } from '../components/Toast'
import { exportCSV } from '../utils/csv'

export default function Customers() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const toast = useToast()
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<'' | 'true' | 'false'>('')
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
      toast.success('Customer deleted')
    },
    onError: () => toast.error('Failed to delete customer'),
  })

  const customers = (data?.customers ?? []).filter((c) => {
    const q = search.toLowerCase()
    if (q && !c.full_name?.toLowerCase().includes(q) && !c.email?.toLowerCase().includes(q)) return false
    if (activeFilter === 'true' && !c.is_active) return false
    if (activeFilter === 'false' && c.is_active) return false
    return true
  })

  const columns = [
    { header: 'ID', accessor: 'id' as keyof Customer },
    { header: 'Full Name', accessor: 'full_name' as keyof Customer },
    { header: 'Email', accessor: 'email' as keyof Customer },
    { header: 'Phone', accessor: 'phone_number' as keyof Customer },
    {
      header: 'Active',
      render: (c: Customer) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {c.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (c: Customer) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/customers/${c.id}`)}
            className="p-1.5 rounded hover:bg-blue-50 text-blue-500"
            title="View"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={() => setDeleteId(c.id)}
            className="p-1.5 rounded hover:bg-red-50 text-red-500"
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ]

  function handleExport() {
    exportCSV(
      'customers',
      ['ID', 'Full Name', 'Email', 'Phone', 'Active'],
      customers.map((c) => [c.id, c.full_name ?? '', c.email ?? '', c.phone_number ?? '', c.is_active ? 'Yes' : 'No']),
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
        <button
          onClick={handleExport}
          disabled={customers.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 w-60"
          />
        </div>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value as '' | 'true' | 'false')}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="">All</option>
          <option value="true">Active only</option>
          <option value="false">Inactive only</option>
        </select>
      </div>

      {isLoading ? (
        <Skeleton rows={8} cols={6} />
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center">
          <p className="text-gray-400 text-sm">No customers found.</p>
        </div>
      ) : (
        <DataTable columns={columns} data={customers} keyField="id" />
      )}

      {!isLoading && <Pagination page={page} total={data?.total ?? 0} limit={limit} onChange={setPage} />}

      <ConfirmDialog
        open={deleteId !== null}
        message="Delete this customer? This cannot be undone."
        onConfirm={() => deleteId !== null && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
