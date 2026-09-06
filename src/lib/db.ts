import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

/**
 * Database client setup.
 *
 * Supports BOTH local SQLite (file:) and Turso (libsql:) via the Prisma
 * libsql driver adapter. The connection string comes from DATABASE_URL;
 * if TURSO_AUTH_TOKEN is set it is used for Turso authentication.
 */

const CACHE_KEY = 'prisma_v7'

const globalForPrisma = globalThis as unknown as Record<string, PrismaClient | undefined>

function isValidClient(c: PrismaClient): boolean {
  return typeof (c as unknown as { withdrawal?: unknown }).withdrawal !== 'undefined'
    && typeof (c as unknown as { notification?: unknown }).notification !== 'undefined'
    && typeof (c as unknown as { favorite?: unknown }).favorite !== 'undefined'
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL || 'file:./db/custom.db'
  const authToken = process.env.TURSO_AUTH_TOKEN || undefined

  // Turso (libsql://) → use the libsql adapter
  if (databaseUrl.startsWith('libsql://')) {
    const libsql = createClient({ url: databaseUrl, authToken })
    const adapter = new PrismaLibSql(libsql)
    return new PrismaClient({ adapter } as any)
  }

  // Local SQLite (file:) → standard Prisma client, no adapter needed
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
