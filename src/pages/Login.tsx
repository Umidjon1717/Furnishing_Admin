import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { api } from '../api'

interface FormData {
  email: string
  password: string
}

export default function Login() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>()

  async function onSubmit(data: FormData) {
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/api/admin/auth/signin', data)
      const token = res.data?.data?.access_token
      if (!token) throw new Error('No token')
      localStorage.setItem('admin_token', token)
      localStorage.setItem('admin_email', data.email)
      navigate('/')
    } catch {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Furnishing</h1>
          <p className="text-sm text-gray-500 mt-1">Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              {...register('email', { required: true })}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
              placeholder="admin@example.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">Email is required</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              {...register('password', { required: true })}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">Password is required</p>}
          </div>

          {error && (
            <p className="text-red-600 text-sm text-center bg-red-50 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
