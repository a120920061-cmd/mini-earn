import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET — list the current user's favorited jobs
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const favorites = await db.favorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        job: true,
      },
    })

    return NextResponse.json({
      favorites: favorites
        .filter((f) => f.job && f.job.enabled)
        .map((f) => ({
          ...f.job,
          reward: Number(f.job.reward),
        })),
    })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
