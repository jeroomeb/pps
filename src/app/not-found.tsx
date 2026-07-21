import Link from 'next/link'
import { SearchX } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <SearchX size={32} className="text-on-surface-variant" />
      <div>
        <h1 className="font-headline text-xl font-bold">Page not found</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          This page doesn’t exist or may have been deleted.
        </p>
      </div>
      <Link
        href="/"
        className="flex min-h-11 items-center rounded-lg bg-primary-container px-5 font-headline text-sm font-semibold uppercase tracking-wide text-on-primary-container hover:brightness-95"
      >
        Back to Dashboard
      </Link>
    </div>
  )
}
