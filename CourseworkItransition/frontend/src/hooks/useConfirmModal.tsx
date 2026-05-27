import { useState, useCallback } from 'react'
import ConfirmModal from '../components/ConfirmModal'

export interface ConfirmOptions {
  title?: string
  confirmLabel?: string
  variant?: 'danger' | 'warning'
}

interface ConfirmState extends ConfirmOptions {
  message: string
  resolve: (value: boolean) => void
}

export function useConfirmModal() {
  const [state, setState] = useState<ConfirmState | null>(null)

  const confirm = useCallback((message: string, options?: ConfirmOptions): Promise<boolean> =>
    new Promise(resolve => setState({ message, resolve, ...options }))
  , [])

  const handleConfirm = () => { state?.resolve(true); setState(null) }
  const handleClose   = () => { state?.resolve(false); setState(null) }

  const confirmModal = state ? (
    <ConfirmModal
      message={state.message}
      title={state.title}
      confirmLabel={state.confirmLabel}
      variant={state.variant}
      onConfirm={handleConfirm}
      onClose={handleClose}
    />
  ) : null

  return { confirm, confirmModal }
}
