import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET — list the current user's completed jobs (with submission metadata)
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const submissions = await db.submission.findMany({
      where: { userId: user.id, status: 'completed' },
      orderBy: { createdAt: 'desc' },
      include: {
        job: true,
      },
    })

    return NextResponse.json({
      completed: submissions.map((s) => ({
        id: s.id,
        reward: Number(s.reward),
        proof: s.proof,
        completedAt: s.createdAt.toISOString(),
        job: {
          ...s.job,
          reward: Number(s.job.reward),
        },
      })),
    })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
