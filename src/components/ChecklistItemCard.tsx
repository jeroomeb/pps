'use client'

import { useRef, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { saveInspectionItem } from '@/lib/actions/inspections'

type ItemStatus = 'pass' | 'fail' | 'na'

export type ChecklistItemData = {
  id: string
  item_name: string
  description: string | null
  status: ItemStatus | null
  comment: string | null
  photo_path: string | null
  photoUrl: string | null
}

const STATUS_OPTIONS: { value: ItemStatus; label: string }[] = [
  { value: 'pass', label: 'Pass' },
  { value: 'fail', label: 'Fail' },
  { value: 'na', label: 'N/A' },
]

export function ChecklistItemCard({
  item,
  index,
  inspectionId,
  onSaved,
}: {
  item: ChecklistItemData
  index: number
  inspectionId: string
  onSaved: (itemId: string, patch: Partial<ChecklistItemData>) => void
}) {
  const [status, setStatus] = useState(item.status)
  const [comment, setComment] = useState(item.comment ?? '')
  const [photoUrl, setPhotoUrl] = useState(item.photoUrl)
  const [uploading, setUploading] = useState(false)
  const [, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  function persist(patch: { status?: ItemStatus | null; comment?: string; photo_path?: string | null }) {
    startTransition(async () => {
      await saveInspectionItem(item.id, inspectionId, {
        status: patch.status ?? status,
        comment: patch.comment ?? comment,
        photo_path: patch.photo_path,
      })
      onSaved(item.id, patch)
    })
  }

  function handleStatusChange(next: ItemStatus) {
    setStatus(next)
    persist({ status: next })
  }

  function handleCommentBlur() {
    persist({ comment })
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop() || 'jpg'
    const objectPath = `${inspectionId}/${item.id}-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(objectPath, file, { upsert: true })

    if (uploadError) {
      alert(`Photo upload failed: ${uploadError.message}`)
      setUploading(false)
      return
    }

    const { data: signed } = await supabase.storage
      .from('photos')
      .createSignedUrl(objectPath, 3600)

    setPhotoUrl(signed?.signedUrl ?? null)
    setUploading(false)
    persist({ photo_path: objectPath })
  }

  const needsPhoto = status === 'fail' && !photoUrl

  return (
    <div className="rounded border border-outline-variant bg-surface-container-lowest p-4">
      <p className="mb-1 font-headline font-semibold">
        {index}. {item.item_name}
      </p>
      {item.description && (
        <p className="mb-3 text-sm text-on-surface-variant">{item.description}</p>
      )}

      <div className="mb-3 grid grid-cols-3 gap-2">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleStatusChange(option.value)}
            className={`min-h-12 rounded border-2 font-headline text-sm font-semibold uppercase tracking-wide ${
              status === option.value
                ? option.value === 'pass'
                  ? 'border-success bg-success-container text-on-success-container'
                  : option.value === 'fail'
                    ? 'border-error bg-error-container text-on-error-container'
                    : 'border-na bg-na-container text-on-surface'
                : 'border-outline-variant text-on-surface-variant'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
        Comments (Optional)
      </label>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        onBlur={handleCommentBlur}
        rows={2}
        placeholder="Add specific notes here…"
        className="mb-3 w-full rounded border border-outline-variant px-3 py-2 text-sm focus:border-primary-container focus:outline-none"
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className={`min-h-12 w-full rounded border-2 font-headline text-sm font-semibold uppercase tracking-wide ${
          needsPhoto ? 'border-error text-error' : 'border-on-surface text-on-surface'
        }`}
      >
        {uploading ? 'Uploading…' : photoUrl ? 'Replace Photo' : 'Capture Photo'}
      </button>
      {needsPhoto && (
        <p className="mt-1 text-xs font-semibold text-error">A photo is required for Fail items.</p>
      )}
      {photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" className="mt-3 h-32 w-full rounded object-cover" />
      )}
    </div>
  )
}
