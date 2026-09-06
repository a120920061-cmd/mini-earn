import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSession, setSessionCookie, ensureSeed } from '@/lib/auth'
import { verifyTelegramInitData, verifyTelegramLoginWidget, type TelegramUserData } from '@/lib/telegram'
import { notify } from '@/lib/notify'

// POST — Telegram login (supports both Mini App initData and Login Widget callback)
// body: { initData?: string, widgetData?: Record<string,string> }
export async function POST(req: Request) {
  await ensureSeed()
  try {
    const body = await req.json().catch(() => ({}))

    const hasToken = !!process.env.TELEGRAM_BOT_TOKEN
    console.log('[TG API] hasToken:', hasToken, 'tokenPreview:', process.env.TELEGRAM_BOT_TOKEN?.slice(0, 15))

    let tgUser: TelegramUserData | null = null

    // Flow 1: Telegram Mini App initData
    if (body.initData && typeof body.initData === 'string') {
      console.log('[TG API] Flow 1: initData verification, length:', body.initData.length)
      tgUser = verifyTelegramInitData(body.initData)
      console.log('[TG API] initData verify result:', tgUser ? 'OK' : 'FAILED')
    }
    // Flow 2: Telegram Login Widget callback data
    else if (body.widgetData && typeof body.widgetData === 'object') {
      console.log('[TG API] Flow 2: widgetData verification, keys:', Object.keys(body.widgetData))
      tgUser = verifyTelegramLoginWidget(body.widgetData)
      console.log('[TG API] widgetData verify result:', tgUser ? 'OK' : 'FAILED')
    }

    if (!tgUser) {
      console.log('[TG API] verification failed — returning 401')
      return NextResponse.json({ error: 'invalid_telegram_auth' }, { status: 401 })
    }

    // Find or create user by telegramId
    let user = await db.user.findUnique({
      where: { telegramId: tgUser.id },
    })

    if (!user) {
      // Create new user from Telegram data
      const fullName = [tgUser.firstName, tgUser.lastName].filter(Boolean).join(' ')
      const uname = tgUser.username.toLowerCase().replace(/[^a-z0-9_]/g, '_')

      // Ensure username/email uniqueness
      let uniqueUsername = uname
      let uniqueEmail = `tg_${tgUser.id}@telegram.local`
      let suffix = 1
      while (await db.user.findUnique({ where: { username: uniqueUsername } })) {
        uniqueUsername = `${uname}_${suffix++}`
      }

      user = await db.user.create({
        data: {
          name: fullName || tgUser.username,
          username: uniqueUsername,
          email: uniqueEmail,
          passwordHash: '', // no password for Telegram users
          telegramId: tgUser.id,
          photoUrl: tgUser.photoUrl,
          enabled: true,
        },
      })

      // welcome notification
      await notify({
        userId: user.id,
        type: 'system',
        title: 'Welcome to Mini Earn!',
        body: 'Complete jobs to start earning rewards. Visit the Jobs tab to begin.',
        link: 'jobs',
      })
    } else {
      // Update photo + name if changed
      if (tgUser.photoUrl && tgUser.photoUrl !== user.photoUrl) {
        await db.user.update({
          where: { id: user.id },
          data: { photoUrl: tgUser.photoUrl },
        })
      }
    }

    if (!user.enabled) {
      return NextResponse.json({ error: 'accountDisabled' }, { status: 403 })
    }

    const token = await createSession(user.id)
    await setSessionCookie(token)

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
        streak: user.streak,
        bestStreak: user.bestStreak,
        lastJobAt: user.lastJobAt?.toISOString() ?? null,
        telegramId: user.telegramId,
        photoUrl: user.photoUrl,
      },
    })
  } catch (e) {
    console.error('[telegram auth] error:', e)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
