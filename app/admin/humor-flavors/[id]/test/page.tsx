'use client'

import { useState, use } from 'react'
import Link from 'next/link'

interface StepResult {
  step_id: number
  order_by: number
  step_type: string | null
  model_name: string | null
  provider_name: string | null
  provider_model_id: string | null
  system_prompt: string
  user_prompt: string
  output: string | null
  error: string | null
}

interface TestResult {
  flavor: { id: number; slug: string }
  vars: Record<string, string>
  results: StepResult[]
}

type PromptView = 'output' | 'system' | 'user'

export default function TestFlavorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [imageDescription, setImageDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [extraVarsRaw, setExtraVarsRaw] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [promptView, setPromptView] = useState<Record<number, PromptView>>({})

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null); setResult(null)

    let extra_vars: Record<string, string> = {}
    if (extraVarsRaw.trim()) {
      try {
        extra_vars = JSON.parse(extraVarsRaw)
      } catch {
        setError('Extra variables must be valid JSON, e.g. {"key": "value"}')
        setLoading(false)
        return
      }
    }

    try {
      const res = await fetch(`/api/admin/humor-flavors/${id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_description: imageDescription, image_url: imageUrl, extra_vars }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Test failed')
      setResult(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const getView = (stepId: number): PromptView => promptView[stepId] ?? 'output'
  const setView = (stepId: number, view: PromptView) =>
    setPromptView(p => ({ ...p, [stepId]: view }))

  const inputStyle = { background: 'var(--input-bg)', border: '1px solid var(--border)' }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/humor-flavors" className="text-sm" style={{ color: 'var(--text-muted)' }}>← Humor Flavors</Link>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <Link href={`/admin/humor-flavors/${id}`} className="text-sm" style={{ color: 'var(--text-muted)' }}>Edit</Link>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <h1 className="text-xl font-bold text-white">Test Flavor</h1>
      </div>

      {/* Input form */}
      <div className="card mb-6">
        <h2 className="text-sm font-semibold text-white mb-4">Test Inputs</h2>
        <form onSubmit={handleTest} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: '#ef44441a', color: '#ef4444', border: '1px solid #ef444433' }}>
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">
              Image Description
              <span className="text-xs ml-2 font-normal" style={{ color: 'var(--text-muted)' }}>
                injected as <code className="font-mono">&#123;&#123;image_description&#125;&#125;</code>
              </span>
            </label>
            <textarea
              value={imageDescription}
              onChange={e => setImageDescription(e.target.value)}
              rows={3}
              placeholder="A photo of a dog wearing sunglasses at the beach…"
              className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none resize-none"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">
              Image URL
              <span className="text-xs ml-2 font-normal" style={{ color: 'var(--text-muted)' }}>
                injected as <code className="font-mono">&#123;&#123;image_url&#125;&#125;</code>
              </span>
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="https://…"
              className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">
              Extra Variables
              <span className="text-xs ml-2 font-normal" style={{ color: 'var(--text-muted)' }}>
                JSON object, e.g. <code className="font-mono">&#123;&quot;tone&quot;:&quot;sarcastic&quot;&#125;</code>
              </span>
            </label>
            <input
              type="text"
              value={extraVarsRaw}
              onChange={e => setExtraVarsRaw(e.target.value)}
              placeholder='{"key": "value"}'
              className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none font-mono"
              style={inputStyle}
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? 'Running…' : 'Run Flavor'}
          </button>
        </form>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">Results</h2>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold"
                  style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}>
              {result.flavor.slug}
            </span>
          </div>

          {result.results.map(step => {
            const view = getView(step.step_id)
            const hasOutput = !!step.output
            const hasError = !!step.error

            return (
              <div key={step.step_id} className="card">
                {/* Step header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded"
                          style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                      Step {step.order_by}
                    </span>
                    {step.step_type && (
                      <span className="text-xs font-mono" style={{ color: '#3b82f6' }}>{step.step_type}</span>
                    )}
                    {step.model_name && (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {step.provider_name && `${step.provider_name} · `}{step.model_name}
                        {step.provider_model_id && ` (${step.provider_model_id})`}
                      </span>
                    )}
                  </div>
                  {/* Tab switcher */}
                  <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                    {(['output', 'system', 'user'] as PromptView[]).map(v => (
                      <button
                        key={v}
                        onClick={() => setView(step.step_id, v)}
                        className="text-xs px-3 py-1.5 font-medium transition-colors"
                        style={{
                          background: view === v ? 'var(--accent-purple)' : 'var(--bg-primary)',
                          color: view === v ? '#fff' : 'var(--text-muted)',
                          borderRight: v !== 'user' ? '1px solid var(--border)' : undefined,
                        }}
                      >
                        {v === 'output' ? 'Output' : v === 'system' ? 'System' : 'User'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content */}
                {view === 'output' && (
                  <>
                    {hasError && (
                      <div className="p-3 rounded-lg text-xs mb-3" style={{ background: '#ef44441a', color: '#ef4444', border: '1px solid #ef444433' }}>
                        {step.error}
                      </div>
                    )}
                    {hasOutput ? (
                      <pre className="whitespace-pre-wrap text-sm text-white leading-relaxed"
                           style={{ fontFamily: 'system-ui, sans-serif' }}>
                        {step.output}
                      </pre>
                    ) : !hasError ? (
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No output.</p>
                    ) : null}
                  </>
                )}
                {view === 'system' && (
                  <pre className="whitespace-pre-wrap text-xs leading-relaxed font-mono p-3 rounded-lg"
                       style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', maxHeight: '300px', overflow: 'auto' }}>
                    {step.system_prompt || '(empty)'}
                  </pre>
                )}
                {view === 'user' && (
                  <pre className="whitespace-pre-wrap text-xs leading-relaxed font-mono p-3 rounded-lg"
                       style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', maxHeight: '300px', overflow: 'auto' }}>
                    {step.user_prompt || '(empty)'}
                  </pre>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}