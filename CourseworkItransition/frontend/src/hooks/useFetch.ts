import { useCallback, useEffect, useRef, useState } from 'react'

export function useFetch<T>(
  fetchFn: () => Promise<T>,
  deps: unknown[],
  errorMessage = 'Failed to load'
): { data: T | null; loading: boolean; error: string | null; reload: () => void } {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const fnRef = useRef(fetchFn)
  fnRef.current = fetchFn
  const errRef = useRef(errorMessage)
  errRef.current = errorMessage

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fnRef.current()
      .then(result => { if (!cancelled) setData(result) })
      .catch(() => { if (!cancelled) setError(errRef.current) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  const reload = useCallback(() => setTick(t => t + 1), [])

  return { data, loading, error, reload }
}
