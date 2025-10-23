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
- Respect filters: vegan, vegetarian, gluten-free, dairy-free. If a filter is active and nothing matches, say so explicitly.
- Focus on exact matches first. Only reference other items if there truly is no direct match in the MENU SNAPSHOT.
- Keep responses short, skimmable, and helpful.
- Do not invent dishes or prices. If an item is not in the MENU SNAPSHOT, say it's not available.
- Use exact item names as they appear in the MENU SNAPSHOT.
- If the user asks about a style (e.g. "vegetarian fettucine"), map it to the closest on-menu item and explain the mapping in one short line.

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


