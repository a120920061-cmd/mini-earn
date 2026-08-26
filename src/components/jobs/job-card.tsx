'use client'

import { Briefcase, CheckCircle2, ExternalLink, Globe, Heart, Download, FileText, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useT } from '@/hooks/use-t'
import { formatMoney } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Lang } from '@/lib/i18n'

export type JobItem = {
  id: string
  title: string
  description: string
  instructions?: string
  reward: number
  link: string
  category?: string
  featured?: boolean
  enabled?: boolean
  completed?: boolean
}

const categoryIcon: Record<string, typeof Globe> = {
  visit: Globe,
  social: Heart,
  media: Video,
  download: Download,
  survey: FileText,
  general: Briefcase,
}

const categoryColor: Record<string, string> = {
  visit: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  social: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  media: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  download: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  survey: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
  general: 'bg-primary/10 text-primary',
}

export function JobCard({
  job,
  onStart,
  compact = false,
}: {
  job: JobItem
  onStart?: (id: string) => void
  compact?: boolean
}) {
  const { t, lang } = useT()
  const cat = job.category || 'general'
  const Icon = categoryIcon[cat] || Briefcase
  const color = categoryColor[cat] || categoryColor.general
  const done = job.completed

  return (
    <div
      className={cn(
        'rounded-2xl border bg-card p-4 transition-all hover:shadow-md hover:border-primary/30',
        done && 'opacity-75'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('size-11 rounded-xl grid place-items-center shrink-0', color)}>
          <Icon className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight line-clamp-1">{job.title}</h3>
            {job.featured && !compact && (
              <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0 h-5">
                {t('featured')}
              </Badge>
            )}
          </div>
          {!compact && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{job.description}</p>
          )}
          <div className="flex items-center justify-between gap-2 mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-muted-foreground">{t('reward')}:</span>
              <span className="font-bold text-primary text-lg">{formatMoney(job.reward, t('taka'), lang)}</span>
            </div>
            {done ? (
              <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-500/30">
                <CheckCircle2 className="size-3.5" />
                {t('completed')}
              </Badge>
            ) : (
              <Button size="sm" className="h-9 px-4" onClick={() => onStart?.(job.id)}>
                {t('startJob')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export { ExternalLink }
