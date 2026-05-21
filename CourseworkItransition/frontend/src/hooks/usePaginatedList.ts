import { useEffect, useRef, useState } from 'react'

interface PagedResult<T> {
  items: T[]
  total: number
  totalPages: number
}

export function usePaginatedList<T>(
  fetchFn: (page: number, sort: string) => Promise<PagedResult<T>>,
  deps: unknown[],
  options: { initialSort?: string; errorMessage?: string } = {}
) {
  const { initialSort = 'newest', errorMessage = 'Failed to load' } = options

  const fnRef = useRef(fetchFn)
  fnRef.current = fetchFn
  const errRef = useRef(errorMessage)
  errRef.current = errorMessage

  const [items, setItems] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [sort, setSortInternal] = useState(initialSort)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const setSort = (newSort: string) => {
    setSortInternal(newSort)
    setPage(1)
  }

  const reload = () => setTick(t => t + 1)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fnRef.current(page, sort)
      .then(result => {
        if (!cancelled) {
          setItems(result.items)
          setTotal(result.total)
          setTotalPages(result.totalPages)
        }
      })
      .catch(() => { if (!cancelled) setError(errRef.current) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sort, tick, ...deps])

  return { items, total, totalPages, page, setPage, sort, setSort, loading, error, reload }
}
