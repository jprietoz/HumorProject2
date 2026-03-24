import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { assertAdmin } from '@/lib/assert-admin'

export async function GET() {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createAdminClient()
  const { data, error } = await db
    .from('terms')
    .select('id, term, definition, example, priority, term_type_id, created_datetime_utc, modified_datetime_utc, term_types(name)')
    .order('term', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { term, definition, example, priority, term_type_id } = body

  if (!term) return NextResponse.json({ error: 'Term is required' }, { status: 400 })

  const db = createAdminClient()
  const { data, error } = await db
    .from('terms')
    .insert({
      term,
      definition: definition || null,
      example: example || null,
      priority: priority ?? 0,
      term_type_id: term_type_id || null,
      created_by_user_id: user.id,
      modified_by_user_id: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}