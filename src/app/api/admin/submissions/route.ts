import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET — list all submissions (admin only)
// ?status=completed|rejected  &q=search(user/job title)  &jobId=...
export async function GET(req: Request) {
  try {
    const me = await getCurrentUser()
    if (!me?.isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || ''
    const q = searchParams.get('q')?.trim() || ''
    const jobId = searchParams.get('jobId') || ''

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (jobId) where.jobId = jobId

    // q search requires a join — fetch submissions then filter, or use relations
    let submissions = await db.submission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        job: { select: { id: true, title: true, category: true } },
        user: { select: { id: true, name: true, username: true, email: true } },
      },
    })

    // filter by q (user name/username/email or job title)
    if (q) {
      const ql = q.toLowerCase()
      submissions = submissions.filter(
        (s) =>
          s.user.name.toLowerCase().includes(ql) ||
          s.user.username.toLowerCase().includes(ql) ||
          s.user.email.toLowerCase().includes(ql) ||
          s.job.title.toLowerCase().includes(ql)
      )
    }

    return NextResponse.json({
      submissions: submissions.map((s) => ({
        id: s.id,
        status: s.status,
        reward: Number(s.reward),
        proof: s.proof,
        createdAt: s.createdAt.toISOString(),
        job: s.job,
        user: s.user,
      })),
    })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
