import { useState } from 'react'
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
import { fieldsApi } from '../api/fieldsApi'
import type { InventoryField, FieldType, CreateFieldRequest, UpdateFieldRequest } from '../types/inventory'

const FIELD_TYPES: FieldType[] = ['Text', 'MultilineText', 'Number', 'Link', 'Boolean']

interface Props {
  inventoryId: string
  fields: InventoryField[]
  onChange: (fields: InventoryField[]) => void
}

interface SortableRowProps {
  field: InventoryField
  onSave: (field: InventoryField, data: UpdateFieldRequest) => void
  onDelete: (id: string) => void
}

function SortableRow({ field, onSave, onDelete }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  const [editing, setEditing]           = useState(false)
  const [title, setTitle]               = useState(field.title)
  const [description, setDescription]   = useState(field.description)
  const [showInTable, setShowInTable]   = useState(field.showInTable)

  const handleSave = () => {
    onSave(field, { title, description, showInTable, order: field.order })
    setEditing(false)
  }

  const handleCancel = () => {
    setTitle(field.title)
    setDescription(field.description)
    setShowInTable(field.showInTable)
    setEditing(false)
  }

  return (
    <div ref={setNodeRef} style={style} className="card mb-2">
      <div className="card-body py-2 px-3">
        {editing ? (
          <div>
            <div className="d-flex gap-2 mb-2">
              <input
                className="form-control form-control-sm"
                placeholder="Title"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
              <span className="badge bg-secondary align-self-center">{field.type}</span>
            </div>
            <input
              className="form-control form-control-sm mb-2"
              placeholder="Description (optional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            <div className="form-check form-check-inline mb-2">
              <input
                type="checkbox"
                className="form-check-input"
                id={`sit-${field.id}`}
                checked={showInTable}
                onChange={e => setShowInTable(e.target.checked)}
              />
              <label className="form-check-label small" htmlFor={`sit-${field.id}`}>Show in table</label>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-primary btn-sm" onClick={handleSave}>Save</button>
              <button className="btn btn-outline-secondary btn-sm" onClick={handleCancel}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="d-flex align-items-center gap-2">
            <span
              {...attributes}
              {...listeners}
              className="text-muted"
              style={{ cursor: 'grab', fontSize: '1.2rem', lineHeight: 1 }}
              title="Drag to reorder"
            >
              ⠿
            </span>
            <div className="flex-grow-1">
              <span className="fw-semibold">{field.title}</span>
              {field.description && (
                <span className="text-muted small ms-2">{field.description}</span>
              )}
            </div>
            <span className="badge bg-secondary">{field.type}</span>
            {field.showInTable && (
              <span className="badge bg-info text-dark">table</span>
            )}
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setEditing(true)}
            >
              Edit
            </button>
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={() => onDelete(field.id)}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function FieldsTab({ inventoryId, fields, onChange }: Props) {
  const [error, setError]       = useState<string | null>(null)
  const [adding, setAdding]     = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc]   = useState('')
  const [newType, setNewType]   = useState<FieldType>('Text')
  const [newShow, setNewShow]   = useState(true)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = fields.findIndex(f => f.id === active.id)
    const newIndex = fields.findIndex(f => f.id === over.id)
    const reordered = arrayMove(fields, oldIndex, newIndex).map((f, i) => ({ ...f, order: i }))
    onChange(reordered)

    try {
      await fieldsApi.reorder(inventoryId, reordered.map(f => f.id))
    } catch {
      setError('Failed to save order.')
    }
  }

  const handleAdd = async () => {
    if (!newTitle.trim()) return
    setError(null)
    try {
      const data: CreateFieldRequest = {
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        type: newType,
        showInTable: newShow,
      }
      const res = await fieldsApi.create(inventoryId, data)
      if (res.status === 400) {
        const body = res.data as unknown as { message?: string }
        setError(body.message ?? 'Maximum 3 fields of this type allowed.')
        return
      }
      onChange([...fields, res.data])
      setAdding(false)
      setNewTitle('')
      setNewDesc('')
      setNewType('Text')
      setNewShow(true)
    } catch {
      setError('Failed to add field.')
    }
  }

  const handleSave = async (field: InventoryField, data: UpdateFieldRequest) => {
    setError(null)
    try {
      const res = await fieldsApi.update(inventoryId, field.id, data)
      onChange(fields.map(f => (f.id === field.id ? res.data : f)))
    } catch {
      setError('Failed to save field.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this field? All item values for this field will be lost.')) return
    setError(null)
    try {
      await fieldsApi.delete(inventoryId, id)
      onChange(fields.filter(f => f.id !== id))
    } catch {
      setError('Failed to delete field.')
    }
  }

  return (
    <div>
      <div className="d-flex align-items-center mb-3 gap-2">
        <h5 className="mb-0 me-auto">Custom Fields</h5>
        <small className="text-muted">Max 3 per type · drag to reorder</small>
        <button
          className="btn btn-outline-primary btn-sm"
          onClick={() => setAdding(true)}
          disabled={adding}
        >
          + Add field
        </button>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      {adding && (
        <div className="card mb-3 border-primary">
          <div className="card-body py-2 px-3">
            <div className="row g-2 mb-2">
              <div className="col-md-5">
                <input
                  className="form-control form-control-sm"
                  placeholder="Field title *"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="col-md-3">
                <select
                  className="form-select form-select-sm"
                  value={newType}
                  onChange={e => setNewType(e.target.value as FieldType)}
                >
                  {FIELD_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <input
                  className="form-control form-control-sm"
                  placeholder="Description (optional)"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                />
              </div>
            </div>
            <div className="d-flex align-items-center gap-3">
              <div className="form-check mb-0">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="newFieldShow"
                  checked={newShow}
                  onChange={e => setNewShow(e.target.checked)}
                />
                <label className="form-check-label small" htmlFor="newFieldShow">Show in table</label>
              </div>
              <button className="btn btn-primary btn-sm" onClick={handleAdd}>Add</button>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => { setAdding(false); setNewTitle(''); setNewDesc(''); }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {fields.length === 0 && !adding ? (
        <p className="text-muted">No fields yet. Add a field to start collecting structured data.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
            {fields.map(field => (
              <SortableRow
                key={field.id}
                field={field}
                onSave={handleSave}
                onDelete={handleDelete}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
