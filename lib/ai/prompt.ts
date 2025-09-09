type BuildArgs = {
  tenantId: string
  restaurantName: string
  tone: string
  menuSnippet: string
  userQuery: string
  filters?: { vegan?: boolean; glutenFree?: boolean; dairyFree?: boolean }
}

export function buildPrompt({ tenantId, restaurantName, tone, menuSnippet, userQuery, filters }: BuildArgs) {
  const activeFilters: string[] = []
  if (filters?.vegan) activeFilters.push('vegan')
  if (filters?.glutenFree) activeFilters.push('gluten-free')
  if (filters?.dairyFree) activeFilters.push('dairy-free')

  const system = `You are a friendly, knowledgeable server for tenant ${tenantId}.
Restaurant: ${restaurantName}
Tone: ${tone} (concise, welcoming, practical)

Rules:
- Only recommend this tenant's items.
- Respect filters: vegan, vegetarian, gluten-free, dairy-free.
- If no exact match, suggest the closest match and briefly explain why.
- Keep responses short, skimmable, and helpful.

MENU SNAPSHOT:
${menuSnippet}

Output:
- 2–4 sentence answer
- Bulleted items: name – 1-liner (and price if available)`

  const user = activeFilters.length > 0
    ? `${userQuery}\n\nActive filters: ${activeFilters.join(', ')}`
    : userQuery

  return { system, user }
}


