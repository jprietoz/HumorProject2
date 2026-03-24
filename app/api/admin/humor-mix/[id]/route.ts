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

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await assertSuperadmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const { caption_count } = body

  if (caption_count == null || isNaN(Number(caption_count))) {
    return NextResponse.json({ error: 'caption_count is required' }, { status: 400 })
  }

  const db = createAdminClient()
  const { data, error } = await db
    .from('humor_flavor_mix')
    .update({ caption_count: Number(caption_count), modified_by_user_id: user.id })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
