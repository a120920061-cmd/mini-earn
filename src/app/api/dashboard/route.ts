import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, ensureSeed } from '@/lib/auth'

export async function GET() {
  await ensureSeed()
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    // featured + enabled jobs (max 4 for the dashboard)
    const featured = await db.job.findMany({
      where: { enabled: true, featured: true },
      orderBy: { createdAt: 'desc' },
      take: 4,
    })

    // stats
    const completedCount = await db.submission.count({
      where: { userId: user.id, status: 'completed' },
    })
    const totalJobs = await db.job.count({ where: { enabled: true } })

    let completed: string[] = []
    if (featured.length) {
      const subs = await db.submission.findMany({
        where: {
          userId: user.id,
          status: 'completed',
          jobId: { in: featured.map((j) => j.id) },
        },
        select: { jobId: true },
      })
      completed = subs.map((s) => s.jobId)
    }

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
      },
      featured: featured.map((j) => ({
        ...j,
        reward: Number(j.reward),
        completed: completed.includes(j.id),
      })),
      stats: {
        completedJobs: completedCount,
        availableJobs: totalJobs,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
