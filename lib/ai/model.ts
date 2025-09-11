// ESM provider adapter for LLaMA via Ollama or OpenAI-compatible APIs

type GenerateArgs = {
  model?: string | undefined
  system: string
  user: string
}

export async function generate({ model, system, user }: GenerateArgs): Promise<string> {
  const provider = (process.env.AI_PROVIDER || 'compatible').toLowerCase()
  const chosenModel = model || process.env.AI_MODEL || 'llama-3.1-8b-instruct'

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

  // OpenAI-compatible chat completions with key pool + retries
  const baseUrl = (process.env.AI_BASE_URL || '').replace(/\/$/, '')
  const keys = (process.env.AI_KEYS ?? process.env.AI_API_KEY ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
  const pool = keys.length > 0 ? keys : ['']
  const rr = (() => {
    let i = 0
    return () => pool[i++ % pool.length]
  })()
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
  for (let attempt = 0; attempt < pool.length; attempt++) {
    const apiKey = rr()
    try {
      const res = await fetch(completionsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: payload,
        signal: controller.signal,
      })
      if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
        lastErr = new Error(`ai provider error: ${res.status}`)
        continue
      }
      if (!res.ok) throw new Error(`ai provider error: ${res.status}`)
      const data = await res.json()
      const text = data?.choices?.[0]?.message?.content ?? ''
      clearTimeout(timeout)
      return typeof text === 'string' ? text : ''
    } catch (e) {
      lastErr = e
      continue
    }
  }
  clearTimeout(timeout)
  throw lastErr || new Error('ai provider error')
}


