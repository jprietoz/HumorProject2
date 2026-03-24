import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { assertAdmin } from '@/lib/assert-admin'

interface StepResult {
  step_id: number
  order_by: number
  step_type: string | null
  model_name: string | null
  provider_name: string | null
  provider_model_id: string | null
  system_prompt: string
  user_prompt: string
  output: string | null
  error: string | null
}

function interpolate(template: string | null, vars: Record<string, string>): string {
  if (!template) return ''
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const { image_description = '', image_url = '', extra_vars = {} } = body as {
    image_description?: string
    image_url?: string
    extra_vars?: Record<string, string>
  }

  const db = createAdminClient()

  // Fetch flavor + steps
  const { data: flavor, error: flavorErr } = await db
    .from('humor_flavors')
    .select('id, slug, description')
    .eq('id', id)
    .single()

  if (flavorErr || !flavor) {
    return NextResponse.json({ error: 'Flavor not found' }, { status: 404 })
  }

  const { data: steps, error: stepsErr } = await db
    .from('humor_flavor_steps')
    .select(`
      id, order_by, llm_system_prompt, llm_user_prompt, llm_temperature,
      llm_model_id, humor_flavor_step_type_id,
      llm_models(id, name, provider_model_id, llm_provider_id, llm_providers(name)),
      humor_flavor_step_types(slug)
    `)
    .eq('humor_flavor_id', id)
    .order('order_by', { ascending: true })

  if (stepsErr) return NextResponse.json({ error: stepsErr.message }, { status: 500 })
  if (!steps?.length) {
    return NextResponse.json({ error: 'This flavor has no steps configured' }, { status: 400 })
  }

  // Template variables available in prompts
  const vars: Record<string, string> = {
    image_description,
    image_url,
    ...extra_vars,
  }

  const results: StepResult[] = []
  let previousOutput = ''

  for (const step of steps) {
    const modelRaw = (step as unknown as { llm_models: unknown }).llm_models
    const model = Array.isArray(modelRaw) ? modelRaw[0] : modelRaw
    const stepTypeRaw = (step as unknown as { humor_flavor_step_types: unknown }).humor_flavor_step_types
    const stepType = Array.isArray(stepTypeRaw) ? stepTypeRaw?.[0] : stepTypeRaw
    const providerRaw = model ? (model as Record<string, unknown>).llm_providers : null
    const provider = Array.isArray(providerRaw) ? providerRaw?.[0] : providerRaw

    // Inject previous step output so prompt chains can use it
    vars.previous_output = previousOutput

    const systemPrompt = interpolate(step.llm_system_prompt, vars)
    const userPrompt = interpolate(step.llm_user_prompt, vars)

    const result: StepResult = {
      step_id: step.id,
      order_by: step.order_by,
      step_type: (stepType as { slug?: string } | null)?.slug ?? null,
      model_name: (model as { name?: string } | null)?.name ?? null,
      provider_name: (provider as { name?: string } | null)?.name ?? null,
      provider_model_id: (model as { provider_model_id?: string } | null)?.provider_model_id ?? null,
      system_prompt: systemPrompt,
      user_prompt: userPrompt,
      output: null,
      error: null,
    }

    // Attempt live LLM call if we have a model with a provider_model_id and API key
    const providerModelId = result.provider_model_id
    const apiKey = process.env.OPENAI_API_KEY

    if (providerModelId && apiKey) {
      try {
        const messages: { role: string; content: string }[] = []
        if (systemPrompt) messages.push({ role: 'system', content: systemPrompt })
        if (userPrompt) messages.push({ role: 'user', content: userPrompt })
        if (!messages.length) throw new Error('No prompt content')

        const llmRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: providerModelId,
            messages,
            temperature: step.llm_temperature ?? 0.7,
          }),
        })

        const llmJson = await llmRes.json()
        if (!llmRes.ok) throw new Error(llmJson.error?.message ?? 'LLM API error')
        result.output = llmJson.choices?.[0]?.message?.content ?? ''
        previousOutput = result.output ?? ''
      } catch (err) {
        result.error = err instanceof Error ? err.message : 'LLM call failed'
      }
    } else {
      // No live call — return prompt preview only
      result.output = null
      if (!providerModelId) result.error = 'No provider_model_id configured for this step\'s model'
      else result.error = 'OPENAI_API_KEY not set — prompt preview only'
    }

    results.push(result)
  }

  return NextResponse.json({
    flavor: { id: flavor.id, slug: flavor.slug },
    vars,
    results,
  })
}