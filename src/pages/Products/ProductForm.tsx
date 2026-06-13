import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Upload, X, GripVertical } from 'lucide-react'
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [existingUrls, setExistingUrls] = useState<string[]>([])
  const dragIndex = useRef<number | null>(null)

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
        width: product.width ?? '',
        length: product.length ?? '',
        height: product.height ?? '',
      })
      if (product.images?.length) {
        setExistingUrls(product.images)
        setPreviewUrls([])
        setSelectedFiles([])
      }
    }
  }, [product, reset])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setSelectedFiles((prev) => {
      const merged = [...prev, ...files]
      setPreviewUrls(merged.map((f) => URL.createObjectURL(f)))
      return merged
    })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeNewFile(index: number) {
    setSelectedFiles((prev) => {
      const updated = prev.filter((_, i) => i !== index)
      setPreviewUrls(updated.map((f) => URL.createObjectURL(f)))
      return updated
    })
  }

  function removeExistingUrl(index: number) {
    setExistingUrls((prev) => prev.filter((_, i) => i !== index))
  }

  // Drag-to-reorder new files
  function onDragStart(index: number) { dragIndex.current = index }
  function onDrop(dropIndex: number) {
    if (dragIndex.current === null || dragIndex.current === dropIndex) return
    setSelectedFiles((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex.current!, 1)
      next.splice(dropIndex, 0, moved)
      setPreviewUrls(next.map((f) => URL.createObjectURL(f)))
      dragIndex.current = null
      return next
    })
  }

  // Drag-to-reorder existing URLs
  const dragExistingIndex = useRef<number | null>(null)
  function onExistingDragStart(index: number) { dragExistingIndex.current = index }
  function onExistingDrop(dropIndex: number) {
    if (dragExistingIndex.current === null || dragExistingIndex.current === dropIndex) return
    setExistingUrls((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragExistingIndex.current!, 1)
      next.splice(dropIndex, 0, moved)
      dragExistingIndex.current = null
      return next
    })
  }

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new window.FormData()
      formData.append('name', data.name)
      formData.append('description', data.description)
      formData.append('price', String(data.price))
      formData.append('stock', String(data.stock))
      formData.append('categoryId', String(data.categoryId))
      formData.append('sku', data.sku)

      // comma-separated strings — backend splits them
      if (data.colors) formData.append('colors', data.colors.replace(/\s*,\s*/g, ','))
      if (data.tags) formData.append('tags', data.tags.replace(/\s*,\s*/g, ','))

      if (data.width !== '') formData.append('width', String(data.width))
      if (data.length !== '') formData.append('length', String(data.length))
      if (data.height !== '') formData.append('height', String(data.height))

      // file uploads
      selectedFiles.forEach((file) => formData.append('images', file))

      const config = { headers: { 'Content-Type': 'multipart/form-data' } }
      if (isEdit) return api.patch(`/api/products/${id}`, formData, config)
      return api.post('/api/products', formData, config)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success(isEdit ? 'Product updated' : 'Product created')
      navigate('/products')
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: unknown } }
      console.error('[product error]', e?.response?.data)
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

      <form
        onSubmit={handleSubmit((d) => mutation.mutate(d))}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5"
        encType="multipart/form-data"
      >
        <Field label="Name *" error={errors.name?.message}>
          <input {...register('name', { required: 'Required' })} className={inp} />
        </Field>

        <Field label="Description *" error={errors.description?.message}>
          <textarea rows={3} {...register('description', { required: 'Required' })} className={inp} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Price ($) *" error={errors.price?.message}>
            <input type="number" step="0.01" min="0" {...register('price', { required: 'Required' })} className={inp} />
          </Field>
          <Field label="Stock *" error={errors.stock?.message}>
            <input type="number" min="0" {...register('stock', { required: 'Required' })} className={inp} />
          </Field>
        </div>

        <Field label="Category *" error={errors.categoryId?.message}>
          <select {...register('categoryId', { required: 'Required' })} className={inp}>
            <option value="">Select category</option>
            {(categories ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>

        <Field label="SKU *" error={errors.sku?.message}>
          <input {...register('sku', { required: 'Required' })} placeholder="e.g. SOF-001" className={inp} />
        </Field>

        <Field label="Colors (comma-separated)">
          <input {...register('colors')} placeholder="red, blue, green" className={inp} />
        </Field>

        <Field label="Tags (comma-separated)">
          <input {...register('tags')} placeholder="modern, sofa, living" className={inp} />
        </Field>

        {/* File upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Images {!isEdit && <span className="text-red-500">*</span>}
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
          >
            <Upload size={20} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Click to add images</p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP — drag thumbnails to reorder</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Existing images (edit mode) */}
          {existingUrls.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-400 mb-2">Current images — drag to reorder, first = cover</p>
              <div className="flex flex-wrap gap-3">
                {existingUrls.map((url, i) => (
                  <div
                    key={url + i}
                    draggable
                    onDragStart={() => onExistingDragStart(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onExistingDrop(i)}
                    className="relative group cursor-grab active:cursor-grabbing"
                  >
                    <img
                      src={url}
                      alt={`existing-${i}`}
                      className={`w-20 h-20 object-cover rounded-lg border-2 ${i === 0 ? 'border-gray-900' : 'border-gray-200'}`}
                    />
                    {i === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] bg-gray-900 text-white rounded-b-lg py-0.5">
                        COVER
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeExistingUrl(i)}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                    <span className="absolute bottom-0 right-0 opacity-0 group-hover:opacity-100 text-gray-400">
                      <GripVertical size={14} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New file previews */}
          {previewUrls.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-400 mb-2">New uploads — drag to reorder</p>
              <div className="flex flex-wrap gap-3">
                {previewUrls.map((url, i) => (
                  <div
                    key={url}
                    draggable
                    onDragStart={() => onDragStart(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onDrop(i)}
                    className="relative group cursor-grab active:cursor-grabbing"
                  >
                    <img
                      src={url}
                      alt={`new-${i}`}
                      className={`w-20 h-20 object-cover rounded-lg border-2 ${i === 0 && existingUrls.length === 0 ? 'border-gray-900' : 'border-gray-200'}`}
                    />
                    {i === 0 && existingUrls.length === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] bg-gray-900 text-white rounded-b-lg py-0.5">
                        COVER
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeNewFile(i)}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Width (m)">
            <input type="number" step="0.01" min="0" {...register('width')} className={inp} />
          </Field>
          <Field label="Length (m)">
            <input type="number" step="0.01" min="0" {...register('length')} className={inp} />
          </Field>
          <Field label="Height (m)">
            <input type="number" step="0.01" min="0" {...register('height')} className={inp} />
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
