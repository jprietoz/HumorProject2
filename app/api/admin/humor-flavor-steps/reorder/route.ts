import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { assertAdmin } from '@/lib/assert-admin'

// POST /api/admin/humor-flavor-steps/reorder
// Body: { steps: [{ id: number, order_by: number }] }
export async function POST(request: Request) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { steps } = body as { steps: { id: number; order_by: number }[] }

  if (!Array.isArray(steps) || steps.length === 0) {
    return NextResponse.json({ error: 'steps array is required' }, { status: 400 })
  }

  const db = createAdminClient()

  // Update each step's order_by in sequence
  const updates = await Promise.all(
    steps.map(({ id, order_by }) =>
      db
        .from('humor_flavor_steps')
        .update({ order_by, modified_by_user_id: user.id })
        .eq('id', id)
    )
  )

  const failed = updates.find(r => r.error)
  if (failed?.error) return NextResponse.json({ error: failed.error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}