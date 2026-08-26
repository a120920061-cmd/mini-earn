import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createSession, setSessionCookie, ensureSeed } from '@/lib/auth'

export async function POST(req: Request) {
  await ensureSeed()
  try {
    const { identifier, password } = await req.json()
    if (!identifier || !password) {
      return NextResponse.json({ error: 'invalidCredentials' }, { status: 400 })
    }
    const id = identifier.trim().toLowerCase()
    const user = await db.user.findFirst({
      where: { OR: [{ email: id }, { username: id }] },
    })
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'invalidCredentials' }, { status: 401 })
    }
    if (!user.enabled) {
      return NextResponse.json({ error: 'accountDisabled' }, { status: 403 })
    }

    const token = await createSession(user.id)
    await setSessionCookie(token)

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        balance: user.balance,
        totalEarned: user.totalEarned,
        isAdmin: user.isAdmin,
        enabled: user.enabled,
        streak: user.streak,
        bestStreak: user.bestStreak,
        lastJobAt: user.lastJobAt?.toISOString() ?? null,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
