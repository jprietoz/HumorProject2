import { createAdminClient } from '@/lib/supabase-admin'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function CaptionExamplesPage() {
  const db = createAdminClient()
  const { data: examples, error } = await db
    .from('caption_examples')
    .select('id, caption, image_description, explanation, priority, created_datetime_utc')
    .order('created_datetime_utc', { ascending: false })

  if (error) throw error

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Caption Examples</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {examples?.length ?? 0} example{examples?.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link href="/admin/caption-examples/new" className="btn-primary">+ Add Example</Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Caption', 'Image Description', 'Explanation', 'Priority', 'Created', ''].map(h => (
                <th key={h} className="text-left pb-3 pr-4 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(examples ?? []).map((ex, i) => (
              <tr key={ex.id} style={{ borderBottom: i < (examples?.length ?? 0) - 1 ? '1px solid var(--border)' : 'none' }}>
                <td className="py-3 pr-4 max-w-xs">
                  <p className="text-xs font-semibold text-white line-clamp-2">{ex.caption ?? '—'}</p>
                </td>
                <td className="py-3 pr-4 max-w-xs">
                  <p className="text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>{ex.image_description ?? '—'}</p>
                </td>
                <td className="py-3 pr-4 max-w-xs">
                  <p className="text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>{ex.explanation ?? '—'}</p>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-xs text-white">{ex.priority ?? 0}</span>
                </td>
                <td className="py-3 pr-4 whitespace-nowrap text-xs" style={{ color: 'var(--text-muted)' }}>
                  {new Date(ex.created_datetime_utc).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                </td>
                <td className="py-3">
                  <Link href={`/admin/caption-examples/${ex.id}`} className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                        style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!examples?.length && (
          <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No caption examples found.</p>
        )}
      </div>
    </div>
  )
}