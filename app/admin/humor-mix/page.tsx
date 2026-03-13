'use client'

import { useEffect, useState } from 'react'

interface HumorMixRow {
  id: number
  humor_flavor_id: number
  caption_count: number
  created_datetime_utc: string
  humor_flavors: { slug: string } | null
}

export default function HumorMixPage() {
  const [rows, setRows] = useState<HumorMixRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<{ id: number; value: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/humor-mix')
      .then(r => r.json())
      .then(data => { setRows(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async (id: number) => {
    if (!editing) return
    const newCount = parseInt(editing.value, 10)
    if (isNaN(newCount) || newCount < 0) { setError('Caption count must be a non-negative integer'); return }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/humor-mix/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption_count: newCount }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to update')
      setRows(prev => prev.map(r => r.id === id ? { ...r, caption_count: newCount } : r))
      setEditing(null)
      setSuccess('Updated successfully')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Humor Mix</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Caption count per humor flavor in the mix
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#ef44441a', color: '#ef4444', border: '1px solid #ef444433' }}>
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#10b9811a', color: '#10b981', border: '1px solid #10b98133' }}>
          {success}
        </div>
      )}

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>Loading…</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['ID', 'Humor Flavor', 'Caption Count', 'Created', ''].map(h => (
                  <th key={h} className="text-left pb-3 pr-4 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const isEditing = editing?.id === r.id
                const flavor = r.humor_flavors
                return (
                  <tr key={r.id} style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td className="py-3 pr-4">
                      <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{r.id}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-xs font-mono font-semibold" style={{ color: '#8b5cf6' }}>
                        {flavor?.slug ?? r.humor_flavor_id}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editing.value}
                          onChange={e => setEditing({ id: r.id, value: e.target.value })}
                          className="px-2 py-1 rounded text-sm text-white w-24 outline-none"
                          style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
                          min={0}
                        />
                      ) : (
                        <span className="font-semibold text-sm" style={{ color: '#10b981' }}>{r.caption_count}</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap text-xs" style={{ color: 'var(--text-muted)' }}>
                      {new Date(r.created_datetime_utc).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                    </td>
                    <td className="py-3">
                      {isEditing ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSave(r.id)}
                            disabled={saving}
                            className="text-xs px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50"
                            style={{ background: '#8b5cf6', color: 'white' }}
                          >
                            {saving ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditing(null)}
                            className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                            style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditing({ id: r.id, value: String(r.caption_count) })}
                          className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                          style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {!loading && !rows.length && (
          <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No humor mix entries found.</p>
        )}
      </div>
    </div>
  )
}
