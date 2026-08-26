import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { notify } from '@/lib/notify'

// POST — admin adjusts a user's balance (add or deduct)
// body: { amount: number, reason?: string }
// amount > 0 adds, amount < 0 deducts
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getCurrentUser()
    if (!me?.isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const amount = Number(body.amount)
    const reason = String(body.reason || '').trim().slice(0, 200)

    if (!Number.isFinite(amount) || amount === 0) {
      return NextResponse.json({ error: 'invalid_amount' }, { status: 400 })
    }

    const target = await db.user.findUnique({ where: { id } })
    if (!target) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    if (target.isAdmin) {
      return NextResponse.json({ error: 'cannot_adjust_admin' }, { status: 400 })
    }

    // prevent balance going negative
    const newBalance = Number(target.balance) + amount
    if (newBalance < 0) {
      return NextResponse.json({ error: 'insufficient_balance' }, { status: 400 })
    }

    const isAdd = amount > 0
    const absAmount = Math.abs(amount)

    await db.$transaction([
      db.user.update({
        where: { id },
        data: {
          balance: { increment: amount },
          ...(isAdd ? { totalEarned: { increment: absAmount } } : {}),
        },
      }),
      db.transaction.create({
        data: {
          userId: id,
          amount: isAdd ? absAmount : -absAmount,
          type: 'adjustment',
          description: reason || (isAdd ? 'Admin bonus' : 'Admin deduction'),
        },
      }),
    ])

    const updated = await db.user.findUnique({
      where: { id },
      select: { balance: true, totalEarned: true },
    })

    // notify the user
    await notify({
      userId: id,
      type: 'system',
      title: isAdd ? 'Balance Added' : 'Balance Deducted',
      body: `${isAdd ? '+' : '-'}৳${absAmount.toFixed(2)}${reason ? ` · ${reason}` : ''}`,
      link: 'wallet',
    })

    return NextResponse.json({
      ok: true,
      balance: Number(updated?.balance ?? newBalance),
      totalEarned: Number(updated?.totalEarned ?? target.totalEarned),
    })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
