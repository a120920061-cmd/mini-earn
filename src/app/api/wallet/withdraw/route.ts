import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { notify } from '@/lib/notify'

const MIN_WITHDRAW = 10
const METHODS = ['bkash', 'nagad', 'rocket', 'bank']

// POST — user requests a withdrawal
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    if (!user.enabled) return NextResponse.json({ error: 'accountDisabled' }, { status: 403 })

    const body = await req.json().catch(() => ({}))
    const amount = Number(body.amount)
    const method = String(body.method || 'bkash').toLowerCase()
    const account = String(body.account || '').trim()

    if (!Number.isFinite(amount) || amount < MIN_WITHDRAW) {
      return NextResponse.json({ error: 'minWithdraw' }, { status: 400 })
    }
    if (amount > user.balance) {
      return NextResponse.json({ error: 'insufficientBalance' }, { status: 400 })
    }
    if (!METHODS.includes(method)) {
      return NextResponse.json({ error: 'invalidAccount' }, { status: 400 })
    }
    if (account.length < 5) {
      return NextResponse.json({ error: 'invalidAccount' }, { status: 400 })
    }

    // block if there's already a pending withdrawal for this user
    const existingPending = await db.withdrawal.findFirst({
      where: { userId: user.id, status: 'pending' },
    })
    if (existingPending) {
      return NextResponse.json({ error: 'pendingExists' }, { status: 409 })
    }

    // deduct balance immediately (held until approved/rejected)
    const [withdrawal] = await db.$transaction([
      db.withdrawal.create({
        data: {
          userId: user.id,
          amount,
          method,
          account,
          status: 'pending',
        },
      }),
      db.user.update({
        where: { id: user.id },
        data: { balance: { decrement: amount } },
      }),
    ])

    const updated = await db.user.findUnique({ where: { id: user.id } })

    await notify({
      userId: user.id,
      type: 'withdrawal',
      title: 'Withdrawal Requested',
      body: `৳${amount.toFixed(2)} via ${method} • ${account}`,
      link: 'wallet',
    })

    return NextResponse.json({
      ok: true,
      withdrawal: {
        id: withdrawal.id,
        amount: Number(withdrawal.amount),
        method: withdrawal.method,
        account: withdrawal.account,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt.toISOString(),
      },
      balance: updated?.balance ?? user.balance - amount,
    })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
