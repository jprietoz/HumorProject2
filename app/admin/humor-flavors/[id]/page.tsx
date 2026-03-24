'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface FlavorData {
  id: number
  slug: string
  description: string | null
  created_datetime_utc: string
}

export default function EditHumorFlavorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [flavor, setFlavor] = useState<FlavorData | null>(null)
  const [form, setForm] = useState({ slug: '', description: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/admin/humor-flavors/${id}`)
      .then(r => r.json())
      .then((data: FlavorData) => {
        setFlavor(data)
        setForm({ slug: data.slug ?? '', description: data.description ?? '' })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.slug.trim()) { setError('Slug is required'); return }
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/admin/humor-flavors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: form.slug, description: form.description || null }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to update')
      setSuccess('Saved successfully')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete flavor "${flavor?.slug}"? This will also delete all associated steps and cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/humor-flavors/${id}`, { method: 'DELETE' })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error) }
      router.push('/admin/humor-flavors')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setDeleting(false)
    }
  }

  if (loading) return <div className="max-w-2xl mx-auto"><div className="card"><p style={{ color: 'var(--text-muted)' }}>Loading…</p></div></div>

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/humor-flavors" className="text-sm" style={{ color: 'var(--text-muted)' }}>← Humor Flavors</Link>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <h1 className="text-xl font-bold text-white">Edit Flavor</h1>
      </div>

      {flavor && (
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          ID: {flavor.id} · Created: {new Date(flavor.created_datetime_utc).toLocaleDateString()}
        </p>
      )}

      <div className="card">
        <form onSubmit={handleSave} className="space-y-5">
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: '#ef44441a', color: '#ef4444', border: '1px solid #ef444433' }}>
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-lg text-sm" style={{ background: '#10b9811a', color: '#10b981', border: '1px solid #10b98133' }}>
              {success}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Slug <span style={{ color: '#ef4444' }}>*</span></label>
            <input
              type="text"
              value={form.slug}
              onChange={e => setForm(p => ({ ...p, slug: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none resize-none"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <Link href={`/admin/humor-flavors/${id}/test`}
                    className="px-4 py-2 rounded-lg text-sm font-semibold"
                    style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
                Test Flavor
              </Link>
              <Link href="/admin/humor-flavors"
                    className="px-4 py-2 rounded-lg text-sm font-semibold"
                    style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                Cancel
              </Link>
            </div>
            <button type="button" onClick={handleDelete} disabled={deleting}
              className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
              style={{ background: '#ef44441a', color: '#ef4444', border: '1px solid #ef444433' }}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}