import Image from 'next/image'
import { signOut } from '@/lib/actions/auth'

export function Header({
  title,
  fullName,
}: {
  title: string
  fullName: string
}) {
  return (
    <header className="flex items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-4 py-3 lg:hidden">
      <div className="flex items-center gap-3">
        <Image src="/logo-sm.png" alt="" width={32} height={32} className="rounded" />
        <div>
          <p className="font-headline text-lg font-bold leading-tight">{title}</p>
          <p className="text-xs text-on-surface-variant">{fullName}</p>
        </div>
      </div>
      <form action={signOut}>
        <button
          type="submit"
          className="rounded border border-outline-variant px-3 py-2 text-xs font-semibold uppercase tracking-wide hover:bg-surface-container"
        >
          Sign Out
        </button>
      </form>
    </header>
  )
}
