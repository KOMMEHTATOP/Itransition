import { useState } from 'react'

export function useSelection(ids: string[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggleOne = (id: string, checked: boolean) => {
    setSelected(prev => {
      const next = new Set(prev)
      checked ? next.add(id) : next.delete(id)
      return next
    })
  }

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(ids) : new Set())
  }

  const clearSelection = () => setSelected(new Set())

  return { selected, toggleOne, toggleAll, clearSelection }
}
