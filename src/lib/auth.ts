import { cookies } from 'next/headers'
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import { db } from '@/lib/db'

export const SESSION_COOKIE = 'me_session'
const SESSION_DAYS = 7

// ---- Password hashing (Node built-in scrypt, no external deps) ----
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const hashBuf = Buffer.from(hash, 'hex')
  const testBuf = scryptSync(password, salt, 64)
  if (hashBuf.length !== testBuf.length) return false
  return timingSafeEqual(hashBuf, testBuf)
}

// ---- Session tokens ----
export function newToken(): string {
  return randomBytes(32).toString('hex')
}

export async function createSession(userId: string): Promise<string> {
  const token = newToken()
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  await db.session.create({ data: { token, userId, expiresAt } })
  return token
}

export async function setSessionCookie(token: string) {
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  })
}

export async function clearSessionCookie() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export async function getSessionToken(): Promise<string | undefined> {
  const store = await cookies()
  return store.get(SESSION_COOKIE)?.value
}

// ---- Current user ----
export async function getCurrentUser() {
  const token = await getSessionToken()
  if (!token) return null
  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  })
  if (!session) return null
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {})
    return null
  }
  return session.user
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) throw new Error('UNAUTHORIZED')
  return user
}

export async function requireAdmin() {
  const user = await requireUser()
  if (!user.isAdmin) throw new Error('FORBIDDEN')
  return user
}

// ---- Seeding (lazy, idempotent) ----
const ADMIN_EMAIL = 'admin@miniearn.com'
const ADMIN_PASSWORD = 'admin123'

export async function ensureSeed() {
  const adminExists = await db.user.findFirst({ where: { isAdmin: true } })
  if (!adminExists) {
    const admin = await db.user.create({
      data: {
        name: 'Admin',
        username: 'admin',
        email: ADMIN_EMAIL,
        passwordHash: hashPassword(ADMIN_PASSWORD),
        isAdmin: true,
        enabled: true,
      },
    })
    // give admin a starting balance for display
    await db.user.update({
      where: { id: admin.id },
      data: { balance: 500, totalEarned: 500 },
    })
    await db.transaction.create({
      data: {
        userId: admin.id,
        amount: 500,
        type: 'adjustment',
        description: 'Admin opening balance',
      },
    })
  }

  const jobCount = await db.job.count()
  if (jobCount === 0) {
    await db.job.createMany({
      data: [
        {
          title: 'Visit Website',
          description: 'Visit the website and complete the required action.',
          instructions:
            '1. Click the job link below.\n2. Browse the homepage for at least 30 seconds.\n3. Return here and click Submit to claim your reward.',
          reward: 2,
          link: 'https://example.com',
          category: 'visit',
          featured: true,
          enabled: true,
        },
        {
          title: 'Follow on Social Media',
          description: 'Follow our official social media page.',
          instructions:
            '1. Open the social media link.\n2. Follow the page.\n3. Return and click Submit.',
          reward: 5,
          link: 'https://example.com/social',
          category: 'social',
          featured: true,
          enabled: true,
        },
        {
          title: 'Watch a Short Video',
          description: 'Watch a short promotional video and answer a simple check.',
          instructions:
            '1. Open the video link.\n2. Watch the full video.\n3. Return and click Submit.',
          reward: 3,
          link: 'https://example.com/video',
          category: 'media',
          featured: true,
          enabled: true,
        },
        {
          title: 'Download & Try App',
          description: 'Download the app and sign up to earn a bonus.',
          instructions:
            '1. Open the download link.\n2. Install and register.\n3. Return and click Submit.',
          reward: 10,
          link: 'https://example.com/app',
          category: 'download',
          featured: true,
          enabled: true,
        },
        {
          title: 'Complete a Survey',
          description: 'Answer a quick 3-question survey about your experience.',
          instructions:
            '1. Open the survey link.\n2. Answer all questions honestly.\n3. Return and click Submit.',
          reward: 4,
          link: 'https://example.com/survey',
          category: 'survey',
          featured: false,
          enabled: true,
        },
      ],
    })
  }
}
