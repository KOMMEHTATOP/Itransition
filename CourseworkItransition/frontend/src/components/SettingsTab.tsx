import { useCallback, useEffect, useState } from 'react'
import MDEditor from '@uiw/react-md-editor'
import { useDropzone } from 'react-dropzone'
import Tags from '@yaireo/tagify/dist/react.tagify'
import '@yaireo/tagify/dist/tagify.css'
import { inventoriesApi } from '../api/inventoriesApi'
import { tagsApi } from '../api/tagsApi'
import { useAutosave } from '../hooks/useAutosave'
import type { Category, InventoryDetail, UpdateInventoryRequest } from '../types/inventory'

// ---------------------------------------------------------------------------
// Cloudinary config — set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET
// in .env.local (or in the production environment).
// ---------------------------------------------------------------------------
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined

async function uploadToCloudinary(file: File): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) throw new Error('Cloudinary is not configured.')
  const body = new FormData()
  body.append('file', file)
  body.append('upload_preset', UPLOAD_PRESET)
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body,
  })
  if (!res.ok) throw new Error('Cloudinary upload failed.')
  const data = await res.json()
  return data.secure_url as string
}

// ---------------------------------------------------------------------------

interface Props {
  inventory: InventoryDetail
  categories: Category[]
  onSaved: (updated: InventoryDetail) => void
}

