import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { assertAdmin } from '@/lib/assert-admin'

export async function GET() {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createAdminClient()
  const { data, error } = await db
    .from('humor_flavor_mix')
    .select('id, humor_flavor_id, caption_count, created_datetime_utc, humor_flavors(slug)')
    .order('caption_count', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
