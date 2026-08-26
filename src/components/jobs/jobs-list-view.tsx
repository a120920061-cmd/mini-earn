'use client'

import { useEffect, useState } from 'react'
import { Loader2, SearchX, Heart, ArrowDownUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { JobCard, type JobItem } from '@/components/jobs/job-card'
import { CategoriesExplore } from '@/components/jobs/categories-explore'
import { useAppStore } from '@/store/use-app-store'
import { useT } from '@/hooks/use-t'
import { api, formatNumber } from '@/lib/api'
import { cn } from '@/lib/utils'

export function JobsListView() {
  const { t, lang } = useT()
  const openJob = useAppStore((s) => s.openJob)
  const setView = useAppStore((s) => s.setView)
  const refreshKey = useAppStore((s) => s.refreshKey)
  const [jobs, setJobs] = useState<JobItem[] | null>(null)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<string>('all')
  const [favOnly, setFavOnly] = useState(false)
  const [sort, setSort] = useState<'featured' | 'reward-high' | 'reward-low' | 'newest'>('featured')

  useEffect(() => {
    let alive = true
    ;(async () => {
      const res = await api<{ jobs: JobItem[] }>('/api/jobs')
      if (!alive) return
      if (res.ok && res.data) setJobs(res.data.jobs)
      else setJobs([])
    })()
    return () => { alive = false }
  }, [refreshKey])

  const cats = Array.from(new Set((jobs || []).map((j) => j.category || 'general')))
  const filtered = (jobs || []).filter((j) => {
    const matchesCat = cat === 'all' || j.category === cat
    const matchesQ =
      !q ||
      j.title.toLowerCase().includes(q.toLowerCase()) ||
      j.description.toLowerCase().includes(q.toLowerCase())
    const matchesFav = !favOnly || j.favorited
    return matchesCat && matchesQ && matchesFav
  })

  // sort the filtered list
  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case 'reward-high':
        return Number(b.reward) - Number(a.reward)
      case 'reward-low':
        return Number(a.reward) - Number(b.reward)
      case 'newest':
        return (b.createdAt || '').localeCompare(a.createdAt || '')
      case 'featured':
      default:
        // featured first, then by reward desc
        if (a.featured !== b.featured) return a.featured ? -1 : 1
        return Number(b.reward) - Number(a.reward)
    }
  })

  const favCount = (jobs || []).filter((j) => j.favorited).length

  // category counts for the explore grid
  const catCounts = (jobs || []).reduce<Record<string, number>>((acc, j) => {
    const c = j.category || 'general'
    acc[c] = (acc[c] || 0) + 1
    return acc
  }, {})
  const catList = Object.entries(catCounts).map(([category, count]) => ({ category, count }))

  // show explore grid only when no active filter/search
  const showExplore = !q && cat === 'all' && !favOnly

  if (jobs === null) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-view-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('jobs')}</h1>
          <p className="text-sm text-muted-foreground">
            {formatNumber(jobs.length, lang)} {t('availableJobs').toLowerCase()}
          </p>
        </div>
        <button
          onClick={() => setView('completed-jobs')}
          className="text-xs text-primary font-medium hover:underline shrink-0"
        >
          {t('completedHistory')}
        </button>
      </div>

      {/* search + sort */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('search')}
            className="h-11 pl-4"
          />
          {q && (
            <button
              onClick={() => setQ('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm px-2"
            >
              ✕
            </button>
          )}
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as any)}>
          <SelectTrigger className="h-11 w-[130px] shrink-0">
            <ArrowDownUp className="size-4 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">{t('sortFeatured')}</SelectItem>
            <SelectItem value="reward-high">{t('sortRewardHigh')}</SelectItem>
            <SelectItem value="reward-low">{t('sortRewardLow')}</SelectItem>
            <SelectItem value="newest">{t('sortNewest')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* categories explore grid (only when no filter active) */}
      {showExplore && catList.length > 1 && (
        <CategoriesExplore
          categories={catList}
          onSelect={(c) => { setCat(c); setFavOnly(false) }}
        />
      )}

      {/* filter chips: favorites + categories */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
        {/* favorites filter */}
        <button
          onClick={() => setFavOnly((f) => !f)}
          className={cn(
            'shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors border flex items-center gap-1.5',
            favOnly
              ? 'bg-red-500 text-white border-red-500'
              : 'bg-card text-muted-foreground border-border'
          )}
        >
          <Heart className={cn('size-3.5', favOnly && 'fill-current')} />
          {t('favorites')}
          {favCount > 0 && (
            <span className={cn(
              'text-[9px] font-bold px-1 rounded-full',
              favOnly ? 'bg-white/25' : 'bg-muted'
            )}>
              {formatNumber(favCount, lang)}
            </span>
          )}
        </button>
        <Chip active={cat === 'all' && !favOnly} onClick={() => { setCat('all'); setFavOnly(false) }}>
          {t('all')}
        </Chip>
        {cats.map((c) => (
          <Chip key={c} active={cat === c && !favOnly} onClick={() => { setCat(c); setFavOnly(false) }}>
            {c}
          </Chip>
        ))}
      </div>

      {/* list */}
      {sorted.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="size-16 rounded-2xl bg-muted grid place-items-center mx-auto mb-4">
            {favOnly ? <Heart className="size-8 text-muted-foreground" /> : <SearchX className="size-8 text-muted-foreground" />}
          </div>
          <p className="font-semibold mb-1">{favOnly ? t('noFavorites') : t('noJobsAvailable')}</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            {favOnly ? t('noFavoritesDesc') : t('noJobsAvailableDesc')}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((job) => (
            <JobCard key={job.id} job={job} onStart={openJob} />
          ))}
        </div>
      )}
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors border ${
        active ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border'
      }`}
    >
      {children}
    </button>
  )
}
