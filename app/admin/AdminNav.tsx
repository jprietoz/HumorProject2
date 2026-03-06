'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/auth-client-browser'
import { useState } from 'react'

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/images', label: 'Images', icon: '🖼️' },
  { href: '/admin/captions', label: 'Captions', icon: '💬' },
]

interface AdminNavProps {
  userEmail: string
  displayName: string
}

export default function AdminNav({ userEmail, displayName }: AdminNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const supabase = createClient()

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside
      className="w-60 shrink-0 flex flex-col border-r py-6 px-4"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-2 mb-8">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}
        >
          ⚡
        </div>
        <span className="font-bold text-white text-sm">Humor Admin</span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: active ? 'rgba(139,92,246,0.15)' : 'transparent',
                color: active ? '#8b5cf6' : 'var(--text-muted)',
              }}
            >
              <span>{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User info + logout */}
      <div className="border-t pt-4 mt-4" style={{ borderColor: 'var(--border)' }}>
        <div className="px-2 mb-3">
          <p className="text-xs font-semibold text-white truncate">{displayName}</p>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{userEmail}</p>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
          style={{ color: 'var(--text-muted)' }}
        >
          {loggingOut ? 'Signing out…' : '→ Sign out'}
        </button>
      </div>
    </aside>
  )
}
