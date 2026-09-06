import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

/**
 * Database client setup for Turso (libsql) + local SQLite.
 *
 * IMPORTANT: Prisma 6.x reads the datasource URL from the inline schema
 * at runtime. On Vercel, env("DATABASE_URL") gets inlined as undefined
 * at build time. To fix this, we use the driver adapter which bypasses
 * Prisma's internal datasource resolution entirely.
 */

const CACHE_KEY = 'prisma_v12'

const globalForPrisma = globalThis as unknown as Record<string, PrismaClient | undefined>

function isValidClient(c: PrismaClient): boolean {
  return typeof (c as unknown as { withdrawal?: unknown }).withdrawal !== 'undefined'
    && typeof (c as unknown as { notification?: unknown }).notification !== 'undefined'
    && typeof (c as unknown as { favorite?: unknown }).favorite !== 'undefined'
}

function createPrismaClient(): PrismaClient {
  // Read env vars — these come from Vercel runtime env (not build-time)
  const databaseUrl = process.env.DATABASE_URL || 'file:./db/custom.db'
  const authToken = process.env.TURSO_AUTH_TOKEN || undefined

  // Turso (libsql://) → use the libsql driver adapter
  if (databaseUrl.startsWith('libsql://')) {
    const libsql = createClient({ url: databaseUrl, authToken })
    const adapter = new PrismaLibSQL(libsql)
    return new PrismaClient({ adapter } as any)
  }

  // Local SQLite (file:) → standard Prisma client
  return new PrismaClient({ log: process.env.NODE_ENV !== 'production' ? ['query'] : [] })
}

let db: PrismaClient
if (globalForPrisma[CACHE_KEY] && isValidClient(globalForPrisma[CACHE_KEY]!)) {
  db = globalForPrisma[CACHE_KEY]!
} else {
  db = createPrismaClient()
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma[CACHE_KEY] = db
  }
}

export { db }
