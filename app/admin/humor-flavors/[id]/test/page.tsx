'use client'

import { useState, use } from 'react'
import Link from 'next/link'

export default function TestFlavorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ imageId: string; result: unknown } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null); setResult(null)

    try {
      const res = await fetch(`/api/admin/humor-flavors/${id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: imageUrl }),
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

  const inputStyle = { background: 'var(--input-bg)', border: '1px solid var(--border)' }

  // Try to extract a captions array from whatever the API returns
  const captions: string[] = (() => {
    if (!result) return []
    const r = result.result as Record<string, unknown>
    if (Array.isArray(r)) return r.map(c =>
      typeof c === 'string' ? c : (c as Record<string, unknown>)?.content as string ?? JSON.stringify(c)
    )
    if (Array.isArray(r?.captions)) return (r.captions as unknown[]).map(c =>
      typeof c === 'string' ? c : (c as Record<string, unknown>)?.content as string ?? JSON.stringify(c)
    )
    return []
  })()

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/humor-flavors" className="text-sm" style={{ color: 'var(--text-muted)' }}>← Humor Flavors</Link>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <Link href={`/admin/humor-flavors/${id}`} className="text-sm" style={{ color: 'var(--text-muted)' }}>Edit</Link>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <h1 className="text-xl font-bold text-white">Test via Pipeline</h1>
      </div>

      {/* Info banner */}
      <div className="mb-6 p-3 rounded-lg text-xs" style={{ background: 'rgba(59,130,246,0.1)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.25)' }}>
        Captions are generated using the active flavor configured in{' '}
        <Link href="/admin/humor-mix" className="underline">Humor Mix</Link>.
        Make sure the flavor you want to test is set there before running.
      </div>

      {/* Input form */}
      <div className="card mb-6">
        <h2 className="text-sm font-semibold text-white mb-4">Image Input</h2>
        <form onSubmit={handleTest} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: '#ef44441a', color: '#ef4444', border: '1px solid #ef444433' }}>
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">
              Image URL
              <span className="text-xs ml-2 font-normal" style={{ color: 'var(--text-muted)' }}>
                publicly accessible URL
              </span>
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              required
              placeholder="https://…"
              className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
              style={inputStyle}
            />
          </div>
          <button type="submit" disabled={loading || !imageUrl} className="btn-primary disabled:opacity-50">
            {loading ? 'Generating…' : 'Generate Captions'}
          </button>
        </form>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white">Results</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              imageId: {result.imageId}
            </span>
          </div>

          {/* Parsed captions */}
          {captions.length > 0 ? (
            <div className="card space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Captions</h3>
              {captions.map((c, i) => (
                <div key={i} className="p-3 rounded-lg text-sm text-white" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                  <span className="text-xs mr-2 font-semibold" style={{ color: '#8b5cf6' }}>{i + 1}.</span>
                  {c}
                </div>
              ))}
            </div>
          ) : null}

          {/* Raw API response */}
          <div className="card">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Raw API Response</h3>
            <pre className="text-xs leading-relaxed font-mono overflow-auto max-h-96 p-3 rounded-lg"
                 style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
              {JSON.stringify(result.result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}