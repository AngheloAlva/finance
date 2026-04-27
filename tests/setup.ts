import { afterAll, beforeEach } from "vitest"
import { prisma } from "@/shared/lib/prisma"

const PROTECTED_TABLES = new Set(["_prisma_migrations"])

async function truncateAll() {
  const rows = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `
  const tables = rows
    .map((r) => r.tablename)
    .filter((name) => !PROTECTED_TABLES.has(name))
    .map((name) => `"public"."${name}"`)

  if (tables.length === 0) return

  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tables.join(", ")} RESTART IDENTITY CASCADE`,
  )
}

beforeEach(async () => {
  await truncateAll()
})

afterAll(async () => {
  await prisma.$disconnect()
})
