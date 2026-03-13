import { createAdminClient } from '@/lib/supabase-admin'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function LlmProvidersPage() {
  const db = createAdminClient()
  const { data: providers, error } = await db
    .from('llm_providers')
    .select('id, name, created_datetime_utc')
    .order('name')

  if (error) throw error

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">LLM Providers</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {providers?.length ?? 0} provider{providers?.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link href="/admin/llm-providers/new" className="btn-primary">+ Add Provider</Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['ID', 'Name', 'Created', ''].map(h => (
                <th key={h} className="text-left pb-3 pr-4 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(providers ?? []).map((p, i) => (
              <tr key={p.id} style={{ borderBottom: i < (providers?.length ?? 0) - 1 ? '1px solid var(--border)' : 'none' }}>
                <td className="py-3 pr-4">
                  <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{p.id}</span>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-sm font-semibold text-white">{p.name}</span>
                </td>
                <td className="py-3 pr-4 whitespace-nowrap text-xs" style={{ color: 'var(--text-muted)' }}>
                  {new Date(p.created_datetime_utc).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                </td>
                <td className="py-3">
                  <Link href={`/admin/llm-providers/${p.id}`} className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                        style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!providers?.length && (
          <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No providers found.</p>
        )}
      </div>
    </div>
  )
}
