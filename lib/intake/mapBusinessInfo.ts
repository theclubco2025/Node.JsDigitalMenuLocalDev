type Intake = {
  legalName?: string
  displayName?: string
  website?: string
  address?: { line1?: string; city?: string; region?: string; postal?: string }
  hours?: Array<{ day: string; open: string; close: string }>
  cuisine?: string[]
  tone?: string[]
  priceBand?: string
  logoUrl?: string
}

export function mapToTheme(intake: Intake) {
  const tone = (intake.tone || []).map(t => t.toLowerCase())
  const cuisine = (intake.cuisine || []).map(c => c.toLowerCase())
  const upscale = tone.includes('upscale') || tone.includes('elevated')
  const modern = tone.includes('modern') || cuisine.includes('japanese') || cuisine.includes('fusion')
  const casual = tone.includes('casual') || tone.includes('family')
  if (upscale) return { name: intake.displayName || 'Restaurant', tone: 'upscale', primary: '#0b0b0b', accent: '#d4af37', radius: '12px' }
  if (modern) return { name: intake.displayName || 'Restaurant', tone: 'modern', primary: '#0b0b0b', accent: '#2563eb', radius: '10px' }
  if (casual) return { name: intake.displayName || 'Restaurant', tone: 'casual', primary: '#111827', accent: '#22c55e', radius: '8px' }
  return { name: intake.displayName || 'Restaurant', tone: 'neutral', primary: '#0b0b0b', accent: '#d4af37', radius: '10px' }
}

export function mapToWeights(intake: Intake) {
  const cuisine = (intake.cuisine || []).map(c => c.toLowerCase())
  const tags: Record<string, number> = {}
  for (const c of cuisine) {
    tags[c] = (tags[c] || 0) + 1
  }
  return { tags }
}

export function suggestTags(intake: Intake): string[] {
  const out = new Set<string>()
  for (const c of intake.cuisine || []) out.add(c.toLowerCase())
  for (const t of intake.tone || []) out.add(t.toLowerCase())
  if (intake.priceBand) out.add(intake.priceBand)
  return Array.from(out)
}


