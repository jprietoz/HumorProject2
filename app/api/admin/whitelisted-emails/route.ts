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
    .from('whitelist_email_addresses')
    .select('id, email_address, created_datetime_utc, modified_datetime_utc')
    .order('email_address')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const user = await assertSuperadmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { email_address } = body
  if (!email_address) return NextResponse.json({ error: 'Email address is required' }, { status: 400 })

  const db = createAdminClient()
  const { data, error } = await db
    .from('whitelist_email_addresses')
    .insert({ email_address: email_address.toLowerCase().trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
