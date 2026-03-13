import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export default async function LlmResponsesPage() {
  const db = createAdminClient()
  const { data: responses, error, count } = await db
    .from('llm_model_responses')
    .select(`
      id,
      created_datetime_utc,
      llm_model_response,
      processing_time_seconds,
      caption_request_id,
      llm_models(name),
      profiles(email, first_name, last_name)
    `, { count: 'exact' })
    .order('created_datetime_utc', { ascending: false })
    .limit(200)

  if (error) throw error

  type RespRow = typeof responses[number]
  const getModel = (r: RespRow) => {
    const m = (r as unknown as { llm_models: { name: string } | null }).llm_models
    return Array.isArray(m) ? m[0] ?? null : m ?? null
  }
  const getProfile = (r: RespRow) => {
    const p = (r as unknown as { profiles: { email: string | null; first_name: string | null; last_name: string | null } | null }).profiles
    return Array.isArray(p) ? p[0] ?? null : p ?? null
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">LLM Responses</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Showing {responses?.length ?? 0} of {(count ?? 0).toLocaleString()} responses (newest first)
        </p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Model', 'User', 'Response (preview)', 'Time (s)', 'Created'].map(h => (
                <th key={h} className="text-left pb-3 pr-4 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(responses ?? []).map((r, i) => {
              const model = getModel(r)
              const profile = getProfile(r)
              const authorName = profile?.first_name
                ? `${profile.first_name} ${profile.last_name ?? ''}`.trim()
                : (profile?.email ?? '—')
              return (
                <tr key={r.id} style={{ borderBottom: i < (responses?.length ?? 0) - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td className="py-3 pr-4">
                    <span className="text-xs font-semibold text-white">{model?.name ?? '—'}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <p className="text-xs truncate max-w-28" style={{ color: 'var(--text-muted)' }}>{authorName}</p>
                  </td>
                  <td className="py-3 pr-4 max-w-sm">
                    <p className="text-xs text-white line-clamp-2">{r.llm_model_response ?? '—'}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-xs" style={{ color: '#10b981' }}>
                      {r.processing_time_seconds != null ? `${r.processing_time_seconds}s` : '—'}
                    </span>
                  </td>
                  <td className="py-3 whitespace-nowrap text-xs" style={{ color: 'var(--text-muted)' }}>
                    {new Date(r.created_datetime_utc).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!responses?.length && (
          <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No LLM responses found.</p>
        )}
      </div>
    </div>
  )
}