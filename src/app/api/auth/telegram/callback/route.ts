import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSession, setSessionCookie, ensureSeed } from '@/lib/auth'
import { verifyTelegramLoginWidget } from '@/lib/telegram'
import { notify } from '@/lib/notify'

// GET — Telegram OAuth callback
// Telegram redirects here with query params: id, first_name, last_name,
// username, photo_url, auth_date, hash
export async function GET(req: Request) {
  await ensureSeed()
  try {
    const { searchParams } = new URL(req.url)

    // Collect all params for verification
    const data: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      data[key] = value
    })

    // Verify the data
    const tgUser = verifyTelegramLoginWidget(data)

    if (!tgUser) {
      // Redirect back to login with error
      return NextResponse.redirect(new URL('/?tg_error=1', req.url))
    }

    // Find or create user
    let user = await db.user.findUnique({
      where: { telegramId: tgUser.id },
    })

    if (!user) {
      const fullName = [tgUser.firstName, tgUser.lastName].filter(Boolean).join(' ')
      const uname = tgUser.username.toLowerCase().replace(/[^a-z0-9_]/g, '_')

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
          passwordHash: '',
          telegramId: tgUser.id,
          photoUrl: tgUser.photoUrl,
          enabled: true,
        },
      })

      await notify({
        userId: user.id,
        type: 'system',
        title: 'Welcome to Mini Earn!',
        body: 'Complete jobs to start earning rewards.',
        link: 'jobs',
      })
    } else {
      if (tgUser.photoUrl && tgUser.photoUrl !== user.photoUrl) {
        await db.user.update({
          where: { id: user.id },
          data: { photoUrl: tgUser.photoUrl },
        })
      }
    }

    if (!user.enabled) {
      return NextResponse.redirect(new URL('/?tg_error=disabled', req.url))
    }

    const token = await createSession(user.id)
    await setSessionCookie(token)

    // Redirect to home (logged in)
    return NextResponse.redirect(new URL('/', req.url))
  } catch (e) {
    console.error('[telegram callback] error:', e)
    return NextResponse.redirect(new URL('/?tg_error=1', req.url))
  }
}
