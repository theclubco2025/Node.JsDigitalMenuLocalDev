const OUT_OF_SCOPE_KEYWORDS = [
  'politic',
  'election',
  'government',
  'president',
  'stock',
  'market',
  'finance',
  'investment',
  'weather',
  'forecast',
  'news',
  'sports',
  'celebrity',
  'gossip',
  'medical',
  'diagnose',
  'symptom',
  'legal',
  'lawyer',
  'recipe',
  'cook',
  'instructions',
  'chemistry',
  'math',
  'homework',
  'travel',
  'airline',
  'hotel',
];

const SCOPE_REFUSAL_MESSAGE = "I can only answer based on this restaurant’s official menu and business info.";

export type GuardrailResult = {
  allow: boolean;
  reason?: 'out_of_scope' | 'insufficient_data';
};

export function enforce(question: string, contextAvailable: boolean): GuardrailResult {
  const normalized = (question || '').toLowerCase();

  if (!contextAvailable) {
    return { allow: false, reason: 'insufficient_data' };
  }

  if (OUT_OF_SCOPE_KEYWORDS.some(keyword => normalized.includes(keyword))) {
    return { allow: false, reason: 'out_of_scope' };
  }

  return { allow: true };
}

export function refusalMessage(): string {
  return SCOPE_REFUSAL_MESSAGE;
}

export const SCOPE_NOTE = 'Answers are based only on this restaurant’s official menu and business information.';


