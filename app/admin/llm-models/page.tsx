import { createAdminClient } from '@/lib/supabase-admin'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function LlmModelsPage() {
  const db = createAdminClient()
  const { data: models, error } = await db
    .from('llm_models')
    .select('id, name, provider_model_id, is_temperature_supported, created_datetime_utc, llm_providers(name)')
    .order('name')

  if (error) throw error

  type ModelRow = typeof models[number]
  const getProvider = (m: ModelRow) => {
    const p = (m as unknown as { llm_providers: { name: string } | null }).llm_providers
    return Array.isArray(p) ? p[0] ?? null : p ?? null
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">LLM Models</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {models?.length ?? 0} model{models?.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link href="/admin/llm-models/new" className="btn-primary">+ Add Model</Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['ID', 'Name', 'Provider', 'Model ID', 'Temp?', 'Created', ''].map(h => (
                <th key={h} className="text-left pb-3 pr-4 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(models ?? []).map((m, i) => {
              const provider = getProvider(m)
              return (
                <tr key={m.id} style={{ borderBottom: i < (models?.length ?? 0) - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td className="py-3 pr-4">
                    <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{m.id}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm font-semibold text-white">{m.name}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-xs" style={{ color: '#8b5cf6' }}>{provider?.name ?? '—'}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{m.provider_model_id ?? '—'}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-xs" style={{ color: m.is_temperature_supported ? '#10b981' : 'var(--text-muted)' }}>
                      {m.is_temperature_supported ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap text-xs" style={{ color: 'var(--text-muted)' }}>
                    {new Date(m.created_datetime_utc).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                  </td>
                  <td className="py-3">
                    <Link href={`/admin/llm-models/${m.id}`} className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                          style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                      Edit
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!models?.length && (
          <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No models found.</p>
        )}
      </div>
    </div>
  )
}
