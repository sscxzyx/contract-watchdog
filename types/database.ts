export type PlanTier = 'free' | 'starter' | 'business' | 'agency'
export type ContractStatus = 'active' | 'expiring_soon' | 'expired' | 'needs_review'
export type RiskLevel = 'low' | 'medium' | 'high'
export type BusinessType = 'sole_trader' | 'partnership' | 'company' | 'trust'
export type ContractVolume = '1-5' | '5-20' | '20-50' | '50+'
export type NotificationPref = 'email_only' | 'email_sms' | 'in_app_only'

export interface User {
  id: string
  email: string
  full_name: string | null
  company_name: string | null
  industry: string | null
  plan_tier: PlanTier
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  free_scan_reset_at: string | null
  onboarding_complete: boolean
  business_type: BusinessType | null
  contract_volume: ContractVolume | null
  contract_types: string[]
  biggest_headache: string | null
  caught_out: string | null
  personalisation_context: string | null
  created_at: string
}

export interface RiskFlag {
  severity: RiskLevel
  description: string
}

export interface KeyDate {
  label: string
  date: string
}

export interface AiAnalysis {
  contract_type: string | null
  counterparty_name: string | null
  start_date: string | null
  end_date: string | null
  renewal_date: string | null
  notice_deadline: string | null
  contract_value: number | null
  value_currency: string | null
  importance_score: number | null
  health_score: number | null
  risk_level: RiskLevel | null
  ai_summary: string | null
  risk_flags: RiskFlag[]
  obligations_ours: string[]
  obligations_theirs: string[]
  cancellation_terms: string | null
  renewal_terms: string | null
  key_dates: KeyDate[]
}

export interface Contract {
  id: string
  user_id: string
  file_name: string
  file_url: string
  contract_name: string
  counterparty_name: string | null
  contract_type: string | null
  status: ContractStatus
  start_date: string | null
  end_date: string | null
  renewal_date: string | null
  notice_deadline: string | null
  contract_value: number | null
  value_currency: string | null
  value_extracted: boolean
  importance_score: number | null
  health_score: number | null
  risk_level: RiskLevel | null
  ai_summary: string | null
  ai_analysis_json: AiAnalysis | null
  created_at: string
}

export interface ContractEvent {
  id: string
  contract_id: string
  user_id: string
  event_type: string
  event_date: string
  event_label: string
  created_at: string
}

export interface AlertLog {
  id: string
  contract_id: string
  user_id: string
  sent_at: string
  alert_type: string
  days_before: number
}

export interface UserSettings {
  user_id: string
  alert_days_before: number[]
  email_alerts_enabled: boolean
  extra_recipients: string[]
  notification_preference: NotificationPref
  phone_number: string | null
  updated_at: string
}
