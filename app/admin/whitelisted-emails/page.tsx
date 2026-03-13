'use client'

import { useState, useEffect } from 'react'

interface EmailRow { id: number; email_address: string; created_datetime_utc: string; modified_datetime_utc: string | null }

export default function WhitelistedEmailsPage() {
  const [emails, setEmails] = useState<EmailRow[]>([])
  const [loading, setLoading] = useState(true)
  const [newEmail, setNewEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/whitelisted-emails').then(r => r.json()).then(data => {
      setEmails(data); setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail.trim()) { setError('Email is required'); return }
    setAdding(true); setError(null)
    try {
      const res = await fetch('/api/admin/whitelisted-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_address: newEmail.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to add')
      setNewEmail('')
      setEmails(prev => [...prev, json].sort((a, b) => a.email_address.localeCompare(b.email_address)))
      setSuccess('Email added'); setTimeout(() => setSuccess(null), 3000)
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error') }
    finally { setAdding(false) }
  }

  const handleDelete = async (id: number, email: string) => {
    if (!confirm(`Remove "${email}" from whitelist?`)) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/whitelisted-emails/${id}`, { method: 'DELETE' })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error) }
      setEmails(prev => prev.filter(e => e.id !== id))
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error') }
    finally { setDeletingId(null) }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Whitelisted Email Addresses</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Specific email addresses allowed to sign up regardless of domain
        </p>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#ef44441a', color: '#ef4444', border: '1px solid #ef444433' }}>{error}</div>}
      {success && <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#10b9811a', color: '#10b981', border: '1px solid #10b98133' }}>{success}</div>}

      {/* Add form */}
      <div className="card mb-6">
        <h2 className="text-sm font-semibold text-white mb-4">Add Email</h2>
        <form onSubmit={handleAdd} className="flex gap-3">
          <input
            type="email"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            placeholder="e.g. user@gmail.com"
            className="flex-1 px-3 py-2 rounded-lg text-sm text-white outline-none"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
          />
          <button type="submit" disabled={adding} className="btn-primary disabled:opacity-50 whitespace-nowrap">
            {adding ? 'Adding…' : 'Add Email'}
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
                {['Email Address', 'Added', ''].map(h => (
                  <th key={h} className="text-left pb-3 pr-4 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {emails.map((e, i) => (
                <tr key={e.id} style={{ borderBottom: i < emails.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td className="py-3 pr-4">
                    <span className="text-sm text-white">{e.email_address}</span>
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap text-xs" style={{ color: 'var(--text-muted)' }}>
                    {new Date(e.created_datetime_utc).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => handleDelete(e.id, e.email_address)}
                      disabled={deletingId === e.id}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50"
                      style={{ background: '#ef44441a', color: '#ef4444', border: '1px solid #ef444433' }}
                    >
                      {deletingId === e.id ? '…' : 'Remove'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && !emails.length && (
          <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No whitelisted emails.</p>
        )}
      </div>
    </div>
  )
}
