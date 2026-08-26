import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, createSession, setSessionCookie, ensureSeed } from '@/lib/auth'
import { notify } from '@/lib/notify'

export async function POST(req: Request) {
  await ensureSeed()
  try {
    const { name, username, email, password } = await req.json()

    // validation
    const errs: Record<string, string> = {}
    if (!name || name.trim().length < 2) errs.name = 'minName'
    if (!username || username.trim().length < 3) errs.username = 'minUsername'
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'invalidEmail'
    if (!password || password.length < 6) errs.password = 'minPassword'
    if (Object.keys(errs).length) {
      return NextResponse.json({ error: 'validation', fields: errs }, { status: 400 })
    }

    const uname = username.trim().toLowerCase()
    const mail = email.trim().toLowerCase()

    const exists = await db.user.findFirst({
      where: { OR: [{ email: mail }, { username: uname }] },
    })
    if (exists) {
      return NextResponse.json({ error: 'emailExists' }, { status: 409 })
    }

    const user = await db.user.create({
      data: {
        name: name.trim(),
        username: uname,
        email: mail,
        passwordHash: hashPassword(password),
      },
    })

    const token = await createSession(user.id)
    await setSessionCookie(token)

    // welcome notification
    await notify({
      userId: user.id,
      type: 'system',
      title: 'Welcome to Mini Earn!',
      body: 'Complete jobs to start earning rewards. Visit the Jobs tab to begin.',
      link: 'jobs',
    })

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
    })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
