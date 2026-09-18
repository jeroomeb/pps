import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/dal'

export default async function HomePage() {
  const profile = await getProfile()
  if (profile.must_reset_password) {
    redirect('/force-password-change')
  }
  redirect(profile.role === 'admin' ? '/admin' : '/inspector')
}
