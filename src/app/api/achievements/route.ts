import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { computeBadges } from '@/lib/achievements'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const badges = await computeBadges(user.id)
    const unlocked = badges.filter((b) => b.unlocked).length

    return NextResponse.json({
      badges,
      unlockedCount: unlocked,
      totalCount: badges.length,
    })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
