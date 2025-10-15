### Domains & Path-based Routing (Live)

Live URL (QR)
- Use: `https://tccmenus.com/t/<slug>`
- You only need apex `tccmenus.com` and `www.tccmenus.com` on the Vercel project. No wildcard needed now.

Setup
1) Add `tccmenus.com` to the Vercel project (Apex + www) and point DNS to Vercel.
2) Middleware handles `/t/<slug>` → `/menu?tenant=<slug>`.
3) Generate QR: `node scripts/generate-qr.mjs <slug> https://tccmenus.com`.

Later (optional)
- Subdomain model: `https://<slug>.tccmenus.com` with wildcard DNS `*.tccmenus.com` on Pro. The same middleware can map subdomains to tenants.


