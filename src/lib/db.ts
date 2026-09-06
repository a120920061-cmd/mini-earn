import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

/**
 * Database client setup for Turso (libsql) + local SQLite.
 *
 * Uses the @prisma/adapter-libsql driver adapter. The datasource URL in
 * prisma/schema.prisma is a placeholder (file:) — the REAL connection is
 * made here via the libsql client using process.env.DATABASE_URL.
 */

const CACHE_KEY = 'prisma_v9'

const globalForPrisma = globalThis as unknown as Record<string, PrismaClient | undefined>

function isValidClient(c: PrismaClient): boolean {
  return typeof (c as unknown as { withdrawal?: unknown }).withdrawal !== 'undefined'
    && typeof (c as unknown as { notification?: unknown }).notification !== 'undefined'
    && typeof (c as unknown as { favorite?: unknown }).favorite !== 'undefined'
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL
    || process.env.DIRECT_DATABASE_URL
    || 'file:./db/custom.db'
  const authToken = process.env.TURSO_AUTH_TOKEN || undefined

  // Turso (libsql://) → use the libsql driver adapter
  if (databaseUrl.startsWith('libsql://')) {
    const libsql = createClient({ url: databaseUrl, authToken })
    const adapter = new PrismaLibSql(libsql)
    // Pass the adapter AND datasourceUrl so Prisma doesn't try to read
    // the placeholder from schema.prisma at runtime.
    return new PrismaClient({
      adapter,
      datasourceUrl: databaseUrl,
    } as any)
  }

  // Local SQLite (file:) → standard Prisma client
  return new PrismaClient({
    log: process.env.NODE_ENV !== 'production' ? ['query'] : [],
    datasourceUrl: databaseUrl,
  })
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
