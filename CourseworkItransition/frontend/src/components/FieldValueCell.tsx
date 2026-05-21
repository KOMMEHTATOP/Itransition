import { useTranslation } from 'react-i18next'
import type { InventoryField, ItemListItem } from '../types/inventory'

interface Props {
  item: ItemListItem
  field: InventoryField
}

export default function FieldValueCell({ item, field }: Props) {
  const { t } = useTranslation()
  const fv = item.fieldValues.find(v => v.fieldId === field.id)

  if (field.type === 'Boolean') return fv?.value === 'true'
    ? <span className="badge bg-success">{t('itemsTab.boolYes')}</span>
    : <span className="badge bg-secondary">{t('itemsTab.boolNo')}</span>

  if (!fv || fv.value === '') return <span className="text-muted">—</span>

  if (field.type === 'Link') {
    return (
      <a href={fv.value} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
        {fv.value.length > 30 ? fv.value.slice(0, 30) + '…' : fv.value}
      </a>
    )
  }

  return <>{fv.value.length > 50 ? fv.value.slice(0, 50) + '…' : fv.value}</>
}
