import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET single job (must be enabled unless admin)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    const job = await db.job.findUnique({ where: { id } })
    if (!job) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    if (!job.enabled && !user?.isAdmin) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    let completed = false
    if (user && !user.isAdmin) {
      const sub = await db.submission.findFirst({
        where: { userId: user.id, jobId: id, status: 'completed' },
      })
      completed = !!sub
    }

    return NextResponse.json({
      job: { ...job, reward: Number(job.reward), completed },
    })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}

// PATCH update job (admin only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user?.isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const { id } = await params
    const body = await req.json()
    const data: Record<string, unknown> = {}
    for (const k of ['title', 'description', 'instructions', 'link', 'category']) {
      if (body[k] !== undefined) data[k] = String(body[k]).trim()
    }
    if (body.reward !== undefined) data.reward = Number(body.reward)
    if (body.featured !== undefined) data.featured = Boolean(body.featured)
    if (body.enabled !== undefined) data.enabled = Boolean(body.enabled)

    const job = await db.job.update({ where: { id }, data })
    return NextResponse.json({ job })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}

// DELETE job (admin only)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user?.isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const { id } = await params
    await db.job.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
