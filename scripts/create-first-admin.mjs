// One-off helper: creates the first admin user directly via the Supabase Auth
// Admin API. After this, all further team members should be created from
// /admin/team in the app itself (which uses the same admin API under the hood).
// Usage: node scripts/create-first-admin.mjs <email> <password> <full_name>

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local')
  const contents = readFileSync(envPath, 'utf8')
  for (const line of contents.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}

async function main() {
  loadEnvLocal()

  const [, , email, password, ...nameParts] = process.argv
  const fullName = nameParts.join(' ') || email

  if (!email || !password) {
    console.error('Usage: node scripts/create-first-admin.mjs <email> <password> [full name]')
    process.exit(1)
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: 'admin' },
  })

  if (error) {
    console.error('Failed to create admin user:', error.message)
    process.exit(1)
  }

  console.log(`Created admin user ${data.user.email} (id: ${data.user.id})`)
}

main()
