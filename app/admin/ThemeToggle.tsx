'use client'

import { useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

function applyTheme(theme: Theme) {
  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', theme)
  }
  try { localStorage.setItem('admin-theme', theme) } catch {}
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('admin-theme') as Theme | null
      setTheme(stored === 'light' || stored === 'system' ? stored : 'dark')
    } catch {}
  }, [])

  const cycle = () => {
    const next: Theme = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark'
    setTheme(next)
    applyTheme(next)
  }

  const icon = theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '💻'
  const label = theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System'

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