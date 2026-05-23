export function buildPersonalisationContext(data: {
  businessType: string
  industry: string
  contractTypes: string[]
  biggestHeadache: string
  contractVolume: string
}): string {
  const typeLabel: Record<string, string> = {
    sole_trader: 'sole trader',
    partnership: 'partnership',
    company: 'company',
    trust: 'trust',
  }

  const parts: string[] = []

  if (data.businessType && data.industry) {
    parts.push(`This user operates as a ${typeLabel[data.businessType] ?? data.businessType} in the ${data.industry} industry in Australia.`)
  } else if (data.industry) {
    parts.push(`This user works in the ${data.industry} industry in Australia.`)
  } else if (data.businessType) {
    parts.push(`This user is a ${typeLabel[data.businessType] ?? data.businessType} business in Australia.`)
  }

  if (data.contractVolume) {
    parts.push(`They manage approximately ${data.contractVolume} contracts at a time.`)
  }

  if (data.contractTypes.length > 0) {
    parts.push(`They primarily deal with: ${data.contractTypes.join(', ')}.`)
  }

  if (data.biggestHeadache) {
    parts.push(`Their main contract concern is: ${data.biggestHeadache.toLowerCase()}.`)
  }

  const industryGuidance: Record<string, string> = {
    'Construction/Trades': 'Pay special attention to QBCC licensing requirements, subcontractor payment terms under the Building Industry Fairness (Security of Payment) Act, retention clauses, defects liability periods, and head contractor obligations.',
    'Hospitality/Café/Restaurant': 'Flag commercial lease terms especially demolition and redevelopment clauses, CPI rent reviews, supplier agreements, liquor licensing conditions, and any personal guarantee provisions.',
    'Retail': 'Highlight restrictive lease clauses, exclusivity provisions, supplier payment terms, obligations under Australian Consumer Law, and franchise agreement terms if applicable.',
    'Professional Services': 'Note IP ownership clauses, confidentiality and non-compete terms, liability caps relative to engagement value, and professional indemnity insurance requirements.',
    'Healthcare': 'Flag Privacy Act and Australian Privacy Principles compliance, patient data handling requirements, Medicare provider obligations, professional registration conditions, and indemnity requirements.',
    'Real Estate': 'Highlight cooling-off periods, vendor and purchaser disclosure requirements, commission structures, property management fee terms, and trust accounting obligations.',
    'Transport/Logistics': 'Note liability limitations, dangerous goods requirements, chain of responsibility obligations under the Heavy Vehicle National Law, and subcontractor and owner-driver terms.',
    'Creative/Marketing': 'Flag IP ownership and assignment clauses, moral rights provisions, usage license scope and duration, kill fees, revision limits, and confidentiality obligations.',
    'Technology': 'Highlight IP ownership and assignment, data privacy and storage obligations under the Privacy Act and APPs, SLA uptime commitments and remedies, liability caps, and source code escrow provisions.',
  }

  const guidance = industryGuidance[data.industry]
  if (guidance) parts.push(guidance)

  parts.push('Always explain legal concepts in plain English suitable for a small business owner without a legal background, and specifically flag any terms that are unusual, unusually one-sided, or could be financially harmful to this user.')

  return parts.join(' ')
}
