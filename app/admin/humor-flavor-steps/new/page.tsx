'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewHumorFlavorStepPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    humor_flavor_id: '',
    order_by: '1',
    description: '',
    llm_temperature: '',
    llm_system_prompt: '',
    llm_user_prompt: '',
    llm_model_id: '',
    humor_flavor_step_type_id: '',
  })
  const [flavors, setFlavors] = useState<{ id: number; slug: string }[]>([])
  const [models, setModels] = useState<{ id: number; name: string }[]>([])
  const [stepTypes, setStepTypes] = useState<{ id: number; slug: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/humor-flavors').then(r => r.json()),
      fetch('/api/admin/llm-models').then(r => r.json()),
      fetch('/api/admin/humor-flavor-step-types').then(r => r.json()),
    ]).then(([f, m, t]) => {
      setFlavors(f)
      setModels(m)
      setStepTypes(t)
    }).catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.humor_flavor_id) { setError('Flavor is required'); return }
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/admin/humor-flavor-steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          humor_flavor_id: Number(form.humor_flavor_id),
          order_by: Number(form.order_by) || 1,
          description: form.description || null,
          llm_temperature: form.llm_temperature !== '' ? Number(form.llm_temperature) : null,
          llm_system_prompt: form.llm_system_prompt || null,
          llm_user_prompt: form.llm_user_prompt || null,
          llm_model_id: form.llm_model_id ? Number(form.llm_model_id) : null,
          humor_flavor_step_type_id: form.humor_flavor_step_type_id ? Number(form.humor_flavor_step_type_id) : null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to create')
      router.push('/admin/humor-flavor-steps')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = { background: 'var(--input-bg)', border: '1px solid var(--border)' }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/humor-flavor-steps" className="text-sm" style={{ color: 'var(--text-muted)' }}>← Flavor Steps</Link>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <h1 className="text-xl font-bold text-white">Add Step</h1>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: '#ef44441a', color: '#ef4444', border: '1px solid #ef444433' }}>
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Flavor <span style={{ color: '#ef4444' }}>*</span></label>
              <select value={form.humor_flavor_id} onChange={e => setForm(p => ({ ...p, humor_flavor_id: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none" style={inputStyle} required>
                <option value="">— Select flavor —</option>
                {flavors.map(f => <option key={f.id} value={f.id}>{f.slug}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Order</label>
              <input type="number" value={form.order_by} onChange={e => setForm(p => ({ ...p, order_by: e.target.value }))}
                min="1" className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none" style={inputStyle} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Step Type</label>
              <select value={form.humor_flavor_step_type_id} onChange={e => setForm(p => ({ ...p, humor_flavor_step_type_id: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none" style={inputStyle}>
                <option value="">— None —</option>
                {stepTypes.map(t => <option key={t.id} value={t.id}>{t.slug}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">LLM Model</label>
              <select value={form.llm_model_id} onChange={e => setForm(p => ({ ...p, llm_model_id: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none" style={inputStyle}>
                <option value="">— None —</option>
                {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Temperature</label>
            <input type="number" step="0.1" min="0" max="2" value={form.llm_temperature}
              onChange={e => setForm(p => ({ ...p, llm_temperature: e.target.value }))}
              placeholder="e.g. 0.7" className="w-32 px-3 py-2 rounded-lg text-sm text-white outline-none" style={inputStyle} />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1.5">Description</label>
            <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Brief description of this step" className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none" style={inputStyle} />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1.5">System Prompt</label>
            <textarea value={form.llm_system_prompt} onChange={e => setForm(p => ({ ...p, llm_system_prompt: e.target.value }))}
              rows={5} placeholder="System prompt for this step…"
              className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none resize-y font-mono"
              style={inputStyle} />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1.5">User Prompt</label>
            <textarea value={form.llm_user_prompt} onChange={e => setForm(p => ({ ...p, llm_user_prompt: e.target.value }))}
              rows={5} placeholder="User prompt for this step…"
              className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none resize-y font-mono"
              style={inputStyle} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? 'Saving…' : 'Add Step'}
            </button>
            <Link href="/admin/humor-flavor-steps"
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