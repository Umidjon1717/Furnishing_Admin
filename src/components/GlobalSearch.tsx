import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const dq = useDebounce(query.trim(), 300)
  const navigate = useNavigate()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const enabled = dq.length >= 2

  const { data: products, isFetching: pFetching } = useQuery({
    queryKey: ['gsearch-products', dq],
    queryFn: async () => {
      const res = await api.get(`/api/products?page=1&limit=100`)
      const all = (res.data?.data?.products ?? []) as Array<{ id: number; name: string }>
      return all.filter((p) => p.name?.toLowerCase().includes(dq.toLowerCase())).slice(0, 5)
    },
    enabled,
  })

  const { data: customers, isFetching: cFetching } = useQuery({
    queryKey: ['gsearch-customers', dq],
    queryFn: async () => {
      const res = await api.get(`/api/customer?page=1&limit=100`)
      const all = (res.data?.data?.customers ?? res.data?.data?.items ?? []) as Array<{
        id: number; full_name: string; email: string
      }>
      return all
        .filter((c) =>
          c.full_name?.toLowerCase().includes(dq.toLowerCase()) ||
          c.email?.toLowerCase().includes(dq.toLowerCase()),
        )
        .slice(0, 5)
    },
    enabled,
  })

  const { data: orders, isFetching: oFetching } = useQuery({
    queryKey: ['gsearch-orders', dq],
    queryFn: async () => {
      const res = await api.get(`/api/order?page=1&limit=100`)
      const all = (res.data?.data?.orders ?? []) as Array<{ id: number; status: string }>
      return all.filter((o) => String(o.id).includes(dq)).slice(0, 5)
    },
    enabled: enabled && /^\d+$/.test(dq),
  })

  const isFetching = pFetching || cFetching || oFetching
  const hasResults = (products?.length ?? 0) + (customers?.length ?? 0) + (orders?.length ?? 0) > 0

  useEffect(() => {
    setOpen(enabled)
  }, [enabled])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function go(path: string) {
    navigate(path)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={wrapperRef} className="relative flex-1 max-w-md">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => enabled && setOpen(true)}
          placeholder="Search products, orders, customers…"
          className="w-full pl-9 pr-8 py-2 text-sm bg-gray-100 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setOpen(false) }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {open && enabled && (
        <div className="absolute top-full mt-1.5 left-0 right-0 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          {isFetching && !hasResults ? (
            <p className="text-xs text-gray-400 text-center py-4">Searching…</p>
          ) : !hasResults ? (
            <p className="text-xs text-gray-400 text-center py-4">No results for "{dq}"</p>
          ) : (
            <>
              {(products?.length ?? 0) > 0 && (
                <Section title="Products">
                  {(products ?? []).map((p) => (
                    <ResultRow
                      key={p.id}
                      label={p.name}
                      sub={`ID ${p.id}`}
                      onClick={() => go(`/products/${p.id}`)}
                    />
                  ))}
                </Section>
              )}
              {(orders?.length ?? 0) > 0 && (
                <Section title="Orders">
                  {(orders ?? []).map((o) => (
                    <ResultRow
                      key={o.id}
                      label={`Order #${o.id}`}
                      sub={o.status}
                      onClick={() => go(`/orders/${o.id}`)}
                    />
                  ))}
                </Section>
              )}
              {(customers?.length ?? 0) > 0 && (
                <Section title="Customers">
                  {(customers ?? []).map((c) => (
                    <ResultRow
                      key={c.id}
                      label={c.full_name}
                      sub={c.email}
                      onClick={() => go(`/customers/${c.id}`)}
                    />
                  ))}
                </Section>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
      {children}
    </div>
  )
}

function ResultRow({ label, sub, onClick }: { label: string; sub: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors"
    >
      <span className="text-sm text-gray-800 dark:text-gray-100 font-medium truncate">{label}</span>
      <span className="text-xs text-gray-400 ml-3 flex-shrink-0">{sub}</span>
    </button>
  )
}
