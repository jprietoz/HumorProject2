'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewCaptionExamplePage() {
  const router = useRouter()
  const [form, setForm] = useState({ caption: '', image_description: '', explanation: '', priority: '0', image_id: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.caption.trim()) { setError('Caption is required'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/caption-examples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption: form.caption,
          image_description: form.image_description || null,
          explanation: form.explanation || null,
          priority: parseInt(form.priority, 10) || 0,
          image_id: form.image_id || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to create')
      router.push('/admin/caption-examples')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/caption-examples" className="text-sm" style={{ color: 'var(--text-muted)' }}>← Caption Examples</Link>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <h1 className="text-xl font-bold text-white">Add Caption Example</h1>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: '#ef44441a', color: '#ef4444', border: '1px solid #ef444433' }}>
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Caption <span style={{ color: '#ef4444' }}>*</span></label>
            <textarea value={form.caption} onChange={e => setForm(p => ({ ...p, caption: e.target.value }))}
              placeholder="The funny caption text…" rows={3}
              className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none resize-none"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Image Description</label>
            <textarea value={form.image_description} onChange={e => setForm(p => ({ ...p, image_description: e.target.value }))}
              placeholder="Describe the image this caption is for…" rows={4}
              className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none resize-none"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }} />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Explanation</label>
            <textarea value={form.explanation} onChange={e => setForm(p => ({ ...p, explanation: e.target.value }))}
              placeholder="Why is this caption funny?" rows={3}
              className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none resize-none"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }} />
          </div>
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Priority</label>
              <input type="number" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                className="w-32 px-3 py-2 rounded-lg text-sm text-white outline-none"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }} />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-white mb-1.5">Image ID (optional)</label>
              <input type="text" value={form.image_id} onChange={e => setForm(p => ({ ...p, image_id: e.target.value }))}
                placeholder="UUID of linked image"
                className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? 'Saving…' : 'Add Example'}
            </button>
            <Link href="/admin/caption-examples" className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}