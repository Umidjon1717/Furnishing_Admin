import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import { api } from '../api'
import { Category } from '../types'
import ConfirmDialog from '../components/ConfirmDialog'

export default function Categories() {
  const queryClient = useQueryClient()
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/api/category')
      const d = res.data?.data ?? res.data
      return (Array.isArray(d) ? d : d?.categories ?? d?.items ?? []) as Category[]
    },
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['categories'] })

  const createMutation = useMutation({
    mutationFn: () => api.post('/api/category', { name: newName }),
    onSuccess: () => { invalidate(); setNewName('') },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      api.patch(`/api/category/${id}`, { name }),
    onSuccess: () => { invalidate(); setEditId(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/category/${id}`),
    onSuccess: () => { invalidate(); setDeleteId(null) },
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
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-40"
        >
          {createMutation.isPending ? '…' : 'Add'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <p className="text-center py-10 text-gray-400 text-sm">Loading…</p>
        ) : (categories ?? []).length === 0 ? (
          <p className="text-center py-10 text-gray-400 text-sm">No categories yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(categories ?? []).map((c) => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {editId === c.id ? (
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
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
                          >
                            <Check size={15} />
                          </button>
                          <button
                            onClick={() => setEditId(null)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                          >
                            <X size={15} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(c)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteId(c.id)}
                            className="p-1.5 rounded hover:bg-red-50 text-red-500"
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
        )}
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        message="Delete this category?"
        onConfirm={() => deleteId !== null && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
