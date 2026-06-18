import type { Metadata } from 'next'
import { Landing } from '@/components/marketing/Landing'

export const metadata: Metadata = {
  title: 'Controva',
  description: 'AI-powered contract monitoring for Australian small businesses. Upload your contracts and Controva watches every deadline, flags every risk, and alerts you before it\'s too late.',
}

export default function HomePage() {
  return <Landing />
}
