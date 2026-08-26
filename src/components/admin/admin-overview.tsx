'use client'

import { useEffect, useState } from 'react'
import { Users, Briefcase, CheckCircle2, Coins, TrendingUp, Loader2, ArrowRight, ArrowDownToLine, Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store/use-app-store'
import { useT } from '@/hooks/use-t'
import { api, formatMoney, formatNumber, timeAgo } from '@/lib/api'

type Stats = {
  totalUsers: number
  totalJobs: number
  activeJobs: number
  totalSubmissions: number
  totalPaid: number
  pendingWithdrawals: number
  totalPaidOut: number
}
type RecentUser = { id: string; name: string; username: string; email: string; balance: number; enabled: boolean; createdAt: string }
type RecentJob = { id: string; title: string; reward: number; featured: boolean; enabled: boolean; createdAt: string }
type RecentWithdrawal = { id: string; amount: number; method: string; status: string; createdAt: string; user: { name: string; username: string } }
type AdminData = { stats: Stats; recentUsers: RecentUser[]; recentJobs: RecentJob[]; recentWithdrawals: RecentWithdrawal[] }

const wdStatusStyle: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  approved: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  rejected: 'bg-destructive/10 text-destructive',
}

export function AdminOverview() {
  const { t, lang } = useT()
  const setAdminView = useAppStore((s) => s.setAdminView)
  const [data, setData] = useState<AdminData | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const res = await api<AdminData>('/api/admin/stats')
      if (!alive) return
      if (res.ok && res.data) setData(res.data)
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

  const stats = [
    { icon: Users, label: t('totalUsers'), value: formatNumber(data.stats.totalUsers, lang), color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
    { icon: Briefcase, label: t('totalJobs'), value: formatNumber(data.stats.totalJobs, lang), color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
    { icon: CheckCircle2, label: t('activeJobs'), value: formatNumber(data.stats.activeJobs, lang), color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    { icon: TrendingUp, label: t('totalSubmissions'), value: formatNumber(data.stats.totalSubmissions, lang), color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  ]

  return (
    <div className="space-y-5 animate-view-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('overview')}</h1>
          <p className="text-sm text-muted-foreground">{t('quickStats')}</p>
        </div>
        {data.stats.pendingWithdrawals > 0 && (
          <button
            onClick={() => setAdminView('admin-withdrawals')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-colors"
          >
            <Clock className="size-3.5 animate-pulse" />
            {formatNumber(data.stats.pendingWithdrawals, lang)} {t('pending')}
          </button>
        )}
      </div>

      {/* stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <Card key={label} className="p-4">
            <div className={`size-9 rounded-lg grid place-items-center mb-2 ${color}`}>
              <Icon className="size-5" />
            </div>
            <p className="text-2xl font-bold leading-none">{value}</p>
            <p className="text-xs text-muted-foreground mt-1.5">{label}</p>
          </Card>
        ))}
      </div>

      {/* earnings + withdrawals dual summary */}
      <div className="grid sm:grid-cols-2 gap-3">
        {/* total earned */}
        <div className="rounded-2xl bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground p-5 shadow-lg">
          <p className="text-sm opacity-90 flex items-center gap-1.5">
            <Coins className="size-4" /> {t('totalEarned')} ({t('earning')})
          </p>
          <p className="text-3xl font-bold mt-1">{formatMoney(data.stats.totalPaid, t('taka'), lang)}</p>
        </div>
        {/* total paid out */}
        <div className="rounded-2xl border bg-card p-5">
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <ArrowDownToLine className="size-4" /> {t('totalPaidOut')}
          </p>
          <p className="text-3xl font-bold mt-1 text-foreground">{formatMoney(data.stats.totalPaidOut, t('taka'), lang)}</p>
          {data.stats.pendingWithdrawals > 0 && (
            <button
              onClick={() => setAdminView('admin-withdrawals')}
              className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 hover:underline"
            >
              {formatNumber(data.stats.pendingWithdrawals, lang)} {t('pendingWithdrawals').toLowerCase()} <ArrowRight className="size-3" />
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* recent users */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">{t('recentUsers')}</h3>
            <button
              onClick={() => setAdminView('admin-users')}
              className="text-xs text-primary font-medium flex items-center gap-1"
            >
              {t('manageUsers')} <ArrowRight className="size-3" />
            </button>
          </div>
          {data.recentUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">{t('noUsersYet')}</p>
          ) : (
            <div className="space-y-2">
              {data.recentUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-3 py-1.5">
                  <div className="size-8 rounded-full bg-muted grid place-items-center text-xs font-bold shrink-0">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{timeAgo(u.createdAt, lang)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* recent jobs */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">{t('recentJobs')}</h3>
            <button
              onClick={() => setAdminView('admin-jobs')}
              className="text-xs text-primary font-medium flex items-center gap-1"
            >
              {t('manageJobs')} <ArrowRight className="size-3" />
            </button>
          </div>
          {data.recentJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">{t('noJobsYet')}</p>
          ) : (
            <div className="space-y-2">
              {data.recentJobs.map((j) => (
                <div key={j.id} className="flex items-center gap-3 py-1.5">
                  <div className="size-8 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                    <Briefcase className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{j.title}</p>
                    <p className="text-xs text-muted-foreground">{formatMoney(j.reward, t('taka'), lang)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {j.featured && <Badge variant="secondary" className="text-[9px] h-4 px-1">★</Badge>}
                    <span className={`size-2 rounded-full ${j.enabled ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* recent withdrawals */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">{t('recentWithdrawals')}</h3>
          <button
            onClick={() => setAdminView('admin-withdrawals')}
            className="text-xs text-primary font-medium flex items-center gap-1"
          >
            {t('manageWithdrawals')} <ArrowRight className="size-3" />
          </button>
        </div>
        {data.recentWithdrawals.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">{t('noWithdrawalsYet')}</p>
        ) : (
          <div className="space-y-2">
            {data.recentWithdrawals.map((w) => (
              <div key={w.id} className="flex items-center gap-3 py-1.5">
                <div className={`size-8 rounded-lg grid place-items-center shrink-0 ${wdStatusStyle[w.status] || wdStatusStyle.pending}`}>
                  <ArrowDownToLine className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{w.user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">@{w.user.username} · {t(w.method as any) || w.method}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{formatMoney(w.amount, t('taka'), lang)}</p>
                  <Badge variant="outline" className={`text-[9px] h-4 px-1 mt-0.5 border-0 ${wdStatusStyle[w.status] || wdStatusStyle.pending}`}>
                    {t(w.status as any)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
