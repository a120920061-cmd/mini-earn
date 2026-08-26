'use client'

import { useEffect, useState } from 'react'
import { X, Loader2, AtSign, Mail, Wallet, Flame, Award, Briefcase, ArrowDownToLine, TrendingUp, Pencil } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useT } from '@/hooks/use-t'
import { api, formatMoney, formatNumber, timeAgo } from '@/lib/api'
import { cn } from '@/lib/utils'
import { BalanceAdjustDialog } from '@/components/admin/balance-adjust-dialog'

type BadgeItem = {
  id: string
  title: string
  description: string
  icon: string
  color: string
  unlocked: boolean
}

type UserStats = {
  user: {
    id: string
    name: string
    username: string
    email: string
    balance: number
    totalEarned: number
    isAdmin: boolean
    enabled: boolean
    streak: number
    bestStreak: number
    lastJobAt: string | null
    createdAt: string
  }
  stats: { completedJobs: number; withdrawals: number; unlockedBadges: number; totalBadges: number }
  badges: BadgeItem[]
  recentTransactions: { id: string; amount: number; type: string; description: string; createdAt: string }[]
}

export function UserDetailSheet({
  userId,
  open,
  onOpenChange,
}: {
  userId: string | null
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const { t, lang } = useT()
  const [data, setData] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [balOpen, setBalOpen] = useState(false)

  useEffect(() => {
    if (!userId || !open) return
    let alive = true
    ;(async () => {
      setLoading(true)
      setData(null)
      const res = await api<UserStats>(`/api/admin/users/${userId}/stats`)
      if (!alive) return
      if (res.ok && res.data) setData(res.data)
      setLoading(false)
    })()
    return () => { alive = false }
  }, [userId, open])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {data && (
              <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground grid place-items-center font-bold">
                {data.user.name.charAt(0).toUpperCase()}
              </div>
            )}
            {data?.user.name || (loading ? <Skeleton className="h-5 w-24" /> : '—')}
          </SheetTitle>
          <SheetDescription>
            {data ? `@${data.user.username}` : ''}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="space-y-3 px-4 pb-8">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        ) : !data ? (
          <div className="px-4 pb-8 text-center text-sm text-muted-foreground py-10">
            {t('noUsersYet')}
          </div>
        ) : (
          <div className="space-y-4 px-4 pb-8">
            {/* account status */}
            <div className="flex items-center gap-2">
              {data.user.isAdmin && <Badge variant="secondary" className="text-[10px]">Admin</Badge>}
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px]',
                  data.user.enabled
                    ? 'text-emerald-600 border-emerald-500/30'
                    : 'text-destructive border-destructive/30'
                )}
              >
                {data.user.enabled ? t('active') : t('disabled')}
              </Badge>
            </div>

            {/* info rows */}
            <div className="rounded-xl border bg-card divide-y">
              <Row icon={<AtSign className="size-4" />} label={t('username')} value={`@${data.user.username}`} />
              <Row icon={<Mail className="size-4" />} label={t('email')} value={data.user.email} />
              <Row icon={<Wallet className="size-4" />} label={t('balance')} value={formatMoney(data.user.balance, t('taka'), lang)} highlight />
              <Row icon={<TrendingUp className="size-4" />} label={t('totalEarned')} value={formatMoney(data.user.totalEarned, t('taka'), lang)} />
              <Row icon={<Flame className="size-4" />} label={t('dailyStreak')} value={`${formatNumber(data.user.streak, lang)} (${t('bestStreak')}: ${formatNumber(data.user.bestStreak, lang)})`} />
            </div>

            {/* quick stats grid */}
            <div className="grid grid-cols-3 gap-2">
              <Stat icon={<Briefcase className="size-4" />} value={formatNumber(data.stats.completedJobs, lang)} label={t('completedJobs')} color="text-emerald-600" />
              <Stat icon={<ArrowDownToLine className="size-4" />} value={formatNumber(data.stats.withdrawals, lang)} label={t('withdrawals')} color="text-amber-600" />
              <Stat icon={<Award className="size-4" />} value={`${formatNumber(data.stats.unlockedBadges, lang)}/${formatNumber(data.stats.totalBadges, lang)}`} label={t('badges')} color="text-purple-600" />
            </div>

            {/* adjust balance button (non-admin users only) */}
            {!data.user.isAdmin && (
              <Button
                variant="outline"
                className="w-full h-10"
                onClick={() => setBalOpen(true)}
              >
                <Pencil className="size-4" />
                {t('adjustBalance')}
              </Button>
            )}

            {/* badges */}
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">{t('badges')}</p>
              <div className="grid grid-cols-5 gap-1.5">
                {data.badges.map((b) => (
                  <div
                    key={b.id}
                    className={cn(
                      'aspect-square rounded-lg grid place-items-center text-lg',
                      b.unlocked ? `bg-gradient-to-br ${b.color}` : 'bg-muted grayscale opacity-50'
                    )}
                    title={`${b.title} — ${b.description}`}
                  >
                    {b.icon}
                  </div>
                ))}
              </div>
            </div>

            {/* recent transactions */}
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">{t('transactionHistory')}</p>
              <div className="rounded-xl border bg-card divide-y">
                {data.recentTransactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">{t('noTransactions')}</p>
                ) : (
                  data.recentTransactions.map((tx) => {
                    const earning = tx.type === 'earning' || (tx.amount > 0 && tx.type !== 'withdrawal')
                    return (
                      <div key={tx.id} className="flex items-center justify-between p-2.5">
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{tx.description}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {t(tx.type as any) || tx.type} · {timeAgo(tx.createdAt, lang)}
                          </p>
                        </div>
                        <span className={cn('text-xs font-bold', earning ? 'text-emerald-600' : 'text-destructive')}>
                          {earning ? '+' : '-'}{formatMoney(Math.abs(tx.amount), t('taka'), lang)}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* balance adjust dialog */}
        {data && (
          <BalanceAdjustDialog
            userId={data.user.id}
            userName={data.user.name}
            currentBalance={data.user.balance}
            open={balOpen}
            onOpenChange={setBalOpen}
            onDone={(newBal) => {
              setData((prev) => prev ? { ...prev, user: { ...prev.user, balance: newBal } } : prev)
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function Row({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-3 p-3">
      <div className="size-8 rounded-lg bg-muted grid place-items-center text-muted-foreground shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className={cn('text-sm font-medium truncate', highlight && 'text-primary font-bold')}>{value}</p>
      </div>
    </div>
  )
}

function Stat({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  return (
    <div className="rounded-xl border bg-card p-2.5 text-center">
      <div className={cn('grid place-items-center mb-1', color)}>{icon}</div>
      <p className="text-base font-bold leading-none">{value}</p>
      <p className="text-[9px] text-muted-foreground mt-1 line-clamp-1">{label}</p>
    </div>
  )
}
