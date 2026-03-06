/**
 * Bootstrap script — grants is_superadmin=true to a user by email.
 *
 * Uses the service role key (which bypasses RLS) already present in .env.local.
 * This lets Claude Code grant superadmin access without touching Supabase's dashboard
 * or modifying any RLS policies.
 *
 * Usage:
 *   npx tsx scripts/bootstrap-superadmin.ts your-email@gmail.com
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const email = process.argv[2]
if (!email) {
  console.error('Usage: npx tsx scripts/bootstrap-superadmin.ts <email>')
  process.exit(1)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey || serviceRoleKey === 'your-service-role-key-here') {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY is not set in .env.local')
  console.error('Add it from: Supabase Dashboard → Project Settings → API → service_role key')
  process.exit(1)
}

const db = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function run() {
  console.log(`Looking up profile for: ${email}`)

  const { data: profile, error } = await db
    .from('profiles')
    .update({ is_superadmin: true })
    .eq('email', email)
    .select('id, email, is_superadmin')
    .single()

  if (error || !profile) {
    console.error('Profile not found or update failed:', error?.message)
    console.error('Make sure you have signed in with Google at least once first.')
    process.exit(1)
  }

  console.log('✓ Success!')
  console.log(`  Profile ${profile.id} → is_superadmin = ${profile.is_superadmin}`)
}

run()