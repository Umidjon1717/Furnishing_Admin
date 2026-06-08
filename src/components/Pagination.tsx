import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  page: number
  total: number
  limit: number
  onChange: (page: number) => void
}

export default function Pagination({ page, total, limit, onChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
      <span>
        Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="px-3 py-1 rounded border border-gray-300 bg-white font-medium">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
