'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/auth-client-browser'
import ThemeToggle from './ThemeToggle'

export default function AdminTopBar() {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div
      className="flex items-center justify-end gap-2 px-6 py-3 border-b shrink-0"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
    >
      <ThemeToggle />
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
        style={{ color: 'var(--text-muted)' }}
      >
        {loggingOut ? 'Signing out…' : '→ Sign out'}
      </button>
    </div>
  )
}