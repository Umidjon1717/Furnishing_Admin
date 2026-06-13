import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'

const STORAGE_KEY = 'last_seen_order_count'

export function useNewOrders() {
  const [hasNew, setHasNew] = useState(false)

  const { data: total } = useQuery({
    queryKey: ['poll-order-count'],
    queryFn: async () => {
      const res = await api.get('/api/order?page=1&limit=1')
      return (res.data?.data?.total ?? 0) as number
    },
    refetchInterval: 30_000,
  })

  useEffect(() => {
    if (total === undefined) return
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === null) {
      localStorage.setItem(STORAGE_KEY, String(total))
      return
    }
    setHasNew(total > Number(stored))
  }, [total])

  function markSeen() {
    if (total !== undefined) {
      localStorage.setItem(STORAGE_KEY, String(total))
      setHasNew(false)
    }
  }

  return { hasNew, markSeen }
}
