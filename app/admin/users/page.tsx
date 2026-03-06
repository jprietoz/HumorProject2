import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

async function getUsers() {
  const db = createAdminClient()

  // Fetch all profiles
  const { data: profiles, error } = await db
    .from('profiles')
    .select('id, created_datetime_utc, first_name, last_name, email, is_superadmin, is_in_study, is_matrix_admin')
    .order('created_datetime_utc', { ascending: false })

  if (error) throw error

  // Get caption counts per profile
  const { data: captionCounts } = await db
    .from('captions')
    .select('profile_id')

  const { data: imageCounts } = await db
    .from('images')
    .select('profile_id')

  const captionsByProfile: Record<string, number> = {}
  for (const c of captionCounts ?? []) {
    captionsByProfile[c.profile_id] = (captionsByProfile[c.profile_id] ?? 0) + 1
  }

  const imagesByProfile: Record<string, number> = {}
  for (const i of imageCounts ?? []) {
    if (i.profile_id) {
      imagesByProfile[i.profile_id] = (imagesByProfile[i.profile_id] ?? 0) + 1
    }
  }

  return (profiles ?? []).map(p => ({
    ...p,
    captionCount: captionsByProfile[p.id] ?? 0,
    imageCount: imagesByProfile[p.id] ?? 0,
  }))
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: `${color}22`, color }}
    >
      {label}
    </span>
  )
}

export default async function UsersPage() {
  const users = await getUsers()

  const superadminCount = users.filter(u => u.is_superadmin).length

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users & Profiles</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {users.length} total · {superadminCount} superadmin{superadminCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Name', 'Email', 'Captions', 'Images', 'Joined', 'Roles'].map(h => (
                <th key={h} className="text-left pb-3 pr-4 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr
                key={u.id}
                className="table-row"
                style={{ borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <td className="py-3 pr-4">
                  <span className="font-medium text-white">
                    {u.first_name || u.last_name
                      ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim()
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>
                    }
                  </span>
                </td>
                <td className="py-3 pr-4" style={{ color: 'var(--text-muted)' }}>
                  {u.email ?? '—'}
                </td>
                <td className="py-3 pr-4">
                  <span className="font-semibold text-white">{u.captionCount}</span>
                </td>
                <td className="py-3 pr-4">
                  <span className="font-semibold text-white">{u.imageCount}</span>
                </td>
                <td className="py-3 pr-4 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                  {u.created_datetime_utc
                    ? new Date(u.created_datetime_utc).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '—'}
                </td>
                <td className="py-3 pr-4">
                  <div className="flex flex-wrap gap-1">
                    {u.is_superadmin && <Badge label="Superadmin" color="#8b5cf6" />}
                    {u.is_matrix_admin && <Badge label="Matrix Admin" color="#3b82f6" />}
                    {u.is_in_study && <Badge label="In Study" color="#10b981" />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No profiles found.</p>
        )}
      </div>
    </div>
  )
}