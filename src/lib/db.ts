import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

/**
 * Database client setup for Turso (libsql) + local SQLite.
 *
 * Uses @prisma/adapter-libsql v6.x (matching @prisma/client v6.x).
 * The adapter handles the connection — Prisma's schema datasource URL
 * is only used by the Prisma CLI for migrations, not at runtime.
 */

const CACHE_KEY = 'prisma_v11'

const globalForPrisma = globalThis as unknown as Record<string, PrismaClient | undefined>

function isValidClient(c: PrismaClient): boolean {
  return typeof (c as unknown as { withdrawal?: unknown }).withdrawal !== 'undefined'
    && typeof (c as unknown as { notification?: unknown }).notification !== 'undefined'
    && typeof (c as unknown as { favorite?: unknown }).favorite !== 'undefined'
}

function createPrismaClient(): PrismaClient {
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
