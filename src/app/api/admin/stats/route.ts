import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user?.isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const [totalUsers, totalJobs, activeJobs, totalSubmissions, agg] = await Promise.all([
      db.user.count({ where: { isAdmin: false } }),
      db.job.count(),
      db.job.count({ where: { enabled: true } }),
      db.submission.count({ where: { status: 'completed' } }),
      db.transaction.aggregate({
        where: { type: 'earning' },
        _sum: { amount: true },
      }),
    ])

    const recentUsers = await db.user.findMany({
      where: { isAdmin: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        balance: true,
        enabled: true,
        createdAt: true,
      },
    })

    const recentJobs = await db.job.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        reward: true,
        featured: true,
        enabled: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      stats: {
        totalUsers,
        totalJobs,
        activeJobs,
        totalSubmissions,
        totalPaid: Number(agg._sum.amount || 0),
      },
      recentUsers: recentUsers.map((u) => ({
        ...u,
        balance: Number(u.balance),
        createdAt: u.createdAt.toISOString(),
      })),
      recentJobs: recentJobs.map((j) => ({
        ...j,
        reward: Number(j.reward),
        createdAt: j.createdAt.toISOString(),
      })),
    })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
