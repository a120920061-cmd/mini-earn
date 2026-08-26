import { NextResponse } from 'next/server'
import { getCurrentUser, ensureSeed } from '@/lib/auth'

export async function GET() {
  await ensureSeed()
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ user: null })
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
