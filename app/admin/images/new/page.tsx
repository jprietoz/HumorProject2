'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewImagePage() {
  const router = useRouter()
  const [form, setForm] = useState({
    url: '',
    image_description: '',
    additional_context: '',
    is_public: false,
    is_common_use: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.url.trim()) { setError('URL is required'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to create image')
      router.push('/admin/images')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/images" className="text-sm" style={{ color: 'var(--text-muted)' }}>
          ← Images
        </Link>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <h1 className="text-xl font-bold text-white">Add Image</h1>
      </div>

      <div className="card">
        {/* Live preview */}
        {form.url && (
          <div className="mb-6 rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center" style={{ maxHeight: 280 }}>
            <img
              src={form.url}
              alt="Preview"
              className="max-w-full max-h-64 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).alt = 'Image failed to load' }}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: '#ef44441a', color: '#ef4444', border: '1px solid #ef444433' }}>
              {error}
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
              placeholder="https://example.com/image.jpg"
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
              placeholder="Describe what's in this image…"
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
              placeholder="Any extra context for caption generation…"
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

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Add Image'}
            </button>
            <Link href="/admin/images" className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                  style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}