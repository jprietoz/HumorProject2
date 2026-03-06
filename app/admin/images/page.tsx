import { createAdminClient } from '@/lib/supabase-admin'
import Link from 'next/link'
import SafeImage from '@/app/admin/SafeImage'

export const dynamic = 'force-dynamic'

async function getImages() {
  const db = createAdminClient()

  const { data, error } = await db
    .from('images')
    .select('id, url, image_description, is_public, is_common_use, created_datetime_utc, additional_context, profile_id, profiles(email, first_name, last_name)')
    .order('created_datetime_utc', { ascending: false })
    .limit(200)

  if (error) throw error
  return data ?? []
}

export default async function ImagesPage() {
  const images = await getImages()

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Images</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {images.length} images loaded (newest first)
          </p>
        </div>
        <Link
          href="/admin/images/new"
          className="btn-primary px-4 py-2 text-sm"
        >
          + Add Image
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map(img => {
          const profile = img.profiles as { email?: string; first_name?: string; last_name?: string } | null
          const ownerName = profile?.first_name
            ? `${profile.first_name} ${profile.last_name ?? ''}`.trim()
            : (profile?.email ?? '—')

          return (
            <Link
              key={img.id}
              href={`/admin/images/${img.id}`}
              className="card group hover:border-purple-500 transition-colors cursor-pointer"
              style={{ padding: '0.75rem' }}
            >
              {/* Thumbnail */}
              <div className="relative rounded-lg overflow-hidden mb-3 bg-gray-800" style={{ paddingTop: '66%' }}>
                {img.url ? (
                  <SafeImage
                    src={img.url}
                    alt={img.image_description ?? ''}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-3xl">🖼️</div>
                )}
                {/* Status badges */}
                <div className="absolute top-1.5 right-1.5 flex gap-1">
                  {img.is_public && (
                    <span className="text-xs px-1.5 py-0.5 rounded font-semibold"
                          style={{ background: '#10b98133', color: '#10b981' }}>pub</span>
                  )}
                  {img.is_common_use && (
                    <span className="text-xs px-1.5 py-0.5 rounded font-semibold"
                          style={{ background: '#8b5cf633', color: '#8b5cf6' }}>cu</span>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-white font-medium line-clamp-2 mb-1">
                {img.image_description ?? <span style={{ color: 'var(--text-muted)' }}>No description</span>}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                {ownerName}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {new Date(img.created_datetime_utc).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
              </p>
            </Link>
          )
        })}
      </div>

      {images.length === 0 && (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          No images found.
        </div>
      )}
    </div>
  )
}