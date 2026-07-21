'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ZoomIn } from 'lucide-react'

/**
 * A photo thumbnail that opens a full-screen, zoomable overlay when clicked.
 * Used on the report view and the inspector's read-only completed view so
 * evidence photos can be inspected up close. Closes on backdrop click, the
 * close button, or Escape.
 */
export function ZoomableImage({
  src,
  alt,
  thumbClassName,
}: {
  src: string
  alt: string
  thumbClassName?: string
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    // Prevent the page behind the overlay from scrolling.
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Enlarge photo: ${alt}`}
        className={`group relative block cursor-zoom-in overflow-hidden rounded ${thumbClassName ?? ''}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
        <span className="absolute bottom-1.5 right-1.5 flex items-center justify-center rounded-full bg-black/55 p-1.5 text-white opacity-90 transition group-hover:bg-black/75">
          <ZoomIn size={14} />
        </span>
      </button>

      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={alt}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close photo"
              className="absolute right-4 top-4 flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X size={22} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] max-w-[95vw] rounded-lg object-contain shadow-2xl"
            />
          </div>,
          document.body
        )}
    </>
  )
}
