import { createAdminClient } from '@/lib/supabase-admin'
import SafeImage from '@/app/admin/SafeImage'

export const dynamic = 'force-dynamic'

async function getDashboardStats() {
  const db = createAdminClient()

  const [
    profilesRes,
    imagesRes,
    publicImagesRes,
    commonUseImagesRes,
    captionsRes,
    publicCaptionsRes,
    featuredCaptionsRes,
    votesRes,
    upvotesRes,
    reportedCaptionsRes,
    reportedImagesRes,
    bugReportsRes,
    captionRequestsRes,
    topCaptionsRes,
    recentImagesRes,
    flavorCaptionsRes,
    humorFlavorsRes,
    screenshotsRes,
    sharesRes,
  ] = await Promise.all([
    db.from('profiles').select('*', { count: 'exact', head: true }),
    db.from('images').select('*', { count: 'exact', head: true }),
    db.from('images').select('*', { count: 'exact', head: true }).eq('is_public', true),
    db.from('images').select('*', { count: 'exact', head: true }).eq('is_common_use', true),
    db.from('captions').select('*', { count: 'exact', head: true }),
    db.from('captions').select('*', { count: 'exact', head: true }).eq('is_public', true),
    db.from('captions').select('*', { count: 'exact', head: true }).eq('is_featured', true),
    db.from('caption_votes').select('*', { count: 'exact', head: true }),
    db.from('caption_votes').select('*', { count: 'exact', head: true }).gt('vote_value', 0),
    db.from('reported_captions').select('*', { count: 'exact', head: true }),
    db.from('reported_images').select('*', { count: 'exact', head: true }),
    db.from('bug_reports').select('*', { count: 'exact', head: true }),
    db.from('caption_requests').select('*', { count: 'exact', head: true }),
    db.from('captions').select('id, content, like_count, image_id, images(url)').order('like_count', { ascending: false }).limit(5),
    db.from('images').select('id, url, image_description, created_datetime_utc').order('created_datetime_utc', { ascending: false }).limit(8),
    db.from('captions').select('humor_flavor_id').not('humor_flavor_id', 'is', null).limit(2000),
    db.from('humor_flavors').select('id, slug'),
    db.from('screenshots').select('*', { count: 'exact', head: true }),
    db.from('shares').select('*', { count: 'exact', head: true }),
  ])

  // Aggregate humor flavor distribution
  const flavorCounts: Record<string, number> = {}
  for (const row of flavorCaptionsRes.data ?? []) {
    const id = String(row.humor_flavor_id)
    flavorCounts[id] = (flavorCounts[id] ?? 0) + 1
  }
  const flavors = (humorFlavorsRes.data ?? []).map(f => ({
    id: String(f.id),
    slug: f.slug as string,
    count: flavorCounts[String(f.id)] ?? 0,
  })).sort((a, b) => b.count - a.count)

  const totalFlavored = flavors.reduce((s, f) => s + f.count, 0)

  return {
    profiles: profilesRes.count ?? 0,
    images: imagesRes.count ?? 0,
    publicImages: publicImagesRes.count ?? 0,
    commonUseImages: commonUseImagesRes.count ?? 0,
    captions: captionsRes.count ?? 0,
    publicCaptions: publicCaptionsRes.count ?? 0,
    featuredCaptions: featuredCaptionsRes.count ?? 0,
    votes: votesRes.count ?? 0,
    upvotes: upvotesRes.count ?? 0,
    reportedCaptions: reportedCaptionsRes.count ?? 0,
    reportedImages: reportedImagesRes.count ?? 0,
    bugReports: bugReportsRes.count ?? 0,
    captionRequests: captionRequestsRes.count ?? 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    topCaptions: (topCaptionsRes.data ?? []) as any as Array<{
      id: string; content: string | null; like_count: number; image_id: string;
      images: { url: string } | null
    }>,
    recentImages: (recentImagesRes.data ?? []) as Array<{
      id: string; url: string | null; image_description: string | null; created_datetime_utc: string
    }>,
    flavors,
    totalFlavored,
    screenshots: screenshotsRes.count ?? 0,
    shares: sharesRes.count ?? 0,
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

function RatioBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span style={{ color: 'var(--text-muted)' }}>{label}</span>
        <span className="font-semibold text-white">
          {value.toLocaleString()} <span style={{ color: 'var(--text-muted)' }}>({pct}%)</span>
        </span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const s = await getDashboardStats()

  const votePositiveRate = s.votes > 0 ? Math.round((s.upvotes / s.votes) * 100) : 0
  const avgVotesPerCaption = s.captions > 0 ? (s.votes / s.captions).toFixed(1) : '0'
  const avgCaptionsPerImage = s.images > 0 ? (s.captions / s.images).toFixed(1) : '0'
  const totalReported = s.reportedCaptions + s.reportedImages

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Platform-wide statistics — live from the database
        </p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Users" value={s.profiles} color="#8b5cf6" />
        <StatCard label="Total Images" value={s.images} sub={`${s.publicImages} public · ${s.commonUseImages} common-use`} color="#3b82f6" />
        <StatCard label="Total Captions" value={s.captions} sub={`${s.featuredCaptions} featured`} color="#10b981" />
        <StatCard label="Caption Requests" value={s.captionRequests} sub={`${avgCaptionsPerImage} captions/image avg`} color="#f59e0b" />
      </div>

      {/* Engagement row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Votes" value={s.votes} color="#e2e8f0" />
        <StatCard label="Positive Rate" value={`${votePositiveRate}%`} sub={`${s.upvotes.toLocaleString()} upvotes`} color={votePositiveRate >= 60 ? '#10b981' : '#f59e0b'} />
        <StatCard label="Avg Votes / Caption" value={avgVotesPerCaption} color="#e2e8f0" />
        <StatCard label="Screenshots" value={s.screenshots} sub={`${s.shares} shares`} color="#e2e8f0" />
      </div>

      {/* Content breakdown + Moderation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

        {/* Image breakdown */}
        <div className="card">
          <h2 className="font-semibold text-white mb-4">Image Breakdown</h2>
          <RatioBar label="Public" value={s.publicImages} total={s.images} color="#3b82f6" />
          <RatioBar label="Private" value={s.images - s.publicImages} total={s.images} color="#64748b" />
          <RatioBar label="Common-Use" value={s.commonUseImages} total={s.images} color="#8b5cf6" />
        </div>

        {/* Caption breakdown */}
        <div className="card">
          <h2 className="font-semibold text-white mb-4">Caption Breakdown</h2>
          <RatioBar label="Public" value={s.publicCaptions} total={s.captions} color="#10b981" />
          <RatioBar label="Private" value={s.captions - s.publicCaptions} total={s.captions} color="#64748b" />
          <RatioBar label="Featured" value={s.featuredCaptions} total={s.captions} color="#f59e0b" />
        </div>
      </div>

      {/* Moderation alert + vote ring */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

        {/* Vote sentiment ring */}
        <div className="card flex flex-col items-center justify-center text-center">
          <h2 className="font-semibold text-white mb-4">Vote Sentiment</h2>
          {/* CSS donut ring */}
          <div className="relative w-32 h-32 mb-4">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--border)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke={votePositiveRate >= 60 ? '#10b981' : '#f59e0b'}
                strokeWidth="3"
                strokeDasharray={`${votePositiveRate} ${100 - votePositiveRate}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">{votePositiveRate}%</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>positive</span>
            </div>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {s.upvotes.toLocaleString()} likes · {(s.votes - s.upvotes).toLocaleString()} skips
          </p>
        </div>

        {/* Moderation */}
        <div className="card col-span-1 md:col-span-2">
          <h2 className="font-semibold text-white mb-4">Moderation Queue</h2>
          {totalReported === 0 && s.bugReports === 0 ? (
            <div className="flex items-center gap-2 text-sm" style={{ color: '#10b981' }}>
              <span>✓</span> All clear — no reports pending
            </div>
          ) : (
            <div className="space-y-3">
              {s.reportedCaptions > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#ef44441a', border: '1px solid #ef444433' }}>
                  <span className="text-sm text-white">Reported Captions</span>
                  <span className="font-bold" style={{ color: '#ef4444' }}>{s.reportedCaptions}</span>
                </div>
              )}
              {s.reportedImages > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#ef44441a', border: '1px solid #ef444433' }}>
                  <span className="text-sm text-white">Reported Images</span>
                  <span className="font-bold" style={{ color: '#ef4444' }}>{s.reportedImages}</span>
                </div>
              )}
              {s.bugReports > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#f59e0b1a', border: '1px solid #f59e0b33' }}>
                  <span className="text-sm text-white">Bug Reports</span>
                  <span className="font-bold" style={{ color: '#f59e0b' }}>{s.bugReports}</span>
                </div>
              )}
            </div>
          )}

          {/* Platform activity summary */}
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
              Engagement Funnel
            </h3>
            <div className="space-y-2">
              {[
                { label: 'Users who requested captions', value: s.captionRequests, total: s.profiles, color: '#8b5cf6' },
                { label: 'Captions voted on', value: s.votes, total: s.captions, color: '#3b82f6' },
                { label: 'Captions shared', value: s.shares, total: s.captions, color: '#10b981' },
              ].map(({ label, value, total, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div style={{ width: 120, flexShrink: 0 }}>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{label}</p>
                  </div>
                  <div className="flex-1 progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: total > 0 ? `${Math.min(100, Math.round((value / total) * 100))}%` : '0%', background: color }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-white w-10 text-right">{value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Humor Flavor Distribution */}
      {s.flavors.length > 0 && s.totalFlavored > 0 && (
        <div className="card mb-6">
          <h2 className="font-semibold text-white mb-1">Humor Flavor Distribution</h2>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Which AI humor styles are generating the most captions
          </p>
          <div className="space-y-3">
            {s.flavors.slice(0, 8).map((f, i) => {
              const pct = Math.round((f.count / s.totalFlavored) * 100)
              const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16']
              return (
                <div key={f.id} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-sm shrink-0" style={{ background: colors[i % colors.length] }} />
                  <div className="w-40 shrink-0">
                    <p className="text-sm truncate text-white font-mono">{f.slug}</p>
                  </div>
                  <div className="flex-1 progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: colors[i % colors.length] }} />
                  </div>
                  <span className="text-xs text-white w-16 text-right">
                    {f.count.toLocaleString()} <span style={{ color: 'var(--text-muted)' }}>({pct}%)</span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Top Captions */}
      {s.topCaptions.length > 0 && (
        <div className="card mb-6">
          <h2 className="font-semibold text-white mb-1">Hall of Fame — Top Liked Captions</h2>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Ranked by total likes received</p>
          <div className="space-y-3">
            {s.topCaptions.map((c, i) => (
              <div key={c.id} className="flex items-start gap-4 p-3 rounded-lg table-row" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="w-6 shrink-0 text-center">
                  <span className="text-sm font-bold" style={{ color: i === 0 ? '#f59e0b' : i === 1 ? '#64748b' : i === 2 ? '#b45309' : 'var(--text-muted)' }}>
                    #{i + 1}
                  </span>
                </div>
                {c.images?.url && (
                  <SafeImage
                    src={c.images.url}
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white leading-snug line-clamp-2">
                    {c.content ?? '(no content)'}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-bold" style={{ color: '#10b981' }}>{c.like_count}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>likes</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Images */}
      {s.recentImages.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-white mb-1">Recently Added Images</h2>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Latest uploads to the platform</p>
          <div className="grid grid-cols-4 gap-3">
            {s.recentImages.map(img => (
              <div key={img.id} className="group relative rounded-lg overflow-hidden aspect-square bg-gray-800">
                {img.url && (
                  <SafeImage
                    src={img.url}
                    alt={img.image_description ?? ''}
                    className="w-full h-full object-cover"
                  />
                )}
                {img.image_description && (
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex items-end">
                    <p className="text-xs text-white line-clamp-3">{img.image_description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}