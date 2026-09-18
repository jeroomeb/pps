import { redirect } from 'next/navigation'
import Image from 'next/image'
import { ShieldCheck, LogOut } from 'lucide-react'
import { getProfile } from '@/lib/auth/dal'
import { ForcePasswordChangeForm } from '@/components/ForcePasswordChangeForm'
import { signOut } from '@/lib/actions/auth'

export default async function ForcePasswordChangePage() {
  const profile = await getProfile()

  // If the user's password reset is already completed, route them straight to their portal
  if (!profile.must_reset_password) {
    redirect(profile.role === 'admin' ? '/admin' : '/inspector')
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* Minimal Header */}
      <header className="flex h-16 items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-6">
        <div className="flex items-center gap-3">
          <Image
            src="/logo-sm.png"
            alt="Amenity Op's logo"
            width={32}
            height={32}
            className="rounded"
          />
          <span className="font-headline font-bold tracking-tight text-on-surface">
            Amenity Op&apos;s
          </span>
        </div>

        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </form>
      </header>

      {/* Main Container */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
              <ShieldCheck size={24} className="text-primary" />
            </div>
            <h1 className="font-headline text-2xl font-bold tracking-tight text-on-surface">
              Welcome to Amenity Op&apos;s
            </h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              First-time setup: please set your personal password before continuing.
            </p>
          </div>

          <ForcePasswordChangeForm userEmail={profile.email} />

          <p className="mt-6 text-center text-xs text-on-surface-variant">
            Need help? Contact your administrator or support at support@amenityops.com
          </p>
        </div>
      </main>
    </div>
  )
}
