import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { assertAdmin } from '@/lib/assert-admin'

// GET /api/admin/images — list images
export async function GET() {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createAdminClient()
  const { data, error } = await db
    .from('images')
    .select('id, url, image_description, is_public, is_common_use, created_datetime_utc')
    .order('created_datetime_utc', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/admin/images — create image
export async function POST(request: Request) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { url, image_description, additional_context, is_public, is_common_use } = body

  if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

  const db = createAdminClient()
  const { data, error } = await db
    .from('images')
    .insert({
      url,
      image_description: image_description || null,
      additional_context: additional_context || null,
      is_public: is_public ?? false,
      is_common_use: is_common_use ?? false,
      profile_id: user.id,
      created_by_user_id: user.id,
      modified_by_user_id: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}