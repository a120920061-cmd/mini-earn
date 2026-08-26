import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// PATCH — toggle enable/disable a user (admin only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getCurrentUser()
    if (!me?.isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const { id } = await params
    const body = await req.json()
    const enabled = Boolean(body.enabled)

    // prevent admin from disabling themselves
    if (id === me.id) {
      return NextResponse.json({ error: 'cannot_disable_self' }, { status: 400 })
    }

    const target = await db.user.findUnique({ where: { id } })
    if (!target) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    if (target.isAdmin) {
      return NextResponse.json({ error: 'cannot_disable_admin' }, { status: 400 })
    }

    const updated = await db.user.update({
      where: { id },
      data: { enabled },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        balance: true,
        totalEarned: true,
        enabled: true,
        isAdmin: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      user: {
        ...updated,
        balance: Number(updated.balance),
        totalEarned: Number(updated.totalEarned),
        createdAt: updated.createdAt.toISOString(),
      },
    })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
