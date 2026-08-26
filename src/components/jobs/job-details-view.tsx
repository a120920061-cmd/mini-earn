'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, ExternalLink, Loader2, CheckCircle2, Wallet, ListChecks, Coins, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store/use-app-store'
import { useT } from '@/hooks/use-t'
import { api, formatMoney } from '@/lib/api'
import { toast } from 'sonner'
import type { JobItem } from '@/components/jobs/job-card'

export function JobDetailsView() {
  const { t } = useT()
  const jobId = useAppStore((s) => s.selectedJobId)
  const setView = useAppStore((s) => s.setView)
  const setUser = useAppStore((s) => s.setUser)
  const user = useAppStore((s) => s.user)
  const [job, setJob] = useState<JobItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!jobId) { setView('jobs'); return }
    let alive = true
    ;(async () => {
      setLoading(true)
      const res = await api<{ job: JobItem }>(`/api/jobs/${jobId}`)
      if (!alive) return
      if (res.ok && res.data) setJob(res.data.job)
      else setJob(null)
      setLoading(false)
    })()
    return () => { alive = false }
  }, [jobId])

  async function submit() {
    if (!job) return
    setSubmitting(true)
    const res = await api<{ balance: number; totalEarned: number; reward: number }>(
      `/api/jobs/${job.id}/submit`,
      { method: 'POST', body: JSON.stringify({}) }
    )
    setSubmitting(false)
    if (!res.ok) {
      const key = (res.data?.error || 'server_error') as any
      toast.error(t(key) || res.error || 'Error')
      if (res.data?.error === 'alreadyCompleted') {
        setJob({ ...job, completed: true })
      }
      return
    }
    setJob({ ...job, completed: true })
    if (user) {
      setUser({
        ...user,
        balance: res.data!.balance,
        totalEarned: res.data!.totalEarned,
      })
    }
    toast.success(t('rewardAdded'), {
      description: `${formatMoney(res.data!.reward, t('taka'))}`,
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">{t('noJobsAvailable')}</p>
        <Button className="mt-4" onClick={() => setView('jobs')}>{t('back')}</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-view-in pb-4">
      {/* back */}
      <button
        onClick={() => setView('jobs')}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        {t('back')}
      </button>

      {/* hero */}
      <div className="rounded-2xl border bg-card p-5">
        <Badge variant="secondary" className="mb-2 capitalize">{job.category || 'general'}</Badge>
        <h1 className="text-xl font-bold leading-tight">{job.title}</h1>
        <p className="text-sm text-muted-foreground mt-1.5">{job.description}</p>

        <div className="flex items-center gap-3 mt-4">
          <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2">
            <Coins className="size-4 text-primary" />
            <span className="text-sm text-muted-foreground">{t('reward')}</span>
            <span className="font-bold text-primary">{formatMoney(job.reward, t('taka'))}</span>
          </div>
        </div>
      </div>

      {/* instructions */}
      <Card className="p-5 space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <ListChecks className="size-4 text-primary" />
          {t('instructions')}
        </h2>
        <ol className="space-y-2.5">
          {job.instructions
            ? job.instructions
                .split('\n')
                .filter((s) => s.trim())
                .map((line, i) => {
                  const text = line.replace(/^\d+\.\s*/, '').trim()
                  return (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="size-5 rounded-full bg-primary/10 text-primary text-xs font-bold grid place-items-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-foreground/90 leading-relaxed">{text}</span>
                    </li>
                  )
                })
            : job.description}
        </ol>
      </Card>

      {/* job link */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-lg bg-muted grid place-items-center shrink-0">
              <Link2 className="size-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{t('jobLink')}</p>
              <p className="text-sm font-medium truncate">{job.link}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => window.open(job.link, '_blank', 'noopener,noreferrer')}
            aria-label={t('openLink')}
          >
            <ExternalLink className="size-4" />
          </Button>
        </div>
      </Card>

      {/* submit */}
      <div className="sticky bottom-20 md:bottom-4 z-30">
        {job.completed ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-4 py-3 flex items-center gap-2 font-medium">
            <CheckCircle2 className="size-5" />
            {t('jobCompleted')}
          </div>
        ) : (
          <Button
            size="lg"
            className="w-full h-12 text-base shadow-md"
            onClick={submit}
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                <Wallet className="size-5" />
                {t('submitJob')}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
