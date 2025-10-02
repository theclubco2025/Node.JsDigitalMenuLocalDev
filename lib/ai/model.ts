// ESM provider adapter for LLaMA via Ollama or OpenAI-compatible APIs

type GenerateArgs = {
  model?: string | undefined
  system: string
  user: string
}

export async function generate({ model, system, user }: GenerateArgs): Promise<string> {
  const provider = (process.env.AI_PROVIDER || 'compatible').toLowerCase()
  const chosenModel = model || process.env.AI_MODEL || 'gpt-4o-mini'

  if (provider === 'ollama') {
    // Local Ollama chat API
    const base = process.env.AI_BASE_URL || 'http://localhost:11434'
    const res = await fetch(`${base.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'llama3',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        options: { temperature: 0.5, num_predict: 512 },
        stream: false,
      }),
    })
    if (!res.ok) throw new Error(`ollama error: ${res.status}`)
    const data = await res.json()
    const text = data?.message?.content ?? ''
    return typeof text === 'string' ? text : ''
  }

  // OpenAI-compatible chat completions with key pool + retries + timeout
  const baseUrl = (process.env.AI_BASE_URL || '').replace(/\/$/, '')
  const sanitizeKey = (k: string) => k.replace(/^['"]+|['"]+$/g, '').trim()
  const keys = (process.env.AI_KEYS || process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '')
    .split(',')
    .map(sanitizeKey)
    .filter(Boolean)
  if (keys.length === 0) {
    throw new Error('no-keys')
  }
  // global round-robin cursor across requests
  ;(globalThis as any).__ai_key_cursor = (globalThis as any).__ai_key_cursor ?? 0
  const startCursor: number = (globalThis as any).__ai_key_cursor
  // Expect base to end with /v1 or we append it
  const completionsUrl = baseUrl.endsWith('/v1')
    ? `${baseUrl}/chat/completions`
    : `${baseUrl || 'https://api.openai.com/v1'}/chat/completions`

  const payload = JSON.stringify({
    model: chosenModel,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0.5,
    max_tokens: 512,
  })

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12_000)
  let lastErr: any
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const apiKey = keys[(startCursor + attempt) % keys.length]
    try {
      const modelsToTry = Array.from(new Set([
        chosenModel,
        'gpt-4o-mini',
        'gpt-4o',
        'gpt-3.5-turbo',
      ].filter(Boolean)))

      for (const modelName of modelsToTry) {
        const body = JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          temperature: 0.5,
          max_tokens: 512,
        })
        const res = await fetch(completionsUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
            ...(process.env.OPENAI_PROJECT || process.env.AI_PROJECT
              ? { 'OpenAI-Project': String(process.env.OPENAI_PROJECT || process.env.AI_PROJECT) }
              : {}),
            ...(process.env.OPENAI_ORG || process.env.AI_ORG
              ? { 'OpenAI-Organization': String(process.env.OPENAI_ORG || process.env.AI_ORG) }
              : {}),
          },
          body,
          signal: controller.signal,
        })
        if (res.status === 401) {
          // Key lacks access; trying other models won’t help much, but continue to next model once
          lastErr = new Error(`ai provider error: 401`)
          continue
        }
        if (res.status === 404) {
          // Model not found under this key; try next fallback model
          lastErr = new Error(`ai provider error: 404`)
          continue
        }
        if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
          lastErr = new Error(`ai provider error: ${res.status}`)
          // switch to next key
          break
        }
        if (!res.ok) {
          lastErr = new Error(`ai provider error: ${res.status}`)
          continue
        }
        const data = await res.json()
        const text = data?.choices?.[0]?.message?.content ?? ''
        // advance cursor on success
        ;(globalThis as any).__ai_key_cursor = ((startCursor + attempt + 1) % keys.length)
        clearTimeout(timeout)
        return typeof text === 'string' ? text : ''
      }
    } catch (e) {
      lastErr = e
      continue
    }
  }
  clearTimeout(timeout)
  throw lastErr || new Error('ai provider error')
}


