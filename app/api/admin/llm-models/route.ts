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

export async function GET() {
  const user = await assertSuperadmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createAdminClient()
  const { data, error } = await db
    .from('llm_models')
    .select('id, name, provider_model_id, is_temperature_supported, created_datetime_utc, llm_providers(name)')
    .order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const user = await assertSuperadmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, llm_provider_id, provider_model_id, is_temperature_supported } = body
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!llm_provider_id) return NextResponse.json({ error: 'Provider is required' }, { status: 400 })

  const db = createAdminClient()
  const { data, error } = await db
    .from('llm_models')
    .insert({ name, llm_provider_id: Number(llm_provider_id), provider_model_id: provider_model_id || null, is_temperature_supported: is_temperature_supported ?? true })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
