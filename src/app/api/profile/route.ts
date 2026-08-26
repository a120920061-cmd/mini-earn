import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// PATCH — update current user's profile (name only for now)
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const name = String(body.name || '').trim()

    if (name.length < 2) {
      return NextResponse.json({ error: 'minName' }, { status: 400 })
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: { name },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        balance: true,
        totalEarned: true,
        isAdmin: true,
        enabled: true,
      },
    })

    return NextResponse.json({
      user: {
        ...updated,
        balance: Number(updated.balance),
        totalEarned: Number(updated.totalEarned),
      },
    })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
