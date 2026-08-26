import { PrismaClient } from '@prisma/client'

// Use a versioned cache key so that when the Prisma schema changes (e.g. a new
// model or field is added) and `prisma generate` runs, the dev server picks up a
// fresh client instance instead of reusing a stale one that predates the change.
const CACHE_KEY = 'prisma_v5'

const globalForPrisma = globalThis as unknown as Record<string, PrismaClient | undefined>

// Recreate the client if the cached one is stale (missing expected models).
function isValidClient(c: PrismaClient): boolean {
  return typeof (c as unknown as { withdrawal?: unknown }).withdrawal !== 'undefined'
    && typeof (c as unknown as { notification?: unknown }).notification !== 'undefined'
    && typeof (c as unknown as { favorite?: unknown }).favorite !== 'undefined'
}

let db: PrismaClient
if (globalForPrisma[CACHE_KEY] && isValidClient(globalForPrisma[CACHE_KEY]!)) {
  db = globalForPrisma[CACHE_KEY]!
} else {
  db = new PrismaClient({ log: ['query'] })
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma[CACHE_KEY] = db
  }
}

export { db }
