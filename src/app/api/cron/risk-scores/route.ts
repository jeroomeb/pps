import { NextResponse } from 'next/server'
import { refreshDueRiskScores } from '@/lib/risk-score-job'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return request.headers.get('authorization') === `Bearer ${secret}`
}

async function run(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const result = await refreshDueRiskScores()
  return NextResponse.json({ ok: true, ...result })
}

export function GET(request: Request) {
  return run(request)
}

export function POST(request: Request) {
  return run(request)
}
