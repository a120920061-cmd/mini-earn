import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { notify } from '@/lib/notify'

// POST — user completes a job, earns reward
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    if (!user.enabled) return NextResponse.json({ error: 'accountDisabled' }, { status: 403 })

    const { id } = await params
    const job = await db.job.findUnique({ where: { id } })
    if (!job || !job.enabled) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    // already completed?
    const existing = await db.submission.findFirst({
      where: { userId: user.id, jobId: id, status: 'completed' },
    })
    if (existing) {
      return NextResponse.json({ error: 'alreadyCompleted' }, { status: 409 })
    }

    let body: { proof?: string } = {}
    try { body = await req.json() } catch { /* allow empty body */ }

    const reward = Number(job.reward)
    // create submission + transaction + update balances atomically
    const [submission] = await db.$transaction([
      db.submission.create({
        data: {
          userId: user.id,
          jobId: id,
          status: 'completed',
          reward,
          proof: body.proof || null,
        },
      }),
      db.transaction.create({
        data: {
          userId: user.id,
          amount: reward,
          type: 'earning',
          description: job.title,
          submissionId: null,
        },
      }),
      db.user.update({
        where: { id: user.id },
        data: {
          balance: { increment: reward },
          totalEarned: { increment: reward },
        },
      }),
    ])

    const updated = await db.user.findUnique({ where: { id: user.id } })

    // non-blocking earning notification
    await notify({
      userId: user.id,
      type: 'earning',
      title: job.title,
      body: `+৳${reward.toFixed(2)} ${job.title}`,
      link: 'wallet',
    })

    return NextResponse.json({
      ok: true,
      submission,
      balance: updated?.balance ?? user.balance + reward,
      totalEarned: updated?.totalEarned ?? user.totalEarned + reward,
      reward,
    })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
