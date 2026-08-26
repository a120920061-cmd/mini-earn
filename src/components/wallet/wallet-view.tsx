'use client'

import { useEffect, useState } from 'react'
import { Wallet, TrendingUp, CheckCircle2, ArrowDownLeft, ArrowUpRight, Loader2, Coins } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store/use-app-store'
import { useT } from '@/hooks/use-t'
import { api, formatMoney, timeAgo } from '@/lib/api'

type Tx = {
  id: string
  amount: number
  type: string
  description: string
  createdAt: string
}

type WalletData = {
  balance: number
  totalEarned: number
  completedJobs: number
  transactions: Tx[]
}

export function WalletView() {
  const { t, lang } = useT()
  const user = useAppStore((s) => s.user)
  const [data, setData] = useState<WalletData | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const res = await api<WalletData>('/api/wallet')
      if (!alive) return
      if (res.ok && res.data) setData(res.data)
      else setData({ balance: 0, totalEarned: 0, completedJobs: 0, transactions: [] })
    })()
    return () => { alive = false }
  }, [])

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-view-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('wallet')}</h1>
        <p className="text-sm text-muted-foreground">{t('earningBreakdown')}</p>
      </div>

      {/* balance card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground p-5 shadow-lg">
        <div className="absolute -right-6 -top-6 size-32 rounded-full bg-white/10" />
        <div className="relative">
          <span className="text-sm opacity-90 flex items-center gap-1.5">
            <Wallet className="size-4" /> {t('currentBalance')}
          </span>
          <p className="text-4xl font-bold mt-2">{formatMoney(data.balance, t('taka'))}</p>
        </div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border bg-card p-4">
          <div className="size-9 rounded-lg bg-primary/10 text-primary grid place-items-center mb-2">
            <TrendingUp className="size-5" />
          </div>
          <p className="text-xl font-bold leading-none">{formatMoney(data.totalEarned, t('taka'))}</p>
          <p className="text-xs text-muted-foreground mt-1">{t('totalEarned')}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <div className="size-9 rounded-lg bg-primary/10 text-primary grid place-items-center mb-2">
            <CheckCircle2 className="size-5" />
          </div>
          <p className="text-xl font-bold leading-none">{data.completedJobs}</p>
          <p className="text-xs text-muted-foreground mt-1">{t('completedJobs')}</p>
        </div>
      </div>

      {/* transactions */}
      <div className="space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Coins className="size-4 text-primary" />
          {t('transactionHistory')}
        </h2>

        {data.transactions.length === 0 ? (
          <Card className="p-8 text-center">
            <Wallet className="size-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{t('noTransactions')}</p>
          </Card>
        ) : (
          <div className="rounded-2xl border bg-card divide-y overflow-hidden">
            {data.transactions.map((tx) => {
              const earning = tx.type === 'earning' || tx.amount > 0
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
                      {earning ? '+' : '-'}{formatMoney(Math.abs(tx.amount), t('taka'))}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
