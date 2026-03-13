'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ExampleData {
  id: number
  caption: string | null
  image_description: string | null
  explanation: string | null
  priority: number
  image_id: string | null
  created_datetime_utc: string
  modified_datetime_utc: string | null
}

export default function EditCaptionExamplePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [example, setExample] = useState<ExampleData | null>(null)
  const [form, setForm] = useState({ caption: '', image_description: '', explanation: '', priority: '0', image_id: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/admin/caption-examples/${id}`).then(r => r.json()).then((data: ExampleData) => {
      setExample(data)
      setForm({
        caption: data.caption ?? '',
        image_description: data.image_description ?? '',
        explanation: data.explanation ?? '',
        priority: String(data.priority ?? 0),
        image_id: data.image_id ?? '',
      })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.caption.trim()) { setError('Caption is required'); return }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/caption-examples/${id}`, {
        method: 'PUT',
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
    if (!confirm('Delete this caption example? This cannot be undone.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/caption-examples/${id}`, { method: 'DELETE' })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error) }
      router.push('/admin/caption-examples')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setDeleting(false)
    }
  }

  if (loading) return <div className="max-w-2xl mx-auto"><div className="card"><p style={{ color: 'var(--text-muted)' }}>Loading…</p></div></div>

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/caption-examples" className="text-sm" style={{ color: 'var(--text-muted)' }}>← Caption Examples</Link>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <h1 className="text-xl font-bold text-white">Edit Caption Example</h1>
      </div>
      {example && (
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          ID: {example.id} · Created: {new Date(example.created_datetime_utc).toLocaleDateString()}
          {example.modified_datetime_utc && ` · Modified: ${new Date(example.modified_datetime_utc).toLocaleDateString()}`}
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
            <label className="block text-sm font-medium text-white mb-1.5">Caption <span style={{ color: '#ef4444' }}>*</span></label>
            <textarea value={form.caption} onChange={e => setForm(p => ({ ...p, caption: e.target.value }))}
              rows={3} className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none resize-none"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Image Description</label>
            <textarea value={form.image_description} onChange={e => setForm(p => ({ ...p, image_description: e.target.value }))}
              rows={4} className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none resize-none"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }} />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Explanation</label>
            <textarea value={form.explanation} onChange={e => setForm(p => ({ ...p, explanation: e.target.value }))}
              rows={3} className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none resize-none"
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
              <label className="block text-sm font-medium text-white mb-1.5">Image ID</label>
              <input type="text" value={form.image_id} onChange={e => setForm(p => ({ ...p, image_id: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }} />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <Link href="/admin/caption-examples" className="px-4 py-2 rounded-lg text-sm font-semibold"
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
