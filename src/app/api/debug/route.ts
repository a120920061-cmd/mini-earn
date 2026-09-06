import { NextResponse } from 'next/server'
import { createClient } from '@libsql/client'

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL || '(missing)'
  const directUrl = process.env.DIRECT_DATABASE_URL || '(missing)'
  const tursoToken = process.env.TURSO_AUTH_TOKEN ? '(set, ' + process.env.TURSO_AUTH_TOKEN.length + ' chars)' : '(missing)'
  const nodeEnv = process.env.NODE_ENV || '(missing)'

  // Test 1: direct libsql (bypasses Prisma)
  let libsqlTest: string
  try {
    const client = createClient({
      url: databaseUrl.startsWith('libsql') ? databaseUrl : 'file:./db/custom.db',
      authToken: process.env.TURSO_AUTH_TOKEN || undefined,
    })
    const result = await client.execute('SELECT COUNT(*) as c FROM "User"')
    libsqlTest = `OK — ${result.rows[0].c} users`
  } catch (e: any) {
    libsqlTest = `ERROR: ${e.message?.slice(0, 200) || String(e).slice(0, 200)}`
  }

  // Test 2: Prisma with adapter
  let prismaTest: string
  try {
    const { db } = await import('@/lib/db')
    const count = await (db as any).user.count()
    prismaTest = `OK — ${count} users`
  } catch (e: any) {
    prismaTest = `ERROR: ${e.message?.slice(0, 200) || String(e).slice(0, 200)}`
  }

  return NextResponse.json({
    env: { databaseUrl, directUrl, tursoToken, nodeEnv },
    libsqlTest,
    prismaTest,
  })
}
