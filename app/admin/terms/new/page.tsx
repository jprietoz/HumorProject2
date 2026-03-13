'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewTermPage() {
  const router = useRouter()
  const [form, setForm] = useState({ term: '', definition: '', example: '', priority: '0', term_type_id: '' })
  const [termTypes, setTermTypes] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/term-types').then(r => r.json()).then(setTermTypes).catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.term.trim()) { setError('Term is required'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/terms', {
        method: 'POST',
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
      if (!res.ok) throw new Error(json.error ?? 'Failed to create term')
      router.push('/admin/terms')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/terms" className="text-sm" style={{ color: 'var(--text-muted)' }}>← Terms</Link>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <h1 className="text-xl font-bold text-white">Add Term</h1>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: '#ef44441a', color: '#ef4444', border: '1px solid #ef444433' }}>
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Term <span style={{ color: '#ef4444' }}>*</span></label>
            <input type="text" value={form.term} onChange={e => setForm(p => ({ ...p, term: e.target.value }))}
              placeholder="e.g. rizz" className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
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
              placeholder="What does this term mean?" rows={3}
              className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none resize-none"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }} />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Example</label>
            <textarea value={form.example} onChange={e => setForm(p => ({ ...p, example: e.target.value }))}
              placeholder="Example usage…" rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none resize-none"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }} />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Priority</label>
            <input type="number" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
              className="w-32 px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? 'Saving…' : 'Add Term'}
            </button>
            <Link href="/admin/terms" className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}