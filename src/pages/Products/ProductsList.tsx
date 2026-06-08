import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { api } from '../../api'
import { Product } from '../../types'
import DataTable from '../../components/DataTable'
import ConfirmDialog from '../../components/ConfirmDialog'
import Pagination from '../../components/Pagination'

export default function ProductsList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
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
    },
  })

  const products = (data?.products ?? []).filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  )

  const columns = [
    {
      header: 'Image',
      render: (p: Product) =>
        p.images?.[0] ? (
          <img src={p.images[0]} alt={p.name} className="w-10 h-10 object-cover rounded" />
        ) : (
          <div className="w-10 h-10 bg-gray-100 rounded" />
        ),
    },
    { header: 'Name', accessor: 'name' as keyof Product },
    {
      header: 'Category',
      render: (p: Product) => <span>{p.category?.name ?? p.categoryId}</span>,
    },
    {
      header: 'Price',
      render: (p: Product) => <span>${p.price.toLocaleString()}</span>,
    },
    { header: 'Stock', accessor: 'stock' as keyof Product },
    { header: 'SKU', accessor: 'sku' as keyof Product },
    {
      header: 'Actions',
      render: (p: Product) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/products/${p.id}`)}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => setDeleteId(p.id)}
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Products</h2>
        <button
          onClick={() => navigate('/products/new')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >
          <Plus size={16} /> New Product
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by name…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
      />

      <DataTable columns={columns} data={products} keyField="id" loading={isLoading} />

      <Pagination page={page} total={data?.total ?? 0} limit={limit} onChange={setPage} />

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
