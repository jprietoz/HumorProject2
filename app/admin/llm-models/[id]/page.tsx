'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ModelData { id: number; name: string; llm_provider_id: number; provider_model_id: string | null; is_temperature_supported: boolean; created_datetime_utc: string }

export default function EditLlmModelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [model, setModel] = useState<ModelData | null>(null)
  const [form, setForm] = useState({ name: '', llm_provider_id: '', provider_model_id: '', is_temperature_supported: true })
  const [providers, setProviders] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/llm-models/${id}`).then(r => r.json()),
      fetch('/api/admin/llm-providers').then(r => r.json()),
    ]).then(([modelData, providerList]) => {
      setModel(modelData)
      setForm({
        name: modelData.name ?? '',
        llm_provider_id: String(modelData.llm_provider_id ?? ''),
        provider_model_id: modelData.provider_model_id ?? '',
        is_temperature_supported: modelData.is_temperature_supported ?? true,
      })
      setProviders(providerList)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name is required'); return }
    if (!form.llm_provider_id) { setError('Provider is required'); return }
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/admin/llm-models/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, llm_provider_id: Number(form.llm_provider_id) }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to update')
      setSuccess('Saved successfully'); setTimeout(() => setSuccess(null), 3000)
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete model "${model?.name}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/llm-models/${id}`, { method: 'DELETE' })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error) }
      router.push('/admin/llm-models')
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error'); setDeleting(false) }
  }

  if (loading) return <div className="max-w-2xl mx-auto"><div className="card"><p style={{ color: 'var(--text-muted)' }}>Loading…</p></div></div>

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/llm-models" className="text-sm" style={{ color: 'var(--text-muted)' }}>← LLM Models</Link>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <h1 className="text-xl font-bold text-white">Edit Model</h1>
      </div>
      {model && (
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          ID: {model.id} · Created: {new Date(model.created_datetime_utc).toLocaleDateString()}
        </p>
      )}
      <div className="card">
        <form onSubmit={handleSave} className="space-y-5">
          {error && <div className="p-3 rounded-lg text-sm" style={{ background: '#ef44441a', color: '#ef4444', border: '1px solid #ef444433' }}>{error}</div>}
          {success && <div className="p-3 rounded-lg text-sm" style={{ background: '#10b9811a', color: '#10b981', border: '1px solid #10b98133' }}>{success}</div>}
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Name <span style={{ color: '#ef4444' }}>*</span></label>
            <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
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
              className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_temperature_supported}
              onChange={e => setForm(p => ({ ...p, is_temperature_supported: e.target.checked }))} className="w-4 h-4 rounded" />
            <span className="text-sm text-white">Temperature Supported</span>
          </label>
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <Link href="/admin/llm-models" className="px-4 py-2 rounded-lg text-sm font-semibold"
                    style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>Cancel</Link>
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
