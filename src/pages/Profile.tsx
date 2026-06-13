import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { UserCircle, Lock, Check } from 'lucide-react'
import { api } from '../api'
import { useToast } from '../components/Toast'

interface PwForm {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

const card = 'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700'
const inp = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 placeholder:text-gray-400 dark:placeholder:text-gray-500'

export default function Profile() {
  const toast = useToast()
  const email = localStorage.getItem('admin_email') ?? 'admin@furnishing.com'
  const [pwLoading, setPwLoading] = useState(false)

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<PwForm>()
  const newPw = watch('newPassword')

  async function onChangePw(data: PwForm) {
    setPwLoading(true)
    try {
      await api.post('/api/admin/auth/change-password', {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      })
      toast.success('Password changed successfully')
      reset()
    } catch {
      toast.error('Failed to change password — check your current password')
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h2>

      {/* Account info */}
      <div className={`${card} p-6`}>
        <div className="flex items-center gap-4 mb-5">
          <div className="bg-gray-900 dark:bg-gray-700 text-white rounded-full p-3">
            <UserCircle size={28} />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Admin</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{email}</p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <Row label="Email" value={email} />
          <Row label="Role" value="Administrator" />
        </div>
      </div>

      {/* Change password */}
      <div className={`${card} p-6`}>
        <div className="flex items-center gap-2 mb-5">
          <Lock size={18} className="text-gray-500 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">Change Password</h3>
        </div>

        <form onSubmit={handleSubmit(onChangePw)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
            <input
              type="password"
              {...register('oldPassword', { required: 'Required' })}
              className={inp}
              placeholder="••••••••"
            />
            {errors.oldPassword && <p className="text-red-500 text-xs mt-1">{errors.oldPassword.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
            <input
              type="password"
              {...register('newPassword', { required: 'Required', minLength: { value: 6, message: 'Min 6 characters' } })}
              className={inp}
              placeholder="••••••••"
            />
            {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
            <input
              type="password"
              {...register('confirmPassword', {
                required: 'Required',
                validate: (v) => v === newPw || 'Passwords do not match',
              })}
              className={inp}
              placeholder="••••••••"
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={pwLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-gray-700 text-white text-sm font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            <Check size={15} />
            {pwLoading ? 'Saving…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
      <span className="text-gray-400 dark:text-gray-500">{label}</span>
      <span className="text-gray-800 dark:text-gray-200 font-medium">{value}</span>
    </div>
  )
}
