import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Account deletion must run server-side with the service role:
// - there is no RLS DELETE policy on public.users (a client-side delete
//   silently affects zero rows), and
// - the auth.users record and uploaded files can only be removed by an admin.
// Deleting the auth user cascades to public.users, which cascades to
// contracts, contract_events, alerts_log, and user_settings.
export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Remove uploaded contract files (storage does not cascade with the DB)
  const { data: files } = await admin.storage.from('contracts').list(user.id, { limit: 1000 })
  if (files?.length) {
    await admin.storage
      .from('contracts')
      .remove(files.map(f => `${user.id}/${f.name}`))
  }

  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) {
    console.error('[account/delete] Failed to delete user:', error)
    return NextResponse.json({ error: 'Failed to delete account — please contact support' }, { status: 500 })
  }

  return NextResponse.json({ deleted: true })
}
