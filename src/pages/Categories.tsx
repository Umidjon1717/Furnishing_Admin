import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2, Check, X, Tag } from 'lucide-react'
import { api } from '../api'
import { Category } from '../types'
import ConfirmDialog from '../components/ConfirmDialog'
import Skeleton from '../components/Skeleton'
import { useToast } from '../components/Toast'

export default function Categories() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/api/category')
      // backend key is "categorys" (intentional typo on backend)
      return (res.data?.data?.categorys ?? []) as Category[]
    },
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['categories'] })

  const createMutation = useMutation({
    mutationFn: () => api.post('/api/category', { name: newName }),
    onSuccess: () => { invalidate(); setNewName(''); toast.success('Category created') },
    onError: () => toast.error('Failed to create category'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      api.patch(`/api/category/${id}`, { name }),
    onSuccess: () => { invalidate(); setEditId(null); toast.success('Category updated') },
    onError: () => toast.error('Failed to update category'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/category/${id}`),
    onSuccess: () => { invalidate(); setDeleteId(null); toast.success('Category deleted') },
    onError: () => toast.error('Failed to delete category'),
  })

  function startEdit(c: Category) {
    setEditId(c.id)
    setEditName(c.name)
  }

  return (
    <div className="space-y-5 max-w-xl">
      <h2 className="text-2xl font-bold text-gray-900">Categories</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex gap-3">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name…"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          onKeyDown={(e) => e.key === 'Enter' && newName && createMutation.mutate()}
        />
        <button
          onClick={() => newName && createMutation.mutate()}
          disabled={!newName || createMutation.isPending}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-40 transition-colors"
        >
          {createMutation.isPending ? '…' : 'Add'}
        </button>
      </div>

      {isLoading ? (
        <Skeleton rows={5} cols={2} />
      ) : (categories ?? []).length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center">
          <Tag size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm">No categories yet. Add one above.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(categories ?? []).map((c) => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    {editId === c.id ? (
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') updateMutation.mutate({ id: c.id, name: editName })
                          if (e.key === 'Escape') setEditId(null)
                        }}
                        className="px-2 py-1 border border-blue-400 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-full max-w-xs"
                      />
                    ) : (
                      <span className="text-gray-700">{c.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {editId === c.id ? (
                        <>
                          <button
                            onClick={() => updateMutation.mutate({ id: c.id, name: editName })}
                            disabled={updateMutation.isPending}
                            className="p-1.5 rounded hover:bg-green-50 text-green-600"
                            title="Save"
                          >
                            <Check size={15} />
                          </button>
                          <button
                            onClick={() => setEditId(null)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                            title="Cancel"
                          >
                            <X size={15} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(c)}
                            className="p-1.5 rounded hover:bg-blue-50 text-blue-500"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteId(c.id)}
                            className="p-1.5 rounded hover:bg-red-50 text-red-500"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        message="Delete this category? Products using it may be affected."
        onConfirm={() => deleteId !== null && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
