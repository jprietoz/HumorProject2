import { createAdminClient } from '@/lib/supabase-admin'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function TermsPage() {
  const db = createAdminClient()
  const { data: terms, error } = await db
    .from('terms')
    .select('id, term, definition, example, priority, created_datetime_utc, term_types(name)')
    .order('term', { ascending: true })

  if (error) throw error

  type TermRow = typeof terms[number]
  const getType = (t: TermRow) => {
    const ty = (t as unknown as { term_types: { name: string } | null }).term_types
    return Array.isArray(ty) ? ty[0] ?? null : ty ?? null
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Terms</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {terms?.length ?? 0} term{terms?.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link href="/admin/terms/new" className="btn-primary">+ Add Term</Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Term', 'Type', 'Definition', 'Example', 'Priority', 'Created', ''].map(h => (
                <th key={h} className="text-left pb-3 pr-4 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(terms ?? []).map((t, i) => {
              const termType = getType(t)
              return (
                <tr key={t.id} style={{ borderBottom: i < (terms?.length ?? 0) - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td className="py-3 pr-4">
                    <span className="text-sm font-semibold text-white">{t.term}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-xs" style={{ color: '#8b5cf6' }}>{termType?.name ?? '—'}</span>
                  </td>
                  <td className="py-3 pr-4 max-w-xs">
                    <p className="text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>{t.definition ?? '—'}</p>
                  </td>
                  <td className="py-3 pr-4 max-w-xs">
                    <p className="text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>{t.example ?? '—'}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-xs text-white">{t.priority ?? 0}</span>
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap text-xs" style={{ color: 'var(--text-muted)' }}>
                    {new Date(t.created_datetime_utc).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                  </td>
                  <td className="py-3">
                    <Link href={`/admin/terms/${t.id}`} className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                          style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                      Edit
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!terms?.length && (
          <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No terms found.</p>
        )}
      </div>
    </div>
  )
}