# QR & Subdomains (future deploy)

- Subdomains: configure Vercel wildcard (e.g., `*.yourdomain.com`).
- Tenant resolution: parse subdomain → `tenantId`; fallback to query param.
- Example: `https://acme.yourdomain.com/menu` → resolves `tenantId=acme`.
- QR generation should encode the final URL per tenant (subdomain in prod, query in dev).
- Current dev QR uses: `http://localhost:3001/menu?tenant=<id>`.
