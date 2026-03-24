'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewHumorFlavorPage() {
  const router = useRouter()
  const [form, setForm] = useState({ slug: '', description: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.slug.trim()) { setError('Slug is required'); return }
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/admin/humor-flavors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: form.slug, description: form.description || null }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to create')
      router.push('/admin/humor-flavors')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/humor-flavors" className="text-sm" style={{ color: 'var(--text-muted)' }}>← Humor Flavors</Link>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <h1 className="text-xl font-bold text-white">Add Flavor</h1>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: '#ef44441a', color: '#ef4444', border: '1px solid #ef444433' }}>
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Slug <span style={{ color: '#ef4444' }}>*</span></label>
            <input
              type="text"
              value={form.slug}
              onChange={e => setForm(p => ({ ...p, slug: e.target.value }))}
              placeholder="e.g. gen-z-sarcasm"
              className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}
              required
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Lowercase, hyphen-separated identifier</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="What tone or style does this humor flavor represent?"
              rows={4}
              className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none resize-none"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? 'Saving…' : 'Add Flavor'}
            </button>
            <Link href="/admin/humor-flavors"
                  className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}