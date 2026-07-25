'use client'

import { useRef, useState, useTransition } from 'react'
import { Camera, ImageOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { saveInspectionItem } from '@/lib/actions/inspections'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'

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
  const showToast = useToast()
  const [status, setStatus] = useState(item.status)
  const [comment, setComment] = useState(item.comment ?? '')
  const [photoUrl, setPhotoUrl] = useState(item.photoUrl)
  const [photoSavedNoPreview, setPhotoSavedNoPreview] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  function persist(patch: { status?: ItemStatus | null; comment?: string; photo_path?: string | null }) {
    startTransition(async () => {
      let errorMessage: string | null = null
      try {
        const result = await saveInspectionItem(item.id, inspectionId, {
          status: patch.status ?? status,
          comment: patch.comment ?? comment,
          photo_path: patch.photo_path,
        })
        if (result?.error) errorMessage = result.error
      } catch {
        errorMessage = 'Could not save — check your connection and try again.'
      }

      if (errorMessage === null) {
        onSaved(item.id, patch)
        return
      }

      // Revert to the last successfully saved values (the parent only
      // updates `item` after a confirmed save) so the UI never shows an
      // unsaved answer as saved.
      setStatus(item.status)
      setComment(item.comment ?? '')
      if (patch.photo_path !== undefined) {
        setPhotoUrl(item.photoUrl)
        setPhotoSavedNoPreview(false)
      }
      showToast('error', errorMessage)
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
    setPhotoSavedNoPreview(false)
    const supabase = createClient()
    const ext = file.name.split('.').pop() || 'jpg'
    const objectPath = `${inspectionId}/${item.id}-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(objectPath, file, { upsert: true })

    if (uploadError) {
      showToast('error', `Photo upload failed: ${uploadError.message}`)
      setUploading(false)
      return
    }

    const { data: signed } = await supabase.storage
      .from('photos')
      .createSignedUrl(objectPath, 3600)

    if (signed?.signedUrl) {
      setPhotoUrl(signed.signedUrl)
    } else {
      setPhotoSavedNoPreview(true)
      showToast('info', 'Photo saved, but the preview could not load.')
    }
    setUploading(false)
    persist({ photo_path: objectPath })
  }

  const hasPhoto = Boolean(photoUrl || photoSavedNoPreview)
  // Photo is required for every answered item except N/A (client punch list #8).
  const needsPhoto = status !== null && status !== 'na' && !hasPhoto
  // A Fail must be explained with a comment.
  const needsComment = status === 'fail' && !comment.trim()

  return (
    <Card
      id={`checklist-item-${item.id}`}
      className={`scroll-mt-24 ${status === 'fail' ? 'border-error/50' : status === 'pass' ? 'border-success/40' : ''}`}
    >
      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="font-headline font-semibold">
            {index}. {item.item_name}
          </p>
          {item.description && (
            <p className="mt-1 text-sm text-on-surface-variant">{item.description}</p>
          )}
        </div>

        <div className="grid shrink-0 grid-cols-3 gap-2 lg:w-64">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={status === option.value}
              onClick={() => handleStatusChange(option.value)}
              className={`min-h-11 rounded-lg border-2 font-headline text-xs font-semibold uppercase tracking-wide transition ${
                status === option.value
                  ? option.value === 'pass'
                    ? 'border-success bg-success-container text-on-success-container'
                    : option.value === 'fail'
                      ? 'border-error bg-error-container text-on-error-container'
                      : 'border-na bg-na-container text-on-surface'
                  : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <label
        className={`mb-1 block text-xs font-semibold uppercase tracking-wide ${
          needsComment ? 'text-error' : 'text-on-surface-variant'
        }`}
      >
        {status === 'fail' ? 'Comments (Required for Fail)' : 'Comments (Optional)'}
      </label>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        onBlur={handleCommentBlur}
        rows={2}
        placeholder="Add specific notes here…"
        className={`mb-1 w-full rounded border px-3 py-2 text-sm focus:outline-none ${
          needsComment
            ? 'border-error focus:border-error'
            : 'border-outline-variant focus:border-primary-container'
        }`}
      />
      {needsComment && (
        <p className="mb-3 text-xs font-semibold text-error">
          A comment is required to explain a failure.
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoChange}
        className="hidden"
      />

      {photoUrl ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt={`Photo for ${item.item_name}`}
            loading="lazy"
            className="h-40 w-full rounded-lg object-cover"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-2 right-2 rounded-lg bg-surface-container-lowest/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide shadow"
          >
            {uploading ? 'Uploading…' : 'Replace Photo'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={`flex min-h-24 w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-sm font-semibold ${
            needsPhoto
              ? 'border-error text-error'
              : photoSavedNoPreview
                ? 'border-outline-variant text-on-surface-variant'
                : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          {photoSavedNoPreview ? <ImageOff size={20} /> : <Camera size={20} />}
          {uploading
            ? 'Uploading…'
            : photoSavedNoPreview
              ? 'Photo saved (preview unavailable) — Tap to replace'
              : 'Tap to Capture or Upload'}
        </button>
      )}
      {needsPhoto && (
        <p className="mt-1 text-xs font-semibold text-error">
          Photo documentation is required (mark N/A if it does not apply).
        </p>
      )}
    </Card>
  )
}
