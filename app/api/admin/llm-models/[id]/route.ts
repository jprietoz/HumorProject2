import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { assertAdmin } from '@/lib/assert-admin'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const db = createAdminClient()
  const { data, error } = await db
    .from('llm_models')
    .select('id, name, llm_provider_id, provider_model_id, is_temperature_supported, created_datetime_utc')
    .eq('id', id)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const { name, llm_provider_id, provider_model_id, is_temperature_supported } = body
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!llm_provider_id) return NextResponse.json({ error: 'Provider is required' }, { status: 400 })

  const db = createAdminClient()
  const { data, error } = await db
    .from('llm_models')
    .update({ name, llm_provider_id: Number(llm_provider_id), provider_model_id: provider_model_id || null, is_temperature_supported: is_temperature_supported ?? true, modified_by_user_id: user.id })
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const db = createAdminClient()
  const { error } = await db.from('llm_models').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
