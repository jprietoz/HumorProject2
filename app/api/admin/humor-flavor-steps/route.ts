import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { assertAdmin } from '@/lib/assert-admin'

export async function GET() {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createAdminClient()
  const { data, error } = await db
    .from('humor_flavor_steps')
    .select(`
      id, order_by, description, llm_temperature,
      llm_system_prompt, llm_user_prompt, created_datetime_utc,
      humor_flavor_id, llm_model_id, humor_flavor_step_type_id,
      humor_flavors(slug), llm_models(name), humor_flavor_step_types(slug)
    `)
    .order('humor_flavor_id', { ascending: true })
    .order('order_by', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    humor_flavor_id, order_by, description,
    llm_temperature, llm_system_prompt, llm_user_prompt,
    llm_model_id, humor_flavor_step_type_id,
  } = body

  if (!humor_flavor_id) return NextResponse.json({ error: 'humor_flavor_id is required' }, { status: 400 })
  if (order_by == null) return NextResponse.json({ error: 'order_by is required' }, { status: 400 })

  const db = createAdminClient()
  const { data, error } = await db
    .from('humor_flavor_steps')
    .insert({
      humor_flavor_id: Number(humor_flavor_id),
      order_by: Number(order_by),
      description: description || null,
      llm_temperature: llm_temperature != null ? Number(llm_temperature) : null,
      llm_system_prompt: llm_system_prompt || null,
      llm_user_prompt: llm_user_prompt || null,
      llm_model_id: llm_model_id ? Number(llm_model_id) : null,
      humor_flavor_step_type_id: humor_flavor_step_type_id ? Number(humor_flavor_step_type_id) : null,
      created_by_user_id: user.id,
      modified_by_user_id: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}