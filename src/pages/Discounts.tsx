import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Pencil, Trash2, Check, X, Plus } from 'lucide-react'
import { api } from '../api'
import { Discount } from '../types'
import DataTable from '../components/DataTable'
import ConfirmDialog from '../components/ConfirmDialog'
import Pagination from '../components/Pagination'

interface DiscountForm {
  productId: number
  discount_percent: number
  start_date: string
  end_date: string
}

export default function Discounts() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const limit = 20

  const { register: reg, handleSubmit, reset, formState: { errors } } = useForm<DiscountForm>()
  const { register: regEdit, handleSubmit: handleEditSubmit, reset: resetEdit } = useForm<DiscountForm>()

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
      ...d,
      productId: Number(d.productId),
      discount_percent: Number(d.discount_percent),
    }),
    onSuccess: () => { invalidate(); setShowForm(false); reset() },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: DiscountForm }) =>
      api.patch(`/api/discount/${id}`, {
        ...data,
        productId: Number(data.productId),
        discount_percent: Number(data.discount_percent),
      }),
    onSuccess: () => { invalidate(); setEditId(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/discount/${id}`),
    onSuccess: () => { invalidate(); setDeleteId(null) },
  })

  function startEdit(d: Discount) {
    setEditId(d.id)
    resetEdit({
      productId: d.productId,
      discount_percent: d.discount_percent,
      start_date: d.start_date?.slice(0, 10),
      end_date: d.end_date?.slice(0, 10),
    })
  }

  const columns = [
    { header: 'ID', accessor: 'id' as keyof Discount },
    { header: 'Product ID', accessor: 'productId' as keyof Discount },
    {
      header: 'Discount %',
      render: (d: Discount) => <span>{d.discount_percent}%</span>,
    },
    {
      header: 'Start Date',
      render: (d: Discount) => <span>{d.start_date?.slice(0, 10)}</span>,
    },
    {
      header: 'End Date',
      render: (d: Discount) => <span>{d.end_date?.slice(0, 10)}</span>,
    },
    {
      header: 'Actions',
      render: (d: Discount) =>
        editId === d.id ? (
          <form
            onSubmit={handleEditSubmit((data) => updateMutation.mutate({ id: d.id, data }))}
            className="flex items-center gap-1"
          >
            <button type="submit" disabled={updateMutation.isPending} className="p-1.5 rounded hover:bg-green-50 text-green-600">
              <Check size={15} />
            </button>
            <button type="button" onClick={() => setEditId(null)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
              <X size={15} />
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => startEdit(d)} className="p-1.5 rounded hover:bg-gray-100 text-gray-600">
              <Pencil size={15} />
            </button>
            <button onClick={() => setDeleteId(d.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500">
              <Trash2 size={15} />
            </button>
          </div>
        ),
    },
  ]

  const inp = 'px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900'

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Discounts</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >
          <Plus size={16} /> New Discount
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit((d) => createMutation.mutate(d))}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 grid grid-cols-2 gap-4"
        >
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Product ID</label>
            <input type="number" {...reg('productId', { required: true })} className={inp} />
            {errors.productId && <p className="text-red-500 text-xs mt-0.5">Required</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Discount %</label>
            <input type="number" step="0.01" {...reg('discount_percent', { required: true })} className={inp} />
            {errors.discount_percent && <p className="text-red-500 text-xs mt-0.5">Required</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
            <input type="date" {...reg('start_date', { required: true })} className={inp} />
            {errors.start_date && <p className="text-red-500 text-xs mt-0.5">Required</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
            <input type="date" {...reg('end_date', { required: true })} className={inp} />
            {errors.end_date && <p className="text-red-500 text-xs mt-0.5">Required</p>}
          </div>
          <div className="col-span-2 flex gap-3">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating…' : 'Create Discount'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); reset() }}
              className="px-5 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {editId !== null && (
        <form
          onSubmit={handleEditSubmit((data) => updateMutation.mutate({ id: editId, data }))}
          className="bg-white rounded-xl shadow-sm border border-blue-200 p-5 grid grid-cols-2 gap-4"
        >
          <p className="col-span-2 text-sm font-medium text-blue-700">Editing Discount #{editId}</p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Product ID</label>
            <input type="number" {...regEdit('productId')} className={inp} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Discount %</label>
            <input type="number" step="0.01" {...regEdit('discount_percent')} className={inp} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
            <input type="date" {...regEdit('start_date')} className={inp} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
            <input type="date" {...regEdit('end_date')} className={inp} />
          </div>
          <div className="col-span-2 flex gap-3">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => setEditId(null)}
              className="px-5 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <DataTable columns={columns} data={data?.discounts ?? []} keyField="id" loading={isLoading} />
      <Pagination page={page} total={data?.total ?? 0} limit={limit} onChange={setPage} />

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
