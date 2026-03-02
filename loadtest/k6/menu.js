import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  vus: 50,
  duration: '60s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<400'],
  },
}

export default function () {
  const base = __ENV.BASE_URL || 'http://localhost:3002'
  const tenant = __ENV.TENANT || 'demo'
  const url = `${base.replace(/\\/$/, '')}/api/menu?tenant=${encodeURIComponent(tenant)}`
  const res = http.get(url, { headers: { 'Cache-Control': 'no-store' } })

  check(res, {
    'menu status 200/402/404 ok': (r) => [200, 402, 404].includes(r.status),
  })

  sleep(0.5)
}

