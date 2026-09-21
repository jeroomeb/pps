import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/dal'
import { generateSpecialistRagResponse } from '@/lib/rag-assistant'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const profile = await getProfile()
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const query = typeof body.query === 'string' ? body.query : ''
    const history = Array.isArray(body.history) ? body.history : []

    const result = await generateSpecialistRagResponse(query, history)

    return NextResponse.json({
      success: true,
      answer: result.answer,
      relatedPrompts: result.relatedPrompts,
      source: result.source,
      matchedContexts: result.matchedContexts ?? [],
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Assistant query failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
