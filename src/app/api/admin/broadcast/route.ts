import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { notify } from '@/lib/notify'

// POST — broadcast a notification to all enabled, non-admin users
// body: { title, body, link? }
export async function POST(req: Request) {
  try {
    const me = await getCurrentUser()
    if (!me?.isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const body = await req.json().catch(() => ({}))
    const title = String(body.title || '').trim()
    const message = String(body.body || '').trim()
    const link = body.link ? String(body.link) : null

    if (title.length < 2) {
      return NextResponse.json({ error: 'minName' }, { status: 400 })
    }
    if (message.length < 2) {
      return NextResponse.json({ error: 'required' }, { status: 400 })
    }

    // fetch all enabled, non-admin users
    const users = await db.user.findMany({
      where: { isAdmin: false, enabled: true },
      select: { id: true },
    })

    if (users.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 })
    }

    // create notifications in batches to avoid huge single inserts
    const BATCH = 100
    let sent = 0
    for (let i = 0; i < users.length; i += BATCH) {
      const batch = users.slice(i, i + BATCH)
      await db.notification.createMany({
        data: batch.map((u) => ({
          userId: u.id,
          type: 'system',
          title: title.slice(0, 200),
          body: message.slice(0, 500),
          link,
        })),
      })
      sent += batch.length
    }

    return NextResponse.json({ ok: true, sent })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
