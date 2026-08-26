import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user?.isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const [
      totalUsers,
      totalJobs,
      activeJobs,
      totalSubmissions,
      earningAgg,
      pendingWithdrawals,
      approvedWithdrawalsAgg,
    ] = await Promise.all([
      db.user.count({ where: { isAdmin: false } }),
      db.job.count(),
      db.job.count({ where: { enabled: true } }),
      db.submission.count({ where: { status: 'completed' } }),
      db.transaction.aggregate({
        where: { type: 'earning' },
        _sum: { amount: true },
      }),
      db.withdrawal.count({ where: { status: 'pending' } }),
      db.withdrawal.aggregate({
        where: { status: 'approved' },
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

    const recentWithdrawals = await db.withdrawal.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: { select: { id: true, name: true, username: true } },
      },
    })

    return NextResponse.json({
      stats: {
        totalUsers,
        totalJobs,
        activeJobs,
        totalSubmissions,
        totalPaid: Number(earningAgg._sum.amount || 0),
        pendingWithdrawals,
        totalPaidOut: Number(approvedWithdrawalsAgg._sum.amount || 0),
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
      recentWithdrawals: recentWithdrawals.map((w) => ({
        id: w.id,
        amount: Number(w.amount),
        method: w.method,
        status: w.status,
        createdAt: w.createdAt.toISOString(),
        user: w.user,
      })),
    })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
