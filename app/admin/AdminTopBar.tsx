'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/auth-client-browser'
import ThemeToggle from './ThemeToggle'

interface AdminTopBarProps {
  userEmail: string
  displayName: string
}

export default function AdminTopBar({ userEmail, displayName }: AdminTopBarProps) {
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
      {/* User info */}
      <div className="flex flex-col items-end">
        <p className="text-xs font-semibold text-white truncate">{displayName}</p>
        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{userEmail}</p>
      </div>
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded text-xs shadow-md transition duration-150 ease-in-out whitespace-nowrap"
      >
        {loggingOut ? 'Signing out…' : 'Sign Out'}
      </button>
    </div>
  )
}