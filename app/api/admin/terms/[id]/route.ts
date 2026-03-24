import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/auth-client-server'

async function assertSuperadmin() {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return null
  const db = createAdminClient()
  const { data: profile } = await db.from('profiles').select('is_superadmin').eq('id', user.id).single()
  return profile?.is_superadmin ? user : null
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await assertSuperadmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const db = createAdminClient()
  const { data, error } = await db
    .from('terms')
    .select('id, term, definition, example, priority, term_type_id, created_datetime_utc, modified_datetime_utc')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await assertSuperadmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const { term, definition, example, priority, term_type_id } = body

  if (!term) return NextResponse.json({ error: 'Term is required' }, { status: 400 })

  const db = createAdminClient()
  const { data, error } = await db
    .from('terms')
    .update({
      term,
      definition: definition || null,
      example: example || null,
      priority: priority ?? 0,
      term_type_id: term_type_id || null,
      modified_by_user_id: user.id,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await assertSuperadmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const db = createAdminClient()
  const { error } = await db.from('terms').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}