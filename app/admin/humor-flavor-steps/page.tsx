import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export default async function HumorFlavorStepsPage() {
  const db = createAdminClient()
  const { data: steps, error } = await db
    .from('humor_flavor_steps')
    .select(`
      id,
      order_by,
      description,
      llm_temperature,
      llm_system_prompt,
      llm_user_prompt,
      created_datetime_utc,
      humor_flavors(slug),
      llm_models(name),
      humor_flavor_step_types(slug)
    `)
    .order('humor_flavor_id', { ascending: true })
    .order('order_by', { ascending: true })

  if (error) throw error

  type StepRow = typeof steps[number]
  const getFlavor = (s: StepRow) => {
    const f = (s as unknown as { humor_flavors: { slug: string } | null }).humor_flavors
    return Array.isArray(f) ? f[0] ?? null : f ?? null
  }
  const getModel = (s: StepRow) => {
    const m = (s as unknown as { llm_models: { name: string } | null }).llm_models
    return Array.isArray(m) ? m[0] ?? null : m ?? null
  }
  const getStepType = (s: StepRow) => {
    const t = (s as unknown as { humor_flavor_step_types: { slug: string } | null }).humor_flavor_step_types
    return Array.isArray(t) ? t[0] ?? null : t ?? null
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Humor Flavor Steps</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {steps?.length ?? 0} step{steps?.length !== 1 ? 's' : ''} total
        </p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['ID', 'Flavor', 'Order', 'Type', 'Model', 'Temp', 'Description', 'Created'].map(h => (
                <th key={h} className="text-left pb-3 pr-4 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(steps ?? []).map((s, i) => {
              const flavor = getFlavor(s)
              const model = getModel(s)
              const stepType = getStepType(s)
              return (
                <tr key={s.id} style={{ borderBottom: i < (steps?.length ?? 0) - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td className="py-3 pr-4">
                    <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{s.id}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-xs font-mono font-semibold" style={{ color: '#8b5cf6' }}>
                      {flavor?.slug ?? '—'}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-xs text-white font-semibold">{s.order_by}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-xs font-mono" style={{ color: '#3b82f6' }}>{stepType?.slug ?? '—'}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-xs text-white">{model?.name ?? '—'}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {s.llm_temperature != null ? s.llm_temperature : '—'}
                    </span>
                  </td>
                  <td className="py-3 pr-4 max-w-xs">
                    <p className="text-xs text-white line-clamp-1">{s.description ?? '—'}</p>
                  </td>
                  <td className="py-3 whitespace-nowrap text-xs" style={{ color: 'var(--text-muted)' }}>
                    {new Date(s.created_datetime_utc).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!steps?.length && (
          <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No flavor steps found.</p>
        )}
      </div>
    </div>
  )
}