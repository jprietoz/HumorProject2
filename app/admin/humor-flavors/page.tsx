import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export default async function HumorFlavorsPage() {
  const db = createAdminClient()
  const { data: flavors, error } = await db
    .from('humor_flavors')
    .select('id, slug, description, created_datetime_utc')
    .order('created_datetime_utc', { ascending: false })

  if (error) throw error

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Humor Flavors</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {flavors?.length ?? 0} flavor{flavors?.length !== 1 ? 's' : ''} total
        </p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['ID', 'Slug', 'Description', 'Created'].map(h => (
                <th key={h} className="text-left pb-3 pr-4 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(flavors ?? []).map((f, i) => (
              <tr key={f.id} style={{ borderBottom: i < (flavors?.length ?? 0) - 1 ? '1px solid var(--border)' : 'none' }}>
                <td className="py-3 pr-4">
                  <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{f.id}</span>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-xs font-mono font-semibold" style={{ color: '#8b5cf6' }}>{f.slug}</span>
                </td>
                <td className="py-3 pr-4 max-w-sm">
                  <p className="text-xs text-white line-clamp-2">{f.description ?? '—'}</p>
                </td>
                <td className="py-3 whitespace-nowrap text-xs" style={{ color: 'var(--text-muted)' }}>
                  {new Date(f.created_datetime_utc).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!flavors?.length && (
          <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No humor flavors found.</p>
        )}
      </div>
    </div>
  )
}
