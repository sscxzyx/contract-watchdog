import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from './SettingsClient'
import type { User, UserSettings } from '@/types/database'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: settings }] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('user_settings').select('*').eq('user_id', user.id).single(),
  ])

  return (
    <SettingsClient
      userId={user.id}
      authEmail={user.email ?? ''}
      profile={profile as User}
      settings={settings as UserSettings}
    />
  )
}
