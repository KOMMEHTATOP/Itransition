import { createContext, useContext, useState, type ReactNode } from 'react'

interface SupportContextValue {
  inventoryName: string | null
  setInventoryName: (name: string | null) => void
}

const SupportContext = createContext<SupportContextValue>({
  inventoryName: null,
  setInventoryName: () => {},
})

export function SupportProvider({ children }: { children: ReactNode }) {
  const [inventoryName, setInventoryName] = useState<string | null>(null)

  return (
    <SupportContext.Provider value={{ inventoryName, setInventoryName }}>
      {children}
    </SupportContext.Provider>
  )
}

export function useSupport() {
  return useContext(SupportContext)
}
