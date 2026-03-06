import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/auth-client-server'

async function assertSuperadmin() {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return null

  const db = createAdminClient()
  const { data: profile } = await db
    .from('profiles')
    .select('is_superadmin')
    .eq('id', user.id)
    .single()

  return profile?.is_superadmin ? user : null
}

// GET /api/admin/images/[id]
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await assertSuperadmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const db = createAdminClient()
  const { data, error } = await db
    .from('images')
    .select('id, url, image_description, additional_context, is_public, is_common_use, created_datetime_utc, profiles(email, first_name, last_name)')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

// PUT /api/admin/images/[id]
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await assertSuperadmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const { url, image_description, additional_context, is_public, is_common_use } = body

  if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

  const db = createAdminClient()
  const { data, error } = await db
    .from('images')
    .update({
      url,
      image_description: image_description || null,
      additional_context: additional_context || null,
      is_public: is_public ?? false,
      is_common_use: is_common_use ?? false,
      modified_datetime_utc: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/admin/images/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await assertSuperadmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const db = createAdminClient()
  const { error } = await db.from('images').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}