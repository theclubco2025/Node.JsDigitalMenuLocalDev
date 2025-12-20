#!/usr/bin/env node
import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  try {
    const tables = await prisma.$queryRawUnsafe(
      "select table_name from information_schema.tables where table_schema='public' order by table_name"
    )
    const migrationsTable = await prisma.$queryRawUnsafe(
      "select to_regclass('public._prisma_migrations')::text as migrations_table"
    )
    const tenantCount = await prisma.$queryRawUnsafe(
      "select count(*)::int as count from public.tenants"
    ).catch(() => [{ count: null }])

    console.log(JSON.stringify({ migrationsTable, tenantCount, tables }, null, 2))
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


