import { useCallback, useEffect, useRef, useState } from 'react'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'conflict' | 'error'

interface UseAutosaveOptions<T> {
  data: T
  saveFn: (data: T) => Promise<void>
  delay?: number  // ms, default 8000
  enabled?: boolean
}

export function useAutosave<T>({
  data,
  saveFn,
  delay = 8000,
  enabled = true,
}: UseAutosaveOptions<T>) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dirtyRef   = useRef(false)
  const savingRef  = useRef(false)
  const latestData = useRef<T>(data)

  latestData.current = data

  // Called when data changes — mark dirty, (re)start timer
  useEffect(() => {
    if (!enabled) return
    dirtyRef.current = true
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      if (!dirtyRef.current || savingRef.current) return
      savingRef.current = true
      dirtyRef.current  = false
      setSaveStatus('saving')
      try {
        await saveFn(latestData.current)
        setSaveStatus('saved')
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status
        setSaveStatus(status === 409 ? 'conflict' : 'error')
      } finally {
        savingRef.current = false
      }
    }, delay)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, delay, enabled])

  const saveNow = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (savingRef.current) return
    savingRef.current = true
    dirtyRef.current  = false
    setSaveStatus('saving')
    try {
      await saveFn(latestData.current)
      setSaveStatus('saved')
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      setSaveStatus(status === 409 ? 'conflict' : 'error')
    } finally {
      savingRef.current = false
    }
  }, [saveFn])

  return { saveStatus, saveNow }
}
