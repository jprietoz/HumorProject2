import { createClient } from '@/lib/auth-client-server'
import { createAdminClient } from '@/lib/supabase-admin'

export interface AdminUser {
  id: string
  email?: string
}

/**
 * Returns the authenticated user if they are is_superadmin OR is_matrix_admin.
 * Returns null if unauthenticated or unauthorized.
 */
export async function assertAdmin(): Promise<AdminUser | null> {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return null

  const db = createAdminClient()
  const { data: profile } = await db
    .from('profiles')
    .select('is_superadmin, is_matrix_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_superadmin && !profile?.is_matrix_admin) return null
  return { id: user.id, email: user.email }
}