import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  vus: 100,
  duration: '60s',
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<500'],
  },
}

export default function () {
  const base = __ENV.BASE_URL || 'http://localhost:3002'
  const orderId = __ENV.ORDER_ID || ''
  if (!orderId) throw new Error('Set ORDER_ID env var')

  const url = `${base.replace(/\\/$/, '')}/api/orders/status?order=${encodeURIComponent(orderId)}&minimal=1`
  const res = http.get(url, { headers: { 'Cache-Control': 'no-store' } })

  check(res, {
    'status 200/404/429 ok': (r) => [200, 404, 429].includes(r.status),
  })

  sleep(0.5)
}