export default function SettingsTab({ inventory, categories, onSaved }: Props) {
  const [title, setTitle]       = useState(inventory.title)
  const [description, setDesc]  = useState(inventory.description)
  const [isPublic, setIsPublic] = useState(inventory.isPublic)
  const [categoryId, setCat]    = useState<number | null>(inventory.categoryId)
  const [imageUrl, setImageUrl] = useState<string | null>(inventory.imageUrl)
  const [tags, setTags]         = useState<string[]>(inventory.tags)
  const [formVersion, setFormVersion] = useState(inventory.version)

  const [uploading, setUploading]   = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tagifyRef = { current: null as any }

  // Keep in sync if parent reloads inventory (e.g. after conflict resolution)
  useEffect(() => {
    setTitle(inventory.title)
    setDesc(inventory.description)
    setIsPublic(inventory.isPublic)
    setCat(inventory.categoryId)
    setImageUrl(inventory.imageUrl)
    setTags(inventory.tags)
    setFormVersion(inventory.version)
  }, [inventory.id]) // only reset when switching to a different inventory

  const editData: UpdateInventoryRequest = {
    title,
    description,
    isPublic,
    categoryId,
    version: formVersion,
    imageUrl,
    tags,
  }

  const saveFn = useCallback(
    async (data: UpdateInventoryRequest) => {
      const res = await inventoriesApi.update(inventory.id, data)
      setFormVersion(res.data.version)
      onSaved(res.data)
    },
    [inventory.id, onSaved],
  )

  const { saveStatus, saveNow } = useAutosave({
    data: editData,
    saveFn,
    delay: 8000,
    enabled: true,
  })

  // Tagify: load suggestions when input changes
  const tagifyRef = useRef<{ getCleanValue: () => Array<{ value: string }> } | null>(null)
  const loadSuggestions = useCallback(async (e: CustomEvent) => {
    const q: string = (e.detail as { value: string }).value ?? ''
    if (q.trim().length < 1) return
    try {
      const res = await tagsApi.search(q)
      setTagSuggestions(res.data)
    } catch { /* ignore */ }
  }, [])

  // Image dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    disabled: !CLOUD_NAME || !UPLOAD_PRESET,
    onDrop: async (files) => {
      if (!files[0]) return
      setUploading(true)
      setUploadError(null)
      try {
        const url = await uploadToCloudinary(files[0])
        setImageUrl(url)
      } catch {
        setUploadError('Upload failed. Check Cloudinary configuration.')
      } finally {
        setUploading(false)
      }
    },
  })

  const saveLabel = () => {
    switch (saveStatus) {
      case 'saving':   return { text: '⏳ Saving…',             cls: 'text-muted' }
      case 'saved':    return { text: '✓ Saved',                cls: 'text-success' }
      case 'conflict': return { text: '⚠ Conflict — reload',   cls: 'text-danger' }
      case 'error':    return { text: '✗ Save failed',          cls: 'text-danger' }
      default:         return null
    }
  }
  const sl = saveLabel()

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Save status + button */}
      <div className="d-flex align-items-center gap-2 mb-3">
        {sl && <small className={sl.cls}>{sl.text}</small>}
        <button className="btn btn-outline-primary btn-sm ms-auto" onClick={saveNow}>
          Save now
        </button>
      </div>

      {saveStatus === 'conflict' && (
        <div className="alert alert-warning py-2">
          Save conflict: someone else modified this inventory. Reload the page to get the latest version.
        </div>
      )}

      {/* Title */}
      <div className="mb-3">
        <label className="form-label fw-semibold">Title</label>
        <input
          type="text"
          className="form-control"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>

      {/* Description — Markdown editor */}
      <div className="mb-3">
        <label className="form-label fw-semibold">Description</label>
        <div data-color-mode="light">
          <MDEditor
            value={description}
            onChange={v => setDesc(v ?? '')}
            height={220}
            preview="edit"
          />
        </div>
      </div>

      {/* Category */}
      <div className="mb-3">
        <label className="form-label fw-semibold">Category</label>
        <select
          className="form-select"
          value={categoryId ?? ''}
          onChange={e => setCat(e.target.value === '' ? null : Number(e.target.value))}
        >
          <option value="">— None —</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Public toggle */}
      <div className="form-check mb-3">
        <input
          type="checkbox"
          className="form-check-input"
          id="isPublic"
          checked={isPublic}
          onChange={e => setIsPublic(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="isPublic">
          Public inventory (any authenticated user can add items)
        </label>
      </div>

      {/* Image */}
      <div className="mb-3">
        <label className="form-label fw-semibold">Cover image</label>
        {!CLOUD_NAME || !UPLOAD_PRESET ? (
          <div className="alert alert-warning py-2 small">
            Cloudinary is not configured. Set <code>VITE_CLOUDINARY_CLOUD_NAME</code> and{' '}
            <code>VITE_CLOUDINARY_UPLOAD_PRESET</code> in <code>.env.local</code>.
          </div>
        ) : (
          <>
            <div
              {...getRootProps()}
              className={`border rounded p-3 text-center mb-2 ${isDragActive ? 'border-primary bg-light' : 'border-secondary'}`}
              style={{ cursor: 'pointer', minHeight: 80 }}
            >
              <input {...getInputProps()} />
              {uploading
                ? <span className="text-muted small">Uploading…</span>
                : isDragActive
                  ? <span className="text-primary small">Drop image here</span>
                  : <span className="text-muted small">Drag & drop an image, or click to select</span>
              }
            </div>
            {uploadError && <div className="text-danger small mb-2">{uploadError}</div>}
            {imageUrl && (
              <div className="d-flex align-items-start gap-2">
                <img src={imageUrl} alt="cover" style={{ maxHeight: 120, maxWidth: 200, objectFit: 'cover', borderRadius: 4 }} />
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => setImageUrl(null)}
                >
                  Remove
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Tags */}
      <div className="mb-3">
        <label className="form-label fw-semibold">Tags</label>
        <Tags
          tagifyRef={tagifyRef}
          value={tags.join(',')}
          settings={{
            whitelist: tagSuggestions,
            dropdown: { enabled: 1, maxItems: 10 },
          }}
          onInput={loadSuggestions as unknown as (e: CustomEvent) => void}
          onChange={(e: CustomEvent) => {
            const detail = e.detail as { tagify: { getCleanValue: () => Array<{ value: string }> } }
            setTags(detail.tagify.getCleanValue().map((t) => t.value))
          }}
          className="form-control"
        />
        <div className="form-text">Press Enter or comma to add a tag.</div>
      </div>
    </div>
  )
}
