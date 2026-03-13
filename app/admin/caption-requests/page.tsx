import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export default async function CaptionRequestsPage() {
  const db = createAdminClient()
  const { data: requests, error, count } = await db
    .from('caption_requests')
    .select(`
      id,
      created_datetime_utc,
      profile_id,
      image_id,
      profiles(email, first_name, last_name),
      images(url, image_description)
    `, { count: 'exact' })
    .order('created_datetime_utc', { ascending: false })
    .limit(200)

  if (error) throw error

  type ReqRow = typeof requests[number]
  const getProfile = (r: ReqRow) => {
    const p = (r as unknown as { profiles: { email: string | null; first_name: string | null; last_name: string | null } | null }).profiles
    return Array.isArray(p) ? p[0] ?? null : p ?? null
  }
  const getImage = (r: ReqRow) => {
    const img = (r as unknown as { images: { url: string | null; image_description: string | null } | null }).images
    return Array.isArray(img) ? img[0] ?? null : img ?? null
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Caption Requests</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Showing {requests?.length ?? 0} of {(count ?? 0).toLocaleString()} requests (newest first)
        </p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['ID', 'User', 'Image', 'Created'].map(h => (
                <th key={h} className="text-left pb-3 pr-4 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(requests ?? []).map((r, i) => {
              const profile = getProfile(r)
              const image = getImage(r)
              const authorName = profile?.first_name
                ? `${profile.first_name} ${profile.last_name ?? ''}`.trim()
                : (profile?.email ?? '—')
              return (
                <tr key={r.id} style={{ borderBottom: i < (requests?.length ?? 0) - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td className="py-3 pr-4">
                    <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{r.id}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <p className="text-xs text-white">{authorName}</p>
                  </td>
                  <td className="py-3 pr-4 max-w-xs">
                    <p className="text-xs line-clamp-1" style={{ color: 'var(--text-muted)' }}>
                      {image?.image_description ?? image?.url ?? '—'}
                    </p>
                  </td>
                  <td className="py-3 whitespace-nowrap text-xs" style={{ color: 'var(--text-muted)' }}>
                    {new Date(r.created_datetime_utc).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!requests?.length && (
          <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No caption requests found.</p>
        )}
      </div>
    </div>
  )
}