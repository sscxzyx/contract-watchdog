import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ContractDetailClient from './ContractDetailClient'
import type { Contract, ContractEvent, AlertLog } from '@/types/database'

export default async function ContractDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const [{ data: contract }, { data: events }, { data: alerts }] = await Promise.all([
    supabase.from('contracts').select('*').eq('id', params.id).single(),
    supabase.from('contract_events').select('*').eq('contract_id', params.id).order('event_date', { ascending: true }),
    supabase.from('alerts_log').select('*').eq('contract_id', params.id).order('sent_at', { ascending: false }),
  ])

  if (!contract) notFound()

  let signedUrl: string | null = null
  if (contract.file_url) {
    const { data } = await supabase.storage
      .from('contracts')
      .createSignedUrl(contract.file_url, 3600)
    signedUrl = data?.signedUrl ?? null
  }

  return (
    <ContractDetailClient
      contract={contract as Contract}
      events={(events ?? []) as ContractEvent[]}
      alerts={(alerts ?? []) as AlertLog[]}
      signedUrl={signedUrl}
    />
  )
}
