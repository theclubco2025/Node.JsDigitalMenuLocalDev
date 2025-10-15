### Vercel Preview & Draft Workflow (Path-first)

- Draft branches: name as `<slug>-draft` (e.g., `buttercup-pantry-draft`).
- Preview URL format: `https://<project>-git-<slug-draft>-<team>.vercel.app/menu`.
- Middleware auto-derives the tenant from the host/branch; no `tenant` query needed.

Deployment protection
- If enabled, set the bypass cookie once per browser using the token: the seed script will do a warm request with `__Secure-vercel-bypass=<TOKEN>`.
- Do not use preview URLs for QR codes.

Seeding a draft in preview
- Seed: `node scripts/seed-tenant.mjs --slug <slug-draft> --admin <ADMIN_TOKEN> --bypass <TOKEN?> --base https://<preview-host>`
- Verify: `node scripts/verify-tenant.mjs --slug <slug-draft> --base https://<preview-host>`

Promoting to live (no redeploy)
- `node scripts/promote-tenant.mjs --from <slug-draft> --to <slug> --admin <ADMIN_TOKEN> --base https://<preview-host>`
- Live path (production domain): `https://tccmenus.com/t/<slug>`

Notes
- Preview URLs change per branch and commit; use only for internal review.
- Live path `/t/<slug>` is stable for QR and does not change for data edits or redeploys.


