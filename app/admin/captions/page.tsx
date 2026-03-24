import { createAdminClient } from '@/lib/supabase-admin'
import SafeImage from '@/app/admin/SafeImage'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getCaptions(page = 0, flavorSlug?: string) {
  const db = createAdminClient()
  const PAGE_SIZE = 100

  let query = db
    .from('captions')
    .select(`
      id,
      content,
      is_public,
      is_featured,
      like_count,
      created_datetime_utc,
      image_id,
      images(url, image_description),
      profiles(email, first_name, last_name),
      humor_flavors(slug)
    `, { count: 'exact' })
    .order('created_datetime_utc', { ascending: false })

  if (flavorSlug) {
    // Join via humor_flavors to filter
    const { data: flavor } = await db
      .from('humor_flavors')
      .select('id')
      .eq('slug', flavorSlug)
      .single()
    if (flavor) {
      query = query.eq('humor_flavor_id', flavor.id)
    }
  }

  const { data, error, count } = await query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  if (error) throw error
  return { data: data ?? [], count: count ?? 0 }
}

async function getFlavors() {
  const db = createAdminClient()
  const { data } = await db.from('humor_flavors').select('id, slug').order('slug')
  return data ?? []
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="text-xs px-1.5 py-0.5 rounded font-semibold" style={{ background: `${color}22`, color }}>
      {label}
    </span>
  )
}

export default async function CaptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ flavor?: string }>
}) {
  const { flavor: flavorSlug } = await searchParams
  const [{ data: captions, count }, flavors] = await Promise.all([
    getCaptions(0, flavorSlug),
    getFlavors(),
  ])

  type CaptionRow = typeof captions[number]
  type ImageJoin = { url: string | null; image_description: string | null } | null
  type ProfileJoin = { email: string | null; first_name: string | null; last_name: string | null } | null
  type FlavorJoin = { slug: string } | null

  const getImage = (c: CaptionRow): ImageJoin => {
    const i = (c as unknown as { images: ImageJoin }).images
    return Array.isArray(i) ? i[0] ?? null : i ?? null
  }
  const getProfile = (c: CaptionRow): ProfileJoin => {
    const p = (c as unknown as { profiles: ProfileJoin }).profiles
    return Array.isArray(p) ? p[0] ?? null : p ?? null
  }
  const getFlavor = (c: CaptionRow): FlavorJoin => {
    const f = (c as unknown as { humor_flavors: FlavorJoin }).humor_flavors
    return Array.isArray(f) ? f[0] ?? null : f ?? null
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Captions</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Showing {captions.length} of {count.toLocaleString()} captions (newest first)
            {flavorSlug && <span> · filtered by <span style={{ color: '#8b5cf6' }}>{flavorSlug}</span></span>}
          </p>
        </div>
        {/* Flavor filter */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Flavor:</span>
          <div className="flex gap-1 flex-wrap">
            <Link href="/admin/captions"
                  className="text-xs px-2.5 py-1.5 rounded-lg font-semibold"
                  style={{
                    background: !flavorSlug ? 'rgba(139,92,246,0.15)' : 'var(--bg-primary)',
                    color: !flavorSlug ? '#8b5cf6' : 'var(--text-muted)',
                    border: `1px solid ${!flavorSlug ? 'rgba(139,92,246,0.4)' : 'var(--border)'}`,
                  }}>
              All
            </Link>
            {flavors.map(f => (
              <Link key={f.id} href={`/admin/captions?flavor=${f.slug}`}
                    className="text-xs px-2.5 py-1.5 rounded-lg font-semibold font-mono"
                    style={{
                      background: flavorSlug === f.slug ? 'rgba(139,92,246,0.15)' : 'var(--bg-primary)',
                      color: flavorSlug === f.slug ? '#8b5cf6' : 'var(--text-muted)',
                      border: `1px solid ${flavorSlug === f.slug ? 'rgba(139,92,246,0.4)' : 'var(--border)'}`,
                    }}>
                {f.slug}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Image', 'Caption', 'Author', 'Flavor', 'Likes', 'Created', 'Flags'].map(h => (
                <th key={h} className="text-left pb-3 pr-4 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {captions.map((c, i) => {
              const img = getImage(c)
              const profile = getProfile(c)
              const flavor = getFlavor(c)
              const authorName = profile?.first_name
                ? `${profile.first_name} ${profile.last_name ?? ''}`.trim()
                : (profile?.email ?? '—')

              return (
                <tr
                  key={c.id}
                  className="table-row"
                  style={{ borderBottom: i < captions.length - 1 ? '1px solid var(--border)' : 'none' }}
                >
                  <td className="py-3 pr-4">
                    {img?.url ? (
                      <SafeImage src={img.url} className="w-12 h-10 object-cover rounded-lg" />
                    ) : (
                      <div className="w-12 h-10 rounded-lg flex items-center justify-center text-lg"
                           style={{ background: 'var(--border)' }}>🖼️</div>
                    )}
                  </td>
                  <td className="py-3 pr-4 max-w-xs">
                    <p className="text-white text-xs line-clamp-2">{c.content ?? '—'}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <p className="text-xs truncate max-w-28" style={{ color: 'var(--text-muted)' }}>
                      {authorName}
                    </p>
                  </td>
                  <td className="py-3 pr-4">
                    {flavor?.slug ? (
                      <Link href={`/admin/captions?flavor=${flavor.slug}`}
                            className="text-xs font-mono hover:underline" style={{ color: '#8b5cf6' }}>
                        {flavor.slug}
                      </Link>
                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td className="py-3 pr-4">
                    <span className="font-semibold text-sm" style={{ color: '#10b981' }}>
                      {c.like_count ?? 0}
                    </span>
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap text-xs" style={{ color: 'var(--text-muted)' }}>
                    {new Date(c.created_datetime_utc).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: '2-digit'
                    })}
                  </td>
                  <td className="py-3 pr-2">
                    <div className="flex flex-wrap gap-1">
                      {c.is_public && <Badge label="pub" color="#10b981" />}
                      {c.is_featured && <Badge label="★" color="#f59e0b" />}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {captions.length === 0 && (
          <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
            {flavorSlug ? `No captions found for flavor "${flavorSlug}".` : 'No captions found.'}
          </p>
        )}
      </div>

      {count > 100 && (
        <p className="text-xs text-center mt-4" style={{ color: 'var(--text-muted)' }}>
          Showing first 100 of {count.toLocaleString()} captions
        </p>
      )}
    </div>
  )
}