import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Popover } from 'bootstrap'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { customIdApi } from '../api/customIdApi'
import type { CustomIdElement, CustomIdElementType } from '../types/inventory'

const ELEMENT_TYPES: CustomIdElementType[] = [
  'Fixed', 'Random20bit', 'Random32bit', 'Random6digit', 'Random9digit', 'GUID', 'DateTime', 'Sequence',
]

const DEFAULT_FORMAT: Record<CustomIdElementType, string> = {
  Fixed:       '',
  Random20bit:  'X5',
  Random32bit:  'X8',
  Random6digit: '',
  Random9digit: '',
  GUID:         '',
  DateTime:     'yyyyMMdd',
  Sequence:     'D3',
}

const NO_FORMAT_TYPES: CustomIdElementType[] = ['Random6digit', 'Random9digit', 'GUID']

function fmtNum(n: number, fmt: string): string {
  const m = fmt.match(/^([XxDd])(\d+)$/)
  if (!m) return n.toString()
  const width = parseInt(m[2])
  if (m[1] === 'X' || m[1] === 'x') return n.toString(16).toUpperCase().padStart(width, '0')
  return n.toString().padStart(width, '0')
}

function fmtDate(d: Date, fmt: string): string {
  return fmt
    .replace('yyyy', d.getUTCFullYear().toString())
    .replace('MM', String(d.getUTCMonth() + 1).padStart(2, '0'))
    .replace('dd', String(d.getUTCDate()).padStart(2, '0'))
    .replace('HH', String(d.getUTCHours()).padStart(2, '0'))
    .replace('mm', String(d.getUTCMinutes()).padStart(2, '0'))
}

function generatePreview(elements: CustomIdElement[]): string {
  return [...elements]
    .sort((a, b) => a.order - b.order)
    .map(el => {
      const fmt = el.formatString
      switch (el.type) {
        case 'Fixed':       return fmt || '(text)'
        case 'Random20bit':  return fmtNum(Math.floor(Math.random() * 1_048_576), fmt || 'X5')
        case 'Random32bit':  return fmtNum(Math.floor(Math.random() * 2_147_483_647), fmt || 'X8')
        case 'Random6digit': return '123456'
        case 'Random9digit': return '123456789'
        case 'GUID':         return '550e8400-e29b'
        case 'DateTime':     return fmtDate(new Date(), fmt || 'yyyyMMdd')
        case 'Sequence':     return fmtNum(1, fmt || 'D3')
        default:             return ''
      }
    })
    .join('')
}

function HelpPopover({ content }: { content: string }) {
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const pop = new Popover(ref.current, { content, trigger: 'click', placement: 'right' })
    return () => pop.dispose()
  }, [content])
  return (
    <button type="button" className="btn btn-link btn-sm p-0 text-muted" ref={ref}>
      ?
    </button>
  )
}

interface RowProps {
  el: CustomIdElement
  helpText: string
  onUpdate: (id: string, type: CustomIdElementType, formatString: string) => void
  onDelete: (id: string) => void
}

