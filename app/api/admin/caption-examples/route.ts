import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { assertAdmin } from '@/lib/assert-admin'

export async function GET() {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createAdminClient()
  const { data, error } = await db
    .from('caption_examples')
    .select('id, image_description, caption, explanation, priority, image_id, created_datetime_utc, modified_datetime_utc')
    .order('created_datetime_utc', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { image_description, caption, explanation, priority, image_id } = body

  if (!caption) return NextResponse.json({ error: 'Caption is required' }, { status: 400 })

  const db = createAdminClient()
  const { data, error } = await db
    .from('caption_examples')
    .insert({
      image_description: image_description || null,
      caption,
      explanation: explanation || null,
      priority: priority ?? 0,
      image_id: image_id || null,
      created_by_user_id: user.id,
      modified_by_user_id: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}