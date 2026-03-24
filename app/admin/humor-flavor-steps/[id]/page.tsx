'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface StepData {
  id: number
  humor_flavor_id: number
  order_by: number
  description: string | null
  llm_temperature: number | null
  llm_system_prompt: string | null
  llm_user_prompt: string | null
  llm_model_id: number | null
  humor_flavor_step_type_id: number | null
  created_datetime_utc: string
}

export default function EditHumorFlavorStepPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [step, setStep] = useState<StepData | null>(null)
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/humor-flavor-steps/${id}`).then(r => r.json()),
      fetch('/api/admin/humor-flavors').then(r => r.json()),
      fetch('/api/admin/llm-models').then(r => r.json()),
      fetch('/api/admin/humor-flavor-step-types').then(r => r.json()),
    ]).then(([stepData, f, m, t]: [StepData, typeof flavors, typeof models, typeof stepTypes]) => {
      setStep(stepData)
      setFlavors(f)
      setModels(m)
      setStepTypes(t)
      setForm({
        humor_flavor_id: String(stepData.humor_flavor_id ?? ''),
        order_by: String(stepData.order_by ?? 1),
        description: stepData.description ?? '',
        llm_temperature: stepData.llm_temperature != null ? String(stepData.llm_temperature) : '',
        llm_system_prompt: stepData.llm_system_prompt ?? '',
        llm_user_prompt: stepData.llm_user_prompt ?? '',
        llm_model_id: stepData.llm_model_id != null ? String(stepData.llm_model_id) : '',
        humor_flavor_step_type_id: stepData.humor_flavor_step_type_id != null ? String(stepData.humor_flavor_step_type_id) : '',
      })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.humor_flavor_id) { setError('Flavor is required'); return }
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/admin/humor-flavor-steps/${id}`, {
        method: 'PUT',
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
    if (!confirm('Delete this step? This cannot be undone.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/humor-flavor-steps/${id}`, { method: 'DELETE' })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error) }
      router.push('/admin/humor-flavor-steps')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setDeleting(false)
    }
  }

  if (loading) return <div className="max-w-2xl mx-auto"><div className="card"><p style={{ color: 'var(--text-muted)' }}>Loading…</p></div></div>

  const inputStyle = { background: 'var(--input-bg)', border: '1px solid var(--border)' }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/humor-flavor-steps" className="text-sm" style={{ color: 'var(--text-muted)' }}>← Flavor Steps</Link>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <h1 className="text-xl font-bold text-white">Edit Step</h1>
      </div>

      {step && (
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          ID: {step.id} · Created: {new Date(step.created_datetime_utc).toLocaleDateString()}
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
              className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none" style={inputStyle} />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1.5">System Prompt</label>
            <textarea value={form.llm_system_prompt} onChange={e => setForm(p => ({ ...p, llm_system_prompt: e.target.value }))}
              rows={6} className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none resize-y font-mono" style={inputStyle} />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1.5">User Prompt</label>
            <textarea value={form.llm_user_prompt} onChange={e => setForm(p => ({ ...p, llm_user_prompt: e.target.value }))}
              rows={6} className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none resize-y font-mono" style={inputStyle} />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <Link href="/admin/humor-flavor-steps"
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