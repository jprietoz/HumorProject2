import { redirect } from 'next/navigation'
import { createClient } from '@/lib/auth-client-server'
import { createAdminClient } from '@/lib/supabase-admin'
import AdminNav from './AdminNav'
import AdminTopBar from './AdminTopBar'

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

  // 2. Check admin status using the admin (service-role) client to bypass RLS
  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('is_superadmin, is_matrix_admin, first_name, last_name, email')
    .eq('id', user.id)
    .single()

  // Must be a superadmin OR matrix_admin AND have a Columbia/Barnard UNI email
  const email = profile?.email ?? user.email ?? ''
  const isApprovedEmail = /^[a-z]+\d+@(columbia|barnard)\.edu$/i.test(email)
  const isAdmin = profile?.is_superadmin || profile?.is_matrix_admin

  if (!isAdmin || !isApprovedEmail) {
    redirect('/unauthorized')
  }

  const displayName = profile.first_name
    ? `${profile.first_name} ${profile.last_name ?? ''}`.trim()
    : (profile.email ?? user.email ?? 'Admin')

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      <AdminNav userEmail={user.email ?? ''} displayName={displayName} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminTopBar />
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
