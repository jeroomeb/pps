import { createClient } from '@/lib/supabase/server'
import { ResetPasswordForm } from '@/components/ResetPasswordForm'

export default async function ResetPasswordPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-headline text-2xl font-bold">Set a new password</h1>
        </div>

        {user ? (
          <ResetPasswordForm />
        ) : (
          <div className="rounded border border-outline-variant bg-surface-container-lowest p-6 text-center text-sm">
            <p>This reset link is invalid or has expired.</p>
            <a
              href="/forgot-password"
              className="mt-4 inline-block font-semibold text-primary hover:underline"
            >
              Request a new link
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
