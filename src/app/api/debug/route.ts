import { NextResponse } from 'next/server'

export async function GET() {
  // DO NOT use in production long-term — this exposes env config for debugging
  const databaseUrl = process.env.DATABASE_URL || '(missing)'
  const directUrl = process.env.DIRECT_DATABASE_URL || '(missing)'
  const tursoToken = process.env.TURSO_AUTH_TOKEN ? '(set, ' + process.env.TURSO_AUTH_TOKEN.length + ' chars)' : '(missing)'
  const nodeEnv = process.env.NODE_ENV || '(missing)'

  let dbTest: string
  try {
    const { db } = await import('@/lib/db')
    // try a simple query
    const count = await (db as any).user.count()
    dbTest = `OK — ${count} users in DB`
  } catch (e: any) {
    dbTest = `ERROR: ${e.message?.slice(0, 200) || String(e).slice(0, 200)}`
  }

  return NextResponse.json({
    env: { databaseUrl, directUrl, tursoToken, nodeEnv },
    dbTest,
  })
}
