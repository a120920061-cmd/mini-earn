import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, ensureSeed } from '@/lib/auth'

// GET jobs (users see only enabled; admins can pass ?all=true)
export async function GET(req: Request) {
  await ensureSeed()
  try {
    const { searchParams } = new URL(req.url)
    const all = searchParams.get('all') === 'true'
    const user = await getCurrentUser()
    const showAll = all && user?.isAdmin

    const jobs = await db.job.findMany({
      where: showAll ? {} : { enabled: true },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    })

    // for regular users, attach completion + favorite status
    let completed: string[] = []
    let favorited: string[] = []
    if (user && !user.isAdmin) {
      const [subs, favs] = await Promise.all([
        db.submission.findMany({
          where: { userId: user.id, status: 'completed' },
          select: { jobId: true },
        }),
        db.favorite.findMany({
          where: { userId: user.id },
          select: { jobId: true },
        }),
      ])
      completed = subs.map((s) => s.jobId)
      favorited = favs.map((f) => f.jobId)
    }

    return NextResponse.json({
      jobs: jobs.map((j) => ({
        ...j,
        reward: Number(j.reward),
        completed: completed.includes(j.id),
        favorited: favorited.includes(j.id),
      })),
    })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}

// POST create job (admin only)
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user?.isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const body = await req.json()
    const { title, description, instructions, reward, link, category, featured, enabled } = body

    if (!title || !description || !link) {
      return NextResponse.json({ error: 'validation' }, { status: 400 })
    }

    const job = await db.job.create({
      data: {
        title: String(title).trim(),
        description: String(description).trim(),
        instructions: String(instructions || '').trim(),
        reward: Number(reward) || 0,
        link: String(link).trim(),
        category: String(category || 'general').trim(),
        featured: Boolean(featured),
        enabled: enabled !== false,
      },
    })
    return NextResponse.json({ job })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
