import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { notify } from '@/lib/notify'

// PATCH — approve or reject a withdrawal
// body: { status: 'approved' | 'rejected', note?: string }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getCurrentUser()
    if (!me?.isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const { id } = await params
    const body = await req.json()
    const status = body.status === 'approved' ? 'approved' : body.status === 'rejected' ? 'rejected' : null
    if (!status) return NextResponse.json({ error: 'invalid_status' }, { status: 400 })
    const note = body.note ? String(body.note).slice(0, 200) : null

    const withdrawal = await db.withdrawal.findUnique({ where: { id }, include: { user: true } })
    if (!withdrawal) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    if (withdrawal.status !== 'pending') {
      return NextResponse.json({ error: 'already_processed' }, { status: 400 })
    }

    if (status === 'approved') {
      // create a withdrawal transaction record; balance already deducted at request time
      await db.$transaction([
        db.withdrawal.update({
          where: { id },
          data: { status: 'approved', note },
        }),
        db.transaction.create({
          data: {
            userId: withdrawal.userId,
            amount: -Number(withdrawal.amount),
            type: 'withdrawal',
            description: `${withdrawal.method} • ${withdrawal.account}`,
          },
        }),
      ])
    } else {
      // rejected — refund the held balance back to the user
      await db.$transaction([
        db.withdrawal.update({
          where: { id },
          data: { status: 'rejected', note },
        }),
        db.user.update({
          where: { id: withdrawal.userId },
          data: { balance: { increment: Number(withdrawal.amount) } },
        }),
      ])
    }

    const updated = await db.withdrawal.findUnique({ where: { id }, include: { user: { select: { name: true, username: true, email: true } } } })

    // notify the user about the decision
    if (status === 'approved') {
      await notify({
        userId: withdrawal.userId,
        type: 'withdrawal',
        title: 'Withdrawal Approved',
        body: `৳${Number(withdrawal.amount).toFixed(2)} sent to ${withdrawal.method} • ${withdrawal.account}`,
        link: 'wallet',
      })
    } else {
      await notify({
        userId: withdrawal.userId,
        type: 'withdrawal',
        title: 'Withdrawal Rejected',
        body: `৳${Number(withdrawal.amount).toFixed(2)} refunded to your balance${note ? ` · ${note}` : ''}`,
        link: 'wallet',
      })
    }

    return NextResponse.json({
      ok: true,
      withdrawal: updated && {
        id: updated.id,
        amount: Number(updated.amount),
        method: updated.method,
        account: updated.account,
        status: updated.status,
        note: updated.note,
        createdAt: updated.createdAt.toISOString(),
        user: updated.user,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
