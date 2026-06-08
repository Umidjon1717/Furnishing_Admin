import { ReactNode } from 'react'

interface Props {
  title: string
  value: number | string
  icon: ReactNode
  color?: string
}

export default function StatCard({ title, value, icon, color = 'bg-gray-900' }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
      <div className={`${color} text-white p-3 rounded-lg`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}
