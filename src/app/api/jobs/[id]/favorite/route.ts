import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// POST — toggle favorite status for a job
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const { id } = await params
    const job = await db.job.findUnique({ where: { id } })
    if (!job) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    const existing = await db.favorite.findUnique({
      where: { userId_jobId: { userId: user.id, jobId: id } },
    })

    if (existing) {
      await db.favorite.delete({ where: { id: existing.id } })
      return NextResponse.json({ ok: true, favorited: false })
    }

    await db.favorite.create({ data: { userId: user.id, jobId: id } })
    return NextResponse.json({ ok: true, favorited: true })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
