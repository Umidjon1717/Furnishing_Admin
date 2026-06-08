import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { api } from '../../api'
import { Product } from '../../types'
import DataTable from '../../components/DataTable'
import ConfirmDialog from '../../components/ConfirmDialog'
import Pagination from '../../components/Pagination'
import Skeleton from '../../components/Skeleton'
import { useToast } from '../../components/Toast'

export default function ProductsList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const limit = 20

  const { data, isLoading } = useQuery({
    queryKey: ['products', page],
    queryFn: async () => {
      const res = await api.get(`/api/products?page=${page}&limit=${limit}`)
      return res.data?.data as { products: Product[]; total: number }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setDeleteId(null)
      toast.success('Product deleted')
    },
    onError: () => toast.error('Failed to delete product'),
  })

  const products = (data?.products ?? []).filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  )

  const columns = [
    {
      header: 'Image',
      render: (p: Product) =>
        p.images?.[0] ? (
          <img src={p.images[0]} alt={p.name} className="w-10 h-10 object-cover rounded-lg" />
        ) : (
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300 text-xs">N/A</div>
        ),
    },
    { header: 'Name', accessor: 'name' as keyof Product },
    {
      header: 'Category',
      render: (p: Product) => (
        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{p.category?.name ?? `#${p.categoryId}`}</span>
      ),
    },
    {
      header: 'Price',
      render: (p: Product) => <span className="font-medium">${p.price.toLocaleString()}</span>,
    },
    {
      header: 'Stock',
      render: (p: Product) => (
        <span className={`font-medium ${p.stock <= 5 ? 'text-red-600' : p.stock <= 20 ? 'text-yellow-600' : 'text-green-600'}`}>
          {p.stock}
        </span>
      ),
    },
    { header: 'SKU', accessor: 'sku' as keyof Product },
    {
      header: 'Actions',
      render: (p: Product) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/products/${p.id}`)}
            className="p-1.5 rounded hover:bg-blue-50 text-blue-500"
            title="Edit"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => setDeleteId(p.id)}
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Products</h2>
        <button
          onClick={() => navigate('/products/new')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus size={16} /> New Product
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      {isLoading ? (
        <Skeleton rows={6} cols={7} />
      ) : products.length === 0 ? (
        <EmptyState message={search ? `No products match "${search}"` : 'No products yet. Create your first one.'} />
      ) : (
        <DataTable columns={columns} data={products} keyField="id" />
      )}

      {!isLoading && <Pagination page={page} total={data?.total ?? 0} limit={limit} onChange={setPage} />}

      <ConfirmDialog
        open={deleteId !== null}
        message="Delete this product? This cannot be undone."
        onConfirm={() => deleteId !== null && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center">
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  )
}
