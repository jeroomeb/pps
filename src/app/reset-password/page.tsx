import { createClient } from '@/lib/supabase/server'
import { ResetPasswordForm } from '@/components/ResetPasswordForm'
import { ResetPasswordFallback } from '@/components/ResetPasswordFallback'
import { isRecoverySession } from '@/lib/auth/session'

export default async function ResetPasswordPage() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user ?? null

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-headline text-2xl font-bold">Set a new password</h1>
        </div>

        {user ? (
          <ResetPasswordForm
            requireCurrentPassword={!isRecoverySession(session!.access_token)}
          />
        ) : (
          <ResetPasswordFallback />
        )}
      </div>
    </div>
  )
}
