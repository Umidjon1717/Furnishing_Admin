import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Pencil, Trash2, Plus, X } from 'lucide-react'
import { api } from '../api'
import { Discount } from '../types'
import DataTable from '../components/DataTable'
import ConfirmDialog from '../components/ConfirmDialog'
import Pagination from '../components/Pagination'
import Skeleton from '../components/Skeleton'
import { useToast } from '../components/Toast'

interface DiscountForm {
  productId: number
  discount_percent: number
  start_date: string
  end_date: string
}

export default function Discounts() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const limit = 20

  const createForm = useForm<DiscountForm>()
  const editForm = useForm<DiscountForm>()

  const { data, isLoading } = useQuery({
    queryKey: ['discounts', page],
    queryFn: async () => {
      const res = await api.get(`/api/discount?page=${page}&limit=${limit}`)
      const d = res.data?.data
      return {
        discounts: (d?.discounts ?? d?.items ?? []) as Discount[],
        total: d?.total ?? 0,
      }
    },
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['discounts'] })

  const createMutation = useMutation({
    mutationFn: (d: DiscountForm) => api.post('/api/discount', {
      ...d, productId: Number(d.productId), discount_percent: Number(d.discount_percent),
    }),
    onSuccess: () => { invalidate(); setShowForm(false); createForm.reset(); toast.success('Discount created') },
    onError: () => toast.error('Failed to create discount'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: DiscountForm }) =>
      api.patch(`/api/discount/${id}`, {
        ...data, productId: Number(data.productId), discount_percent: Number(data.discount_percent),
      }),
    onSuccess: () => { invalidate(); setEditId(null); toast.success('Discount updated') },
    onError: () => toast.error('Failed to update discount'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/discount/${id}`),
    onSuccess: () => { invalidate(); setDeleteId(null); toast.success('Discount deleted') },
    onError: () => toast.error('Failed to delete discount'),
  })

  function startEdit(d: Discount) {
    setEditId(d.id)
    setShowForm(false)
    editForm.reset({
      productId: d.productId,
      discount_percent: d.discount_percent,
      start_date: d.start_date?.slice(0, 10),
      end_date: d.end_date?.slice(0, 10),
    })
  }

  const columns = [
    { header: 'ID', accessor: 'id' as keyof Discount },
    { header: 'Product ID', accessor: 'productId' as keyof Discount },
    { header: 'Discount %', render: (d: Discount) => <span className="font-medium text-green-700">{d.discount_percent}%</span> },
    { header: 'Start', render: (d: Discount) => <span className="text-gray-500">{d.start_date?.slice(0, 10)}</span> },
    { header: 'End', render: (d: Discount) => <span className="text-gray-500">{d.end_date?.slice(0, 10)}</span> },
    {
      header: 'Actions',
      render: (d: Discount) => (
        <div className="flex items-center gap-2">
          <button onClick={() => startEdit(d)} className="p-1.5 rounded hover:bg-blue-50 text-blue-500" title="Edit">
            <Pencil size={15} />
          </button>
          <button onClick={() => setDeleteId(d.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500" title="Delete">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ]

  const inp = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900'

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Discounts</h2>
        <button
          onClick={() => { setShowForm(!showForm); setEditId(null) }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'New Discount'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={createForm.handleSubmit((d) => createMutation.mutate(d))}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
        >
          <h3 className="text-sm font-semibold text-gray-800 mb-4">New Discount</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Product ID</label>
              <input type="number" {...createForm.register('productId', { required: true })} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Discount %</label>
              <input type="number" step="0.01" min="0" max="100" {...createForm.register('discount_percent', { required: true })} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
              <input type="date" {...createForm.register('start_date', { required: true })} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
              <input type="date" {...createForm.register('end_date', { required: true })} className={inp} />
            </div>
            <div className="col-span-2">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating…' : 'Create Discount'}
              </button>
            </div>
          </div>
        </form>
      )}

      {editId !== null && (
        <form
          onSubmit={editForm.handleSubmit((d) => updateMutation.mutate({ id: editId, data: d }))}
          className="bg-white rounded-xl shadow-sm border border-blue-200 p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-blue-700">Editing Discount #{editId}</h3>
            <button type="button" onClick={() => setEditId(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Product ID</label>
              <input type="number" {...editForm.register('productId')} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Discount %</label>
              <input type="number" step="0.01" {...editForm.register('discount_percent')} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
              <input type="date" {...editForm.register('start_date')} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
              <input type="date" {...editForm.register('end_date')} className={inp} />
            </div>
            <div className="col-span-2">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      )}

      {isLoading ? (
        <Skeleton rows={6} cols={6} />
      ) : (data?.discounts ?? []).length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center">
          <p className="text-gray-400 text-sm">No discounts yet.</p>
        </div>
      ) : (
        <DataTable columns={columns} data={data?.discounts ?? []} keyField="id" />
      )}

      {!isLoading && <Pagination page={page} total={data?.total ?? 0} limit={limit} onChange={setPage} />}

      <ConfirmDialog
        open={deleteId !== null}
        message="Delete this discount?"
        onConfirm={() => deleteId !== null && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
