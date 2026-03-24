import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { assertAdmin } from '@/lib/assert-admin'

export async function GET() {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createAdminClient()
  const { data, error } = await db
    .from('allowed_signup_domains')
    .select('id, apex_domain, created_datetime_utc')
    .order('apex_domain')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { apex_domain } = body
  if (!apex_domain) return NextResponse.json({ error: 'Domain is required' }, { status: 400 })

  const db = createAdminClient()
  const { data, error } = await db
    .from('allowed_signup_domains')
    .insert({ apex_domain: apex_domain.toLowerCase().trim(), created_by_user_id: user.id, modified_by_user_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
