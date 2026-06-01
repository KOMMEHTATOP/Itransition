import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useSupport } from '../contexts/SupportContext'
import { supportApi } from '../api/supportApi'
import SupportTicketModal from './SupportTicketModal'

export default function HelpButton() {
  const { isAuthenticated } = useAuth()
  const { inventoryName } = useSupport()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  if (!isAuthenticated) return null

  return (
    <>
      <button
        type="button"
        className="btn btn-primary rounded-circle shadow"
        onClick={() => setOpen(true)}
        title={t('support.buttonLabel')}
        aria-label={t('support.buttonLabel')}
        style={{
          position: 'fixed',
          right: '1.25rem',
          bottom: '1.25rem',
          width: 56,
          height: 56,
          fontSize: '1.5rem',
          lineHeight: 1,
          zIndex: 1040,
        }}
      >
        ?
      </button>

      {open && (
        <SupportTicketModal
          onClose={() => setOpen(false)}
          onSubmit={async ({ summary, priority }) => {
            const res = await supportApi.create({
              summary,
              priority,
              link: window.location.href,
              inventory: inventoryName,
            })
            return res.data
          }}
        />
      )}
    </>
  )
}
