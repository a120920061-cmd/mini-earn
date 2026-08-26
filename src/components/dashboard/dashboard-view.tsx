'use client'

import { useEffect, useState } from 'react'
import { Wallet, TrendingUp, CheckCircle2, ArrowRight, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { JobCard, type JobItem } from '@/components/jobs/job-card'
import { useAppStore } from '@/store/use-app-store'
import { useT } from '@/hooks/use-t'
import { api, formatMoney, formatNumber } from '@/lib/api'
import { WeeklyEarningsChart } from '@/components/dashboard/weekly-chart'
import { TopEarnersPreview } from '@/components/dashboard/top-earners-preview'
import { StreakCard } from '@/components/dashboard/streak-card'

type DashData = {
  user: { name: string; balance: number; totalEarned: number; streak: number; bestStreak: number; lastJobAt: string | null }
  featured: JobItem[]
  stats: { completedJobs: number; availableJobs: number }
}

export function DashboardView() {
  const { t, lang } = useT()
  const user = useAppStore((s) => s.user)
  const openJob = useAppStore((s) => s.openJob)
  const setView = useAppStore((s) => s.setView)
  const setUser = useAppStore((s) => s.setUser)
  const refreshKey = useAppStore((s) => s.refreshKey)
  const [data, setData] = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      const res = await api<DashData>('/api/dashboard')
      if (!alive) return
      if (res.ok && res.data) {
        setData(res.data)
        setUser({
          ...useAppStore.getState().user!,
          balance: res.data.user.balance,
          totalEarned: res.data.user.totalEarned,
          streak: res.data.user.streak,
          bestStreak: res.data.user.bestStreak,
          lastJobAt: res.data.user.lastJobAt,
        } as any)
      }
      setLoading(false)
    })()
    return () => { alive = false }
  }, [refreshKey])

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const name = user?.name || data.user.name

  return (
    <div className="space-y-5 animate-view-in">
      {/* greeting */}
      <div>
        <p className="text-sm text-muted-foreground">{t('welcome')},</p>
        <h1 className="text-2xl font-bold tracking-tight">{name} 👋</h1>
      </div>

      {/* balance card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground p-5 shadow-lg">
        <div className="absolute -right-6 -top-6 size-32 rounded-full bg-white/10" />
        <div className="absolute -right-10 bottom-2 size-24 rounded-full bg-white/5" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <span className="text-sm opacity-90 flex items-center gap-1.5">
              <Wallet className="size-4" /> {t('balance')}
            </span>
            <Sparkles className="size-4 opacity-80" />
          </div>
          <p className="text-4xl font-bold mt-2 tracking-tight">
            {formatMoney(data.user.balance, t('taka'), lang)}
          </p>
          <div className="flex items-center gap-4 mt-4 text-sm">
            <span className="flex items-center gap-1.5 opacity-95">
              <TrendingUp className="size-4" />
              {t('totalEarned')}: <b>{formatMoney(data.user.totalEarned, t('taka'), lang)}</b>
            </span>
          </div>
        </div>
      </div>

      {/* quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<CheckCircle2 className="size-5" />}
          value={formatNumber(data.stats.completedJobs, lang)}
          label={t('completedJobs')}
        />
        <StatCard
          icon={<Briefcase />}
          value={formatNumber(data.stats.availableJobs, lang)}
          label={t('availableJobs')}
        />
      </div>

      {/* daily streak */}
      <StreakCard />

      {/* weekly earnings chart */}
      <WeeklyEarningsChart />

      {/* top earners preview */}
      <TopEarnersPreview />

      {/* available jobs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">{t('availableJobs')}</h2>
            <p className="text-xs text-muted-foreground">{t('availableJobsDesc')}</p>
          </div>
        </div>

        {data.featured.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="size-14 rounded-2xl bg-primary/10 text-primary grid place-items-center mx-auto mb-3">
              <Briefcase />
            </div>
            <p className="font-semibold mb-1">{t('startEarning')}</p>
            <p className="text-sm text-muted-foreground mb-4">{t('startFirstJob')}</p>
            <Button size="sm" onClick={() => setView('jobs')}>
              {t('browseJobs')}
              <ArrowRight className="size-4" />
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {data.featured.map((job) => (
              <JobCard key={job.id} job={job} onStart={openJob} />
            ))}
          </div>
        )}

        <Button
          variant="outline"
          className="w-full h-11"
          onClick={() => setView('jobs')}
        >
          {t('viewAllJobs')}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="size-9 rounded-lg bg-primary/10 text-primary grid place-items-center mb-2">
        {icon}
      </div>
      <p className="text-2xl font-bold leading-none">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  )
}

function Briefcase() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="7" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  )
}
