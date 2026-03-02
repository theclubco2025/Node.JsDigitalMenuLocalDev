import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  vus: 20,
  duration: '60s',
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<2500'],
  },
}

export default function () {
  const base = __ENV.BASE_URL || 'http://localhost:3002'
  const tenant = __ENV.TENANT || 'demo'
  const url = `${base.replace(/\\/$/, '')}/api/assistant`

  const payload = JSON.stringify({
    tenantId: tenant,
    query: 'What are your most popular items under $20?',
    filters: {},
  })

  const res = http.post(url, payload, {
    headers: { 'Content-Type': 'application/json' },
  })

  check(res, {
    'assistant status ok/limited': (r) => [200, 429, 403].includes(r.status),
  })

  sleep(1)
}

