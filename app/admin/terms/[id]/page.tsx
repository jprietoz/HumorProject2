'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface TermData {
  id: number
  term: string
  definition: string | null
  example: string | null
  priority: number
  term_type_id: number | null
  created_datetime_utc: string
  modified_datetime_utc: string | null
}

export default function EditTermPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [term, setTerm] = useState<TermData | null>(null)
  const [form, setForm] = useState({ term: '', definition: '', example: '', priority: '0', term_type_id: '' })
  const [termTypes, setTermTypes] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/terms/${id}`).then(r => r.json()),
      fetch('/api/admin/term-types').then(r => r.json()),
    ]).then(([termData, types]) => {
      setTerm(termData)
      setForm({
        term: termData.term ?? '',
        definition: termData.definition ?? '',
        example: termData.example ?? '',
        priority: String(termData.priority ?? 0),
        term_type_id: termData.term_type_id ? String(termData.term_type_id) : '',
      })
      setTermTypes(types)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.term.trim()) { setError('Term is required'); return }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/terms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          term: form.term,
          definition: form.definition || null,
          example: form.example || null,
          priority: parseInt(form.priority, 10) || 0,
          term_type_id: form.term_type_id ? parseInt(form.term_type_id, 10) : null,
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
    if (!confirm(`Delete term "${term?.term}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/terms/${id}`, { method: 'DELETE' })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error) }
      router.push('/admin/terms')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setDeleting(false)
    }
  }

  if (loading) return <div className="max-w-2xl mx-auto"><div className="card"><p style={{ color: 'var(--text-muted)' }}>Loading…</p></div></div>

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/terms" className="text-sm" style={{ color: 'var(--text-muted)' }}>← Terms</Link>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <h1 className="text-xl font-bold text-white">Edit Term</h1>
      </div>

      {term && (
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          ID: {term.id} · Created: {new Date(term.created_datetime_utc).toLocaleDateString()}
          {term.modified_datetime_utc && ` · Modified: ${new Date(term.modified_datetime_utc).toLocaleDateString()}`}
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
            <label className="block text-sm font-medium text-white mb-1.5">Term <span style={{ color: '#ef4444' }}>*</span></label>
            <input type="text" value={form.term} onChange={e => setForm(p => ({ ...p, term: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Type</label>
            <select value={form.term_type_id} onChange={e => setForm(p => ({ ...p, term_type_id: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
              <option value="">— None —</option>
              {termTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Definition</label>
            <textarea value={form.definition} onChange={e => setForm(p => ({ ...p, definition: e.target.value }))}
              rows={3} className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none resize-none"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }} />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Example</label>
            <textarea value={form.example} onChange={e => setForm(p => ({ ...p, example: e.target.value }))}
              rows={2} className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none resize-none"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }} />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Priority</label>
            <input type="number" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
              className="w-32 px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }} />
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <Link href="/admin/terms" className="px-4 py-2 rounded-lg text-sm font-semibold"
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