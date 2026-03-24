'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Step {
  id: number
  order_by: number
  description: string | null
  llm_temperature: number | null
  humor_flavor_id: number
  llm_model_id: number | null
  humor_flavor_step_type_id: number | null
  created_datetime_utc: string
  humor_flavors: { slug: string } | { slug: string }[] | null
  llm_models: { name: string } | { name: string }[] | null
  humor_flavor_step_types: { slug: string } | { slug: string }[] | null
}

function getSlug(val: { slug: string } | { slug: string }[] | null) {
  if (!val) return null
  return Array.isArray(val) ? (val[0]?.slug ?? null) : val.slug
}
function getName(val: { name: string } | { name: string }[] | null) {
  if (!val) return null
  return Array.isArray(val) ? (val[0]?.name ?? null) : val.name
}

export default function HumorFlavorStepsPage() {
  const [allSteps, setAllSteps] = useState<Step[]>([])
  const [flavors, setFlavors] = useState<{ id: number; slug: string }[]>([])
  const [filterFlavorId, setFilterFlavorId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [reordering, setReordering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/admin/humor-flavor-steps').then(r => r.json()),
      fetch('/api/admin/humor-flavors').then(r => r.json()),
    ]).then(([stepsData, flavorsData]) => {
      setAllSteps(stepsData)
      setFlavors(flavorsData)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const steps = filterFlavorId
    ? allSteps.filter(s => String(s.humor_flavor_id) === filterFlavorId)
    : allSteps

  const moveStep = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= steps.length) return

    // Only reorder within the same flavor
    if (steps[index].humor_flavor_id !== steps[targetIndex].humor_flavor_id) return

    setReordering(true)
    setError(null)
    try {
      const a = steps[index]
      const b = steps[targetIndex]
      const res = await fetch('/api/admin/humor-flavor-steps/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steps: [
            { id: a.id, order_by: b.order_by },
            { id: b.id, order_by: a.order_by },
          ],
        }),
      })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error) }
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reorder failed')
    } finally {
      setReordering(false)
    }
  }

  if (loading) return (
    <div className="max-w-7xl mx-auto">
      <div className="card"><p style={{ color: 'var(--text-muted)' }}>Loading…</p></div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Humor Flavor Steps</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {steps.length} step{steps.length !== 1 ? 's' : ''}
            {filterFlavorId ? ` in selected flavor` : ' total'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterFlavorId}
            onChange={e => setFilterFlavorId(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm text-white outline-none"
            style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}
          >
            <option value="">All flavors</option>
            {flavors.map(f => (
              <option key={f.id} value={String(f.id)}>{f.slug}</option>
            ))}
          </select>
          <Link href="/admin/humor-flavor-steps/new" className="btn-primary whitespace-nowrap">+ Add Step</Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#ef44441a', color: '#ef4444', border: '1px solid #ef444433' }}>
          {error}
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Order', 'Flavor', 'Type', 'Model', 'Temp', 'Description', 'Created', ''].map(h => (
                <th key={h} className="text-left pb-3 pr-4 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {steps.map((s, i) => {
              const flavorSlug = getSlug(s.humor_flavors)
              const modelName = getName(s.llm_models)
              const stepTypeSlug = getSlug(s.humor_flavor_step_types)

              // Determine if up/down within this flavor group are valid
              const prevSameFlavor = i > 0 && steps[i - 1].humor_flavor_id === s.humor_flavor_id
              const nextSameFlavor = i < steps.length - 1 && steps[i + 1].humor_flavor_id === s.humor_flavor_id

              return (
                <tr key={s.id} className="table-row" style={{ borderBottom: i < steps.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold text-white w-6 text-center">{s.order_by}</span>
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => moveStep(i, -1)}
                          disabled={reordering || !prevSameFlavor}
                          title="Move up"
                          className="text-xs px-1 rounded disabled:opacity-20"
                          style={{ color: 'var(--text-muted)', lineHeight: 1 }}
                        >▲</button>
                        <button
                          onClick={() => moveStep(i, 1)}
                          disabled={reordering || !nextSameFlavor}
                          title="Move down"
                          className="text-xs px-1 rounded disabled:opacity-20"
                          style={{ color: 'var(--text-muted)', lineHeight: 1 }}
                        >▼</button>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-xs font-mono font-semibold" style={{ color: '#8b5cf6' }}>
                      {flavorSlug ?? '—'}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-xs font-mono" style={{ color: '#3b82f6' }}>{stepTypeSlug ?? '—'}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-xs text-white">{modelName ?? '—'}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {s.llm_temperature != null ? s.llm_temperature : '—'}
                    </span>
                  </td>
                  <td className="py-3 pr-4 max-w-xs">
                    <p className="text-xs text-white line-clamp-1">{s.description ?? '—'}</p>
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap text-xs" style={{ color: 'var(--text-muted)' }}>
                    {new Date(s.created_datetime_utc).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                  </td>
                  <td className="py-3">
                    <Link href={`/admin/humor-flavor-steps/${s.id}`}
                          className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                          style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                      Edit
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!steps.length && (
          <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
            {filterFlavorId ? 'No steps for this flavor.' : 'No flavor steps found.'}
          </p>
        )}
      </div>
    </div>
  )
}