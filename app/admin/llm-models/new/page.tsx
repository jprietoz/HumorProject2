'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewLlmModelPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', llm_provider_id: '', provider_model_id: '', is_temperature_supported: true })
  const [providers, setProviders] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/llm-providers').then(r => r.json()).then(setProviders).catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name is required'); return }
    if (!form.llm_provider_id) { setError('Provider is required'); return }
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/admin/llm-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, llm_provider_id: Number(form.llm_provider_id) }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to create')
      router.push('/admin/llm-models')
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error') }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/llm-models" className="text-sm" style={{ color: 'var(--text-muted)' }}>← LLM Models</Link>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <h1 className="text-xl font-bold text-white">Add Model</h1>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="p-3 rounded-lg text-sm" style={{ background: '#ef44441a', color: '#ef4444', border: '1px solid #ef444433' }}>{error}</div>}
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Name <span style={{ color: '#ef4444' }}>*</span></label>
            <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. GPT-4o" className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Provider <span style={{ color: '#ef4444' }}>*</span></label>
            <select value={form.llm_provider_id} onChange={e => setForm(p => ({ ...p, llm_provider_id: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }} required>
              <option value="">— Select provider —</option>
              {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Provider Model ID</label>
            <input type="text" value={form.provider_model_id} onChange={e => setForm(p => ({ ...p, provider_model_id: e.target.value }))}
              placeholder="e.g. gpt-4o-2024-11-20" className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_temperature_supported}
              onChange={e => setForm(p => ({ ...p, is_temperature_supported: e.target.checked }))} className="w-4 h-4 rounded" />
            <span className="text-sm text-white">Temperature Supported</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? 'Saving…' : 'Add Model'}
            </button>
            <Link href="/admin/llm-models" className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
