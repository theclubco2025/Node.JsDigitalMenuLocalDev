import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const slug = (process.argv[2] || '').trim()
if (!slug) {
  console.error('Usage: node scripts/enable-ordering.mjs <tenant-slug>')
  process.exit(1)
}

const ordering = {
  enabled: true,
  fulfillment: 'pickup',
  timezone: 'America/Los_Angeles',
  scheduling: { enabled: true, slotMinutes: 15, leadTimeMinutes: 30 },
  hours: null,
}

async function main() {
  const existing = await prisma.tenant.findUnique({ where: { slug }, select: { settings: true } })
  const settings = (existing?.settings && typeof existing.settings === 'object') ? existing.settings : {}
  const merged = { ...settings, ordering }
  await prisma.tenant.upsert({
    where: { slug },
    update: { settings: merged },
    create: { slug, name: slug, settings: merged },
  })
  console.log(`Enabled ordering for tenant: ${slug}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {})
  })

