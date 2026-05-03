import { useCallback, useEffect, useRef, useState } from 'react'
import MDEditor from '@uiw/react-md-editor'
import { useDropzone } from 'react-dropzone'
import Tags from '@yaireo/tagify/dist/react.tagify'
import '@yaireo/tagify/dist/tagify.css'
import { useTranslation } from 'react-i18next'
import { inventoriesApi } from '../api/inventoriesApi'
import { tagsApi } from '../api/tagsApi'
import { useAutosave } from '../hooks/useAutosave'
import type { Category, InventoryDetail, UpdateInventoryRequest } from '../types/inventory'

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

interface Props {
  inventory: InventoryDetail
  categories: Category[]
  onSaved: (updated: InventoryDetail) => void
}

export default function SettingsTab({ inventory, categories, onSaved }: Props) {
  const { t } = useTranslation()
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

  useEffect(() => {
    setTitle(inventory.title)
    setDesc(inventory.description)
    setIsPublic(inventory.isPublic)
    setCat(inventory.categoryId)
    setImageUrl(inventory.imageUrl)
    setTags(inventory.tags)
    setFormVersion(inventory.version)
  }, [inventory.id])

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

  const tagifyRef = useRef<{ getCleanValue: () => Array<{ value: string }> } | null>(null)
  const loadSuggestions = useCallback(async (e: CustomEvent) => {
    const q: string = (e.detail as { value: string }).value ?? ''
    if (q.trim().length < 1) return
    try {
      const res = await tagsApi.search(q)
      setTagSuggestions(res.data)
    } catch { /* ignore */ }
  }, [])

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
        setUploadError(t('settingsTab.uploadFailed'))
      } finally {
        setUploading(false)
      }
    },
  })

  const saveLabel = () => {
    switch (saveStatus) {
      case 'saving':   return { text: t('settingsTab.saving'),   cls: 'text-muted' }
      case 'saved':    return { text: t('settingsTab.saved'),    cls: 'text-success' }
      case 'conflict': return { text: t('settingsTab.conflict'), cls: 'text-danger' }
      case 'error':    return { text: t('settingsTab.error'),    cls: 'text-danger' }
      default:         return null
    }
  }
  const sl = saveLabel()

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="d-flex align-items-center gap-2 mb-3">
        {sl && <small className={sl.cls}>{sl.text}</small>}
        <button className="btn btn-outline-primary btn-sm ms-auto" onClick={saveNow}>
          {t('settingsTab.saveNow')}
        </button>
      </div>

      {saveStatus === 'conflict' && (
        <div className="alert alert-warning py-2">
          {t('settingsTab.saveConflict')}
        </div>
      )}

      <div className="mb-3">
        <label className="form-label fw-semibold">{t('settingsTab.titleLabel')}</label>
        <input
          type="text"
          className="form-control"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="form-label fw-semibold">{t('settingsTab.descriptionLabel')}</label>
        <div data-color-mode="light">
          <MDEditor
            value={description}
            onChange={v => setDesc(v ?? '')}
            height={220}
            preview="edit"
          />
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label fw-semibold">{t('settingsTab.categoryLabel')}</label>
        <select
          className="form-select"
          value={categoryId ?? ''}
          onChange={e => setCat(e.target.value === '' ? null : Number(e.target.value))}
        >
          <option value="">{t('settingsTab.noneCategory')}</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="form-check mb-3">
        <input
          type="checkbox"
          className="form-check-input"
          id="isPublic"
          checked={isPublic}
          onChange={e => setIsPublic(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="isPublic">
          {t('settingsTab.publicLabel')}
        </label>
      </div>

      <div className="mb-3">
        <label className="form-label fw-semibold">{t('settingsTab.coverLabel')}</label>
        {!CLOUD_NAME || !UPLOAD_PRESET ? (
          <div className="alert alert-warning py-2 small">
            {t('settingsTab.cloudinaryWarning')}
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
                ? <span className="text-muted small">{t('settingsTab.uploading')}</span>
                : isDragActive
                  ? <span className="text-primary small">{t('settingsTab.dropHere')}</span>
                  : <span className="text-muted small">{t('settingsTab.dragDrop')}</span>
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
                  {t('settingsTab.remove')}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mb-3">
        <label className="form-label fw-semibold">{t('settingsTab.tagsLabel')}</label>
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
            setTags(detail.tagify.getCleanValue().map((tag) => tag.value))
          }}
          className="form-control"
        />
        <div className="form-text">{t('settingsTab.tagsHelp')}</div>
      </div>
    </div>
  )
}
