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
      profiles!captions_profile_id_fkey(email, first_name, last_name),
      humor_flavors(slug)
    `, { count: 'exact' })
    .order('created_datetime_utc', { ascending: false })

  if (flavorSlug) {
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

const EMPTY_STATS = {
  totalVotes: 0,
  upvotes: 0,
  ratedCaptions: 0,
  flavorStats: [] as Array<{ id: string; slug: string; totalLikes: number; captionCount: number; ratedCount: number }>,
  topCaptions: [] as Array<{
    id: string; content: string | null; like_count: number
    images: { url: string } | null; humor_flavors: { slug: string } | null
  }>,
}

async function getRatingStats() {
  try {
    const db = createAdminClient()

    const [
      totalVotesRes,
      upvotesRes,
      topCaptionsRes,
      flavorCaptionsRes,
      humorFlavorsRes,
    ] = await Promise.all([
      db.from('caption_votes').select('*', { count: 'exact', head: true }),
      db.from('caption_votes').select('*', { count: 'exact', head: true }).gt('vote_value', 0),
      db.from('captions')
        .select('id, content, like_count, image_id, humor_flavor_id, images(url), humor_flavors(slug)')
        .order('like_count', { ascending: false })
        .limit(5),
      // Fetch captions with flavor info for per-flavor aggregation
      db.from('captions')
        .select('humor_flavor_id, like_count')
        .not('humor_flavor_id', 'is', null)
        .limit(2000),
      db.from('humor_flavors').select('id, slug'),
    ])

    const totalVotes = totalVotesRes.count ?? 0
    const upvotes = upvotesRes.count ?? 0

    // Aggregate per-flavor stats from caption rows
    const flavorMap: Record<string, { totalLikes: number; captionCount: number; ratedCount: number }> = {}
    let ratedCaptions = 0
    for (const row of flavorCaptionsRes.data ?? []) {
      const id = String(row.humor_flavor_id)
      if (!flavorMap[id]) flavorMap[id] = { totalLikes: 0, captionCount: 0, ratedCount: 0 }
      flavorMap[id].captionCount++
      const likes = Number(row.like_count ?? 0)
      flavorMap[id].totalLikes += likes
      if (likes > 0) { flavorMap[id].ratedCount++; ratedCaptions++ }
    }

    const flavorStats = (humorFlavorsRes.data ?? [])
      .map(f => ({
        id: String(f.id),
        slug: f.slug as string,
        ...(flavorMap[String(f.id)] ?? { totalLikes: 0, captionCount: 0, ratedCount: 0 }),
      }))
      .filter(f => f.captionCount > 0)
      .sort((a, b) => b.totalLikes - a.totalLikes)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topCaptions = (topCaptionsRes.data ?? []) as any as typeof EMPTY_STATS['topCaptions']

    return { totalVotes, upvotes, ratedCaptions, flavorStats, topCaptions }
  } catch {
    return EMPTY_STATS
  }
}

function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color?: string }) {
  return (
    <div className="stat-card">
      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="text-3xl font-bold" style={{ color: color ?? '#e2e8f0' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {sub && (
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</p>
      )}
    </div>
  )
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
  const [{ data: captions, count }, flavors, stats] = await Promise.all([
    getCaptions(0, flavorSlug),
    getFlavors(),
    getRatingStats(),
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

  const upvoteRate = stats.totalVotes > 0 ? Math.round((stats.upvotes / stats.totalVotes) * 100) : 0
  const avgVotesPerCaption = count > 0 ? (stats.totalVotes / count).toFixed(1) : '0'
  const ratedPct = count > 0 ? Math.round((stats.ratedCaptions / count) * 100) : 0

  const flavorColors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16']

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Captions</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Ratings &amp; engagement statistics across all captions
        </p>
      </div>

      {/* Rating stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Votes" value={stats.totalVotes} color="#8b5cf6" />
        <StatCard
          label="Upvote Rate"
          value={`${upvoteRate}%`}
          sub={`${stats.upvotes.toLocaleString()} upvotes`}
          color={upvoteRate >= 60 ? '#10b981' : '#f59e0b'}
        />
        <StatCard
          label="Avg Votes / Caption"
          value={avgVotesPerCaption}
          sub={`across ${count.toLocaleString()} captions`}
          color="#e2e8f0"
        />
        <StatCard
          label="Captions Rated"
          value={stats.ratedCaptions.toLocaleString()}
          sub={`${ratedPct}% of all captions`}
          color="#3b82f6"
        />
      </div>

      {/* Flavor stats + Top rated */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

        {/* Per-flavor rating breakdown */}
        {stats.flavorStats.length > 0 && (
          <div className="card">
            <h2 className="font-semibold text-white mb-1">Ratings by Humor Flavor</h2>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Total likes earned per AI humor style
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Flavor', 'Captions', 'Total Likes', 'Avg Likes', '% Rated'].map(h => (
                      <th key={h} className="text-left pb-2 pr-3 font-semibold uppercase tracking-wider"
                          style={{ color: 'var(--text-muted)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.flavorStats.map((f, i) => {
                    const avg = f.captionCount > 0 ? (f.totalLikes / f.captionCount).toFixed(1) : '0'
                    const pct = f.captionCount > 0 ? Math.round((f.ratedCount / f.captionCount) * 100) : 0
                    const maxLikes = stats.flavorStats[0]?.totalLikes ?? 1
                    const barWidth = maxLikes > 0 ? Math.round((f.totalLikes / maxLikes) * 100) : 0
                    const color = flavorColors[i % flavorColors.length]
                    return (
                      <tr key={f.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="py-2 pr-3">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                            <Link href={`/admin/captions?flavor=${f.slug}`}
                                  className="font-mono hover:underline" style={{ color }}>
                              {f.slug}
                            </Link>
                          </div>
                        </td>
                        <td className="py-2 pr-3" style={{ color: 'var(--text-muted)' }}>
                          {f.captionCount.toLocaleString()}
                        </td>
                        <td className="py-2 pr-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
                              <div className="h-full rounded-full" style={{ width: `${barWidth}%`, background: color }} />
                            </div>
                            <span className="font-semibold text-white">{f.totalLikes.toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="py-2 pr-3 font-semibold" style={{ color: '#10b981' }}>
                          {avg}
                        </td>
                        <td className="py-2">
                          <span style={{ color: pct >= 50 ? '#10b981' : 'var(--text-muted)' }}>
                            {pct}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top rated captions */}
        {stats.topCaptions.length > 0 && (
          <div className="card">
            <h2 className="font-semibold text-white mb-1">Top Rated Captions</h2>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Highest liked captions across the platform
            </p>
            <div className="space-y-3">
              {stats.topCaptions.map((c, i) => {
                const rankColor = i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : 'var(--text-muted)'
                const img = c.images
                const flavor = c.humor_flavors
                return (
                  <div key={c.id} className="flex items-start gap-3 p-3 rounded-lg"
                       style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                    <span className="text-sm font-bold w-5 shrink-0 text-center" style={{ color: rankColor }}>
                      #{i + 1}
                    </span>
                    {img?.url && (
                      <SafeImage src={img.url} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white leading-snug line-clamp-2">{c.content ?? '—'}</p>
                      {flavor?.slug && (
                        <span className="text-xs font-mono mt-1 inline-block" style={{ color: '#8b5cf6' }}>
                          {flavor.slug}
                        </span>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-base font-bold" style={{ color: '#10b981' }}>{c.like_count}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>likes</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Caption table */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Showing {captions.length} of {count.toLocaleString()} captions (newest first)
          {flavorSlug && <span> · filtered by <span style={{ color: '#8b5cf6' }}>{flavorSlug}</span></span>}
        </p>
        {/* Flavor filter */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
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