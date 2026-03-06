'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface ImageData {
  id: string
  url: string | null
  image_description: string | null
  additional_context: string | null
  is_public: boolean
  is_common_use: boolean
  created_datetime_utc: string
  profiles: { email: string | null; first_name: string | null; last_name: string | null } | null
}

export default function ImageDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [image, setImage] = useState<ImageData | null>(null)
  const [form, setForm] = useState({
    url: '',
    image_description: '',
    additional_context: '',
    is_public: false,
    is_common_use: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/images/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return }
        setImage(data)
        setForm({
          url: data.url ?? '',
          image_description: data.image_description ?? '',
          additional_context: data.additional_context ?? '',
          is_public: data.is_public ?? false,
          is_common_use: data.is_common_use ?? false,
        })
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await fetch(`/api/admin/images/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to update')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/images/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? 'Failed to delete')
      }
      router.push('/admin/images')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin/images" className="text-sm" style={{ color: 'var(--text-muted)' }}>← Images</Link>
        </div>
        <div className="card text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading…</div>
      </div>
    )
  }

  if (!image) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin/images" className="text-sm" style={{ color: 'var(--text-muted)' }}>← Images</Link>
        </div>
        <div className="card text-center py-12" style={{ color: '#ef4444' }}>Image not found.</div>
      </div>
    )
  }

  const ownerName = image.profiles?.first_name
    ? `${image.profiles.first_name} ${image.profiles.last_name ?? ''}`.trim()
    : (image.profiles?.email ?? '—')

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/images" className="text-sm" style={{ color: 'var(--text-muted)' }}>← Images</Link>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <h1 className="text-xl font-bold text-white">Edit Image</h1>
      </div>

      {/* Image preview */}
      {form.url && (
        <div className="card mb-4 p-0 overflow-hidden">
          <img
            src={form.url}
            alt="Preview"
            className="w-full object-contain max-h-64"
            style={{ background: '#111' }}
            onError={(e) => { (e.target as HTMLImageElement).alt = 'Image failed to load' }}
          />
        </div>
      )}

      {/* Meta */}
      <div className="flex gap-4 mb-4 text-xs" style={{ color: 'var(--text-muted)' }}>
        <span>Uploaded by <strong className="text-white">{ownerName}</strong></span>
        <span>·</span>
        <span>{new Date(image.created_datetime_utc).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        <span>·</span>
        <span className="font-mono" style={{ fontSize: '0.65rem' }}>{image.id}</span>
      </div>

      <div className="card">
        <form onSubmit={handleSave} className="space-y-5">
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: '#ef44441a', color: '#ef4444', border: '1px solid #ef444433' }}>
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-lg text-sm" style={{ background: '#10b9811a', color: '#10b981', border: '1px solid #10b98133' }}>
              Saved successfully!
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white mb-1.5">
              Image URL <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="url"
              value={form.url}
              onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Image Description</label>
            <textarea
              value={form.image_description}
              onChange={e => setForm(p => ({ ...p, image_description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none resize-none"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Additional Context</label>
            <textarea
              value={form.additional_context}
              onChange={e => setForm(p => ({ ...p, additional_context: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none resize-none"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
            />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_public}
                onChange={e => setForm(p => ({ ...p, is_public: e.target.checked }))}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-white">Public</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_common_use}
                onChange={e => setForm(p => ({ ...p, is_common_use: e.target.checked }))}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-white">Common Use</span>
            </label>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <Link href="/admin/images" className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              Cancel
            </Link>
            <div className="ml-auto">
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                  style={{ color: '#ef4444', border: '1px solid #ef444433' }}
                >
                  Delete Image
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: '#ef4444' }}>Sure?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="btn-danger text-sm disabled:opacity-50"
                  >
                    {deleting ? 'Deleting…' : 'Yes, Delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-3 py-2 rounded-lg text-sm"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}