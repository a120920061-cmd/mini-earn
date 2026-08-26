import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// POST — admin resets a user's current streak to zero
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getCurrentUser()
    if (!me?.isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const { id } = await params
    const target = await db.user.findUnique({ where: { id }, select: { id: true, isAdmin: true, streak: true } })
    if (!target) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    if (target.isAdmin) {
      return NextResponse.json({ error: 'cannot_adjust_admin' }, { status: 400 })
    }

    await db.user.update({
      where: { id },
      data: { streak: 0 },
    })

    return NextResponse.json({ ok: true, streak: 0 })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
