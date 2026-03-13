import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export default async function LlmPromptChainsPage() {
  const db = createAdminClient()
  const { data: chains, error, count } = await db
    .from('llm_prompt_chains')
    .select(`
      id,
      created_datetime_utc,
      caption_request_id,
      caption_requests(profile_id, image_id)
    `, { count: 'exact' })
    .order('created_datetime_utc', { ascending: false })
    .limit(200)

  if (error) throw error

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">LLM Prompt Chains</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Showing {chains?.length ?? 0} of {(count ?? 0).toLocaleString()} chains (newest first)
        </p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['ID', 'Caption Request ID', 'Created'].map(h => (
                <th key={h} className="text-left pb-3 pr-4 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(chains ?? []).map((c, i) => (
              <tr key={c.id} style={{ borderBottom: i < (chains?.length ?? 0) - 1 ? '1px solid var(--border)' : 'none' }}>
                <td className="py-3 pr-4">
                  <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{c.id}</span>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-xs font-mono" style={{ color: '#3b82f6' }}>{c.caption_request_id}</span>
                </td>
                <td className="py-3 whitespace-nowrap text-xs" style={{ color: 'var(--text-muted)' }}>
                  {new Date(c.created_datetime_utc).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!chains?.length && (
          <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No prompt chains found.</p>
        )}
      </div>
    </div>
  )
}