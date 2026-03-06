'use client'

import { createClient } from '@/lib/auth-client-browser'
import { useRouter } from 'next/navigation'

export default function UnauthorizedPage() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-3xl font-bold text-white mb-3">Access Denied</h1>
        <p className="mb-8" style={{ color: 'var(--text-muted)' }}>
          Your account does not have superadmin privileges. Contact an existing administrator to grant access.
        </p>
        <button
          onClick={handleLogout}
          className="btn-danger px-6 py-3"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
