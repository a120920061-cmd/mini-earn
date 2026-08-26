'use client'

import { useEffect, useState, useCallback } from 'react'
import { Wallet, TrendingUp, CheckCircle2, ArrowDownLeft, ArrowUpRight, Loader2, Coins, ArrowDownToLine, Clock, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/store/use-app-store'
import { useT } from '@/hooks/use-t'
import { api, formatMoney, formatNumber, timeAgo } from '@/lib/api'
import { WithdrawDialog } from '@/components/wallet/withdraw-dialog'

type Tx = {
  id: string
  amount: number
  type: string
  description: string
  createdAt: string
}

type Withdrawal = {
  id: string
  amount: number
  method: string
  account: string
  status: string
  note: string | null
  createdAt: string
}

type WalletData = {
  balance: number
  totalEarned: number
  completedJobs: number
  transactions: Tx[]
  withdrawals: Withdrawal[]
}

const statusStyle: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  approved: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  rejected: 'bg-destructive/10 text-destructive',
}

export function WalletView() {
  const { t, lang } = useT()
  const setUser = useAppStore((s) => s.setUser)
  const user = useAppStore((s) => s.user)
  const refreshKey = useAppStore((s) => s.refreshKey)
  const [data, setData] = useState<WalletData | null>(null)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await api<WalletData>('/api/wallet')
    if (res.ok && res.data) {
      setData(res.data)
      if (user) {
        setUser({ ...user, balance: res.data.balance, totalEarned: res.data.totalEarned })
      }
    } else {
      setData({ balance: 0, totalEarned: 0, completedJobs: 0, transactions: [], withdrawals: [] })
    }
    setLoading(false)
  }, [setUser, user])

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      const res = await api<WalletData>('/api/wallet')
      if (!alive) return
      if (res.ok && res.data) setData(res.data)
      else setData({ balance: 0, totalEarned: 0, completedJobs: 0, transactions: [], withdrawals: [] })
      setLoading(false)
    })()
    return () => { alive = false }
  }, [refreshKey])

  if (loading || !data) {
    return <WalletSkeleton t={t} />
  }

  return (
    <div className="space-y-5 animate-view-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('wallet')}</h1>
          <p className="text-sm text-muted-foreground">{t('earningBreakdown')}</p>
        </div>
        <Button
          size="sm"
          className="h-9"
          onClick={() => setShowWithdraw(true)}
          disabled={data.balance < 10}
        >
          <ArrowDownToLine className="size-4" />
          {t('withdraw')}
        </Button>
      </div>

      {/* balance card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground p-5 shadow-lg">
        <div className="absolute -right-6 -top-6 size-32 rounded-full bg-white/10" />
        <div className="absolute -left-8 -bottom-8 size-24 rounded-full bg-white/5" />
        <div className="relative">
          <span className="text-sm opacity-90 flex items-center gap-1.5">
            <Wallet className="size-4" /> {t('currentBalance')}
          </span>
          <p className="text-4xl font-bold mt-2">{formatMoney(data.balance, t('taka'), lang)}</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3 bg-white/15 hover:bg-white/25 text-primary-foreground border-0"
            onClick={() => setShowWithdraw(true)}
            disabled={data.balance < 10}
          >
            <ArrowDownToLine className="size-4" />
            {t('withdrawMoney')}
          </Button>
        </div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border bg-card p-4">
          <div className="size-9 rounded-lg bg-primary/10 text-primary grid place-items-center mb-2">
            <TrendingUp className="size-5" />
          </div>
          <p className="text-xl font-bold leading-none">{formatMoney(data.totalEarned, t('taka'), lang)}</p>
          <p className="text-xs text-muted-foreground mt-1">{t('totalEarned')}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <div className="size-9 rounded-lg bg-primary/10 text-primary grid place-items-center mb-2">
            <CheckCircle2 className="size-5" />
          </div>
          <p className="text-xl font-bold leading-none">{formatNumber(data.completedJobs, lang)}</p>
          <p className="text-xs text-muted-foreground mt-1">{t('completedJobs')}</p>
        </div>
      </div>

      {/* withdrawals section */}
      {data.withdrawals.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <ArrowDownToLine className="size-4 text-primary" />
            {t('withdrawalHistory')}
          </h2>
          <div className="rounded-2xl border bg-card divide-y overflow-hidden">
            {data.withdrawals.map((w) => (
              <div key={w.id} className="flex items-center gap-3 p-3.5">
                <div className={`size-9 rounded-full grid place-items-center shrink-0 ${statusStyle[w.status] || statusStyle.pending}`}>
                  {w.status === 'approved' ? <Check className="size-4" /> : w.status === 'rejected' ? <X className="size-4" /> : <Clock className="size-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {t(w.method as any) || w.method} • {w.account}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span>{timeAgo(w.createdAt, lang)}</span>
                    {w.note && (<><span>·</span><span className="truncate">{w.note}</span></>)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-destructive">-{formatMoney(w.amount, t('taka'), lang)}</p>
                  <Badge variant="outline" className={`text-[10px] h-5 px-1.5 mt-0.5 ${statusStyle[w.status] || statusStyle.pending} border-0`}>
                    {t(w.status as any)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* transactions */}
      <div className="space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Coins className="size-4 text-primary" />
          {t('transactionHistory')}
        </h2>

        {data.transactions.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="size-12 rounded-full bg-muted grid place-items-center mx-auto mb-3">
              <Wallet className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{t('noTransactions')}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('startEarning')}</p>
          </Card>
        ) : (
          <div className="rounded-2xl border bg-card divide-y overflow-hidden">
            {data.transactions.map((tx) => {
              const earning = tx.type === 'earning' || (tx.amount > 0 && tx.type !== 'withdrawal')
              return (
                <div key={tx.id} className="flex items-center gap-3 p-3.5">
                  <div
                    className={`size-9 rounded-full grid place-items-center shrink-0 ${
                      earning ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-destructive/10 text-destructive'
                    }`}
                  >
                    {earning ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.description}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span className="capitalize">{t(tx.type as any) || tx.type}</span>
                      <span>·</span>
                      <span>{timeAgo(tx.createdAt, lang)}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${earning ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                      {earning ? '+' : '-'}{formatMoney(Math.abs(tx.amount), t('taka'), lang)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <WithdrawDialog
        open={showWithdraw}
        onOpenChange={setShowWithdraw}
        balance={data.balance}
        onDone={(newBalance) => {
          setData((prev) => prev ? { ...prev, balance: newBalance } : prev)
          load()
        }}
      />
    </div>
  )
}

function WalletSkeleton({ t }: { t: (k: any) => string }) {
  return (
    <div className="space-y-5">
      <div>
        <Skeleton className="h-7 w-28 mb-1" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-32 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <Skeleton className="h-5 w-32" />
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
      </div>
    </div>
  )
}