function SortableRow({ el, helpText, onUpdate, onDelete }: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: el.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const { t } = useTranslation()

  const [fmt, setFmt] = useState(el.formatString)
  useEffect(() => setFmt(el.formatString), [el.formatString])

  const showFormat = !NO_FORMAT_TYPES.includes(el.type)

  return (
    <div ref={setNodeRef} style={style} className="card mb-2">
      <div className="card-body py-2 px-3">
        <div className="d-flex align-items-center gap-2">
          <span
            {...attributes}
            {...listeners}
            className="text-muted"
            style={{ cursor: 'grab', fontSize: '1.2rem', lineHeight: 1 }}
            title={t('customIdTab.dragToReorder')}
          >
            ⠿
          </span>
          <select
            className="form-select form-select-sm"
            style={{ width: 150 }}
            value={el.type}
            onChange={e => {
              const type = e.target.value as CustomIdElementType
              onUpdate(el.id, type, DEFAULT_FORMAT[type])
            }}
          >
            {ELEMENT_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          {showFormat ? (
            <input
              className="form-control form-control-sm"
              style={{ width: 110 }}
              placeholder={DEFAULT_FORMAT[el.type] || 'format'}
              value={fmt}
              onChange={e => setFmt(e.target.value)}
              onBlur={() => {
                if (fmt !== el.formatString) onUpdate(el.id, el.type, fmt)
              }}
            />
          ) : (
            <span className="text-muted small" style={{ width: 110 }}>—</span>
          )}
          <HelpPopover content={helpText} />
          <button
            type="button"
            className="btn btn-outline-danger btn-sm ms-auto"
            onClick={() => onDelete(el.id)}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

interface Props {
  inventoryId: string
  elements: CustomIdElement[]
  onChange: (elements: CustomIdElement[]) => void
}

export default function CustomIdTab({ inventoryId, elements, onChange }: Props) {
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState(() => generatePreview(elements))

  const helpTexts: Record<CustomIdElementType, string> = {
    Fixed:       t('customIdTab.helpFixed'),
    Random20bit:  t('customIdTab.helpRandom20bit'),
    Random32bit:  t('customIdTab.helpRandom32bit'),
    Random6digit: t('customIdTab.helpRandom6digit'),
    Random9digit: t('customIdTab.helpRandom9digit'),
    GUID:         t('customIdTab.helpGUID'),
    DateTime:     t('customIdTab.helpDateTime'),
    Sequence:     t('customIdTab.helpSequence'),
  }

  useEffect(() => {
    setPreview(generatePreview(elements))
  }, [elements])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = elements.findIndex(e => e.id === active.id)
    const newIdx = elements.findIndex(e => e.id === over.id)
    const reordered = arrayMove(elements, oldIdx, newIdx).map((e, i) => ({ ...e, order: i }))
    onChange(reordered)
    try {
      await customIdApi.reorder(inventoryId, reordered.map(e => e.id))
    } catch {
      setError(t('customIdTab.failedToReorder'))
    }
  }

  const handleAdd = async () => {
    setError(null)
    const defaultType: CustomIdElementType = 'Fixed'
    const res = await customIdApi.add(inventoryId, {
      type: defaultType,
      formatString: DEFAULT_FORMAT[defaultType],
    })
    if (res.status === 400) {
      const body = res.data as unknown as { message?: string }
      setError(body.message ?? t('customIdTab.failedToAdd'))
      return
    }
    onChange([...elements, res.data])
  }

  const handleUpdate = async (id: string, type: CustomIdElementType, formatString: string) => {
    setError(null)
    const el = elements.find(e => e.id === id)
    if (!el) return
    try {
      const res = await customIdApi.update(inventoryId, id, {
        type,
        formatString,
        order: el.order,
      })
      onChange(elements.map(e => (e.id === id ? res.data : e)))
    } catch {
      setError(t('customIdTab.failedToUpdate'))
    }
  }

  const handleDelete = async (id: string) => {
    setError(null)
    try {
      await customIdApi.delete(inventoryId, id)
      onChange(elements.filter(e => e.id !== id))
    } catch {
      setError(t('customIdTab.failedToDelete'))
    }
  }

  return (
    <div>
      <div className="d-flex align-items-center mb-3 gap-2">
        <h5 className="mb-0 me-auto">{t('customIdTab.title')}</h5>
        <small className="text-muted">{t('customIdTab.hint')}</small>
        <button
          className="btn btn-outline-primary btn-sm"
          onClick={handleAdd}
          disabled={elements.length >= 10}
        >
          {t('customIdTab.addElement')}
        </button>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      {elements.length > 0 && (
        <div className="alert alert-secondary py-2 mb-3 d-flex align-items-center gap-2">
          <span className="text-muted small">{t('customIdTab.preview')}</span>
          <code className="fw-semibold">{preview}</code>
          <button
            type="button"
            className="btn btn-link btn-sm p-0 ms-1 text-muted"
            onClick={() => setPreview(generatePreview(elements))}
            title="↺"
          >
            ↺
          </button>
        </div>
      )}

      {elements.length === 0 ? (
        <p className="text-muted">{t('customIdTab.noElements')}</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={elements.map(e => e.id)} strategy={verticalListSortingStrategy}>
            {[...elements]
              .sort((a, b) => a.order - b.order)
              .map(el => (
                <SortableRow
                  key={el.id}
                  el={el}
                  helpText={helpTexts[el.type]}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))}
          </SortableContext>
        </DndContext>
      )}

      <p className="text-muted small mt-3">{t('customIdTab.helpText')}</p>
    </div>
  )
}
