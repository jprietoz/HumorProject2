'use client'

import { useState, useEffect } from 'react'

interface DomainRow { id: number; apex_domain: string; created_datetime_utc: string }

export default function AllowedDomainsPage() {
  const [domains, setDomains] = useState<DomainRow[]>([])
  const [loading, setLoading] = useState(true)
  const [newDomain, setNewDomain] = useState('')
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const load = () => {
    fetch('/api/admin/allowed-domains').then(r => r.json()).then(data => {
      setDomains(data); setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDomain.trim()) { setError('Domain is required'); return }
    setAdding(true); setError(null)
    try {
      const res = await fetch('/api/admin/allowed-domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apex_domain: newDomain.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to add')
      setNewDomain('')
      setDomains(prev => [...prev, json].sort((a, b) => a.apex_domain.localeCompare(b.apex_domain)))
      setSuccess('Domain added'); setTimeout(() => setSuccess(null), 3000)
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error') }
    finally { setAdding(false) }
  }

  const handleDelete = async (id: number, domain: string) => {
    if (!confirm(`Remove "${domain}" from allowed domains?`)) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/allowed-domains/${id}`, { method: 'DELETE' })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error) }
      setDomains(prev => prev.filter(d => d.id !== id))
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error') }
    finally { setDeletingId(null) }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Allowed Signup Domains</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Users can only sign up with emails from these domains
        </p>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#ef44441a', color: '#ef4444', border: '1px solid #ef444433' }}>{error}</div>}
      {success && <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#10b9811a', color: '#10b981', border: '1px solid #10b98133' }}>{success}</div>}

      {/* Add form */}
      <div className="card mb-6">
        <h2 className="text-sm font-semibold text-white mb-4">Add Domain</h2>
        <form onSubmit={handleAdd} className="flex gap-3">
          <input
            type="text"
            value={newDomain}
            onChange={e => setNewDomain(e.target.value)}
            placeholder="e.g. columbia.edu"
            className="flex-1 px-3 py-2 rounded-lg text-sm text-white outline-none"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
          />
          <button type="submit" disabled={adding} className="btn-primary disabled:opacity-50 whitespace-nowrap">
            {adding ? 'Adding…' : 'Add Domain'}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="card overflow-x-auto">
        {loading ? (
          <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>Loading…</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Domain', 'Added', ''].map(h => (
                  <th key={h} className="text-left pb-3 pr-4 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {domains.map((d, i) => (
                <tr key={d.id} style={{ borderBottom: i < domains.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td className="py-3 pr-4">
                    <span className="text-sm font-semibold text-white">{d.apex_domain}</span>
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap text-xs" style={{ color: 'var(--text-muted)' }}>
                    {new Date(d.created_datetime_utc).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => handleDelete(d.id, d.apex_domain)}
                      disabled={deletingId === d.id}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50"
                      style={{ background: '#ef44441a', color: '#ef4444', border: '1px solid #ef444433' }}
                    >
                      {deletingId === d.id ? '…' : 'Remove'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && !domains.length && (
          <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No allowed domains configured.</p>
        )}
      </div>
    </div>
  )
}
