'use client'

import { useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  try { localStorage.setItem('admin-theme', theme) } catch {}
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('admin-theme') as Theme | null
      setTheme(stored === 'light' ? stored: 'dark')
      //'system' no longer exists as a valid theme, so reading it from storage should
        // fall back to 'dark' instead of being accepted.
    } catch {}
  }, [])

  const cycle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    // only have two states that toggle like : dark --> light --> dark
    setTheme(next)
    applyTheme(next)
  }

  const icon = theme === 'dark' ? '🌙' : '☀️'
  const label = theme === 'dark' ? 'Dark' : 'Light' // theme == dark else light

  return (
    <button
      onClick={cycle}
      title={`Theme: ${label} — click to cycle`}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
      style={{ color: 'var(--text-muted)', background: 'transparent' }}
    >
      <span className="text-base">{icon}</span>
      <span>{label}</span>
    </button>
  )
}