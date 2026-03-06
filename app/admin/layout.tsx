import { redirect } from 'next/navigation'
import { createClient } from '@/lib/auth-client-server'
import { createAdminClient } from '@/lib/supabase-admin'
import AdminNav from './AdminNav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 1. Check the user is authenticated
  const authClient = await createClient()
  const { data: { user }, error } = await authClient.auth.getUser()

  if (!user || error) {
    redirect('/login')
  }

  // 2. Check superadmin status using the admin (service-role) client to bypass RLS
  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('is_superadmin, first_name, last_name, email')
    .eq('id', user.id)
    .single()

  if (!profile?.is_superadmin) {
    redirect('/unauthorized')
  }

  const displayName = profile.first_name
    ? `${profile.first_name} ${profile.last_name ?? ''}`.trim()
    : (profile.email ?? user.email ?? 'Admin')

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      <AdminNav userEmail={user.email ?? ''} displayName={displayName} />
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
