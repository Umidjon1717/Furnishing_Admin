import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { api } from '../../api'
import { Category } from '../../types'
import { useToast } from '../../components/Toast'

interface FormData {
  name: string
  description: string
  price: number
  stock: number
  categoryId: number
  sku: string
  colors: string
  tags: string
  images: string
  width: number | ''
  length: number | ''
  height: number | ''
}

export default function ProductForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>()

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/api/category')
      return (res.data?.data?.categorys ?? []) as Category[]
    },
  })

  const { data: product } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await api.get(`/api/products/${id}`)
      return res.data?.data ?? res.data
    },
    enabled: isEdit,
  })

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        categoryId: product.categoryId,
        sku: product.sku ?? '',
        colors: (product.colors ?? []).join(', '),
        tags: (product.tags ?? []).join(', '),
        images: (product.images ?? []).join('\n'),
        width: product.width ?? '',
        length: product.length ?? '',
        height: product.height ?? '',
      })
    }
  }, [product, reset])

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        name: data.name,
        description: data.description,
        price: Number(data.price),
        stock: Number(data.stock),
        categoryId: Number(data.categoryId),
        sku: data.sku,
        colors: data.colors ? data.colors.split(',').map((s) => s.trim()).filter(Boolean) : [],
        tags: data.tags ? data.tags.split(',').map((s) => s.trim()).filter(Boolean) : [],
        images: data.images ? data.images.split('\n').map((s) => s.trim()).filter(Boolean) : [],
        ...(data.width !== '' && { width: Number(data.width) }),
        ...(data.length !== '' && { length: Number(data.length) }),
        ...(data.height !== '' && { height: Number(data.height) }),
      }
      console.log('[product payload]', payload)
      if (isEdit) return api.patch(`/api/products/${id}`, payload)
      return api.post('/api/products', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success(isEdit ? 'Product updated' : 'Product created')
      navigate('/products')
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: unknown } }
      console.error('[product save error]', e?.response?.data)
      toast.error('Failed to save product')
    },
  })

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/products')} className="p-1.5 rounded hover:bg-gray-100">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Product' : 'New Product'}</h2>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <Field label="Name" error={errors.name?.message}>
          <input {...register('name', { required: 'Required' })} className={inp} />
        </Field>

        <Field label="Description" error={errors.description?.message}>
          <textarea rows={3} {...register('description', { required: 'Required' })} className={inp} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Price ($)" error={errors.price?.message}>
            <input type="number" step="0.01" {...register('price', { required: 'Required' })} className={inp} />
          </Field>
          <Field label="Stock" error={errors.stock?.message}>
            <input type="number" {...register('stock', { required: 'Required' })} className={inp} />
          </Field>
        </div>

        <Field label="Category" error={errors.categoryId?.message}>
          <select {...register('categoryId', { required: 'Required' })} className={inp}>
            <option value="">Select category</option>
            {(categories ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>

        <Field label="SKU">
          <input {...register('sku')} className={inp} />
        </Field>

        <Field label="Colors (comma-separated)">
          <input {...register('colors')} placeholder="White, Brown, Black" className={inp} />
        </Field>

        <Field label="Tags (comma-separated)">
          <input {...register('tags')} placeholder="modern, sofa, living" className={inp} />
        </Field>

        <Field label="Image URLs (one per line)">
          <textarea rows={3} {...register('images')} placeholder="https://…" className={inp} />
        </Field>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Width (m)">
            <input type="number" step="0.01" {...register('width')} className={inp} />
          </Field>
          <Field label="Length (m)">
            <input type="number" step="0.01" {...register('length')} className={inp} />
          </Field>
          <Field label="Height (m)">
            <input type="number" step="0.01" {...register('height')} className={inp} />
          </Field>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {mutation.isPending ? 'Saving…' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

const inp = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900'

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}
