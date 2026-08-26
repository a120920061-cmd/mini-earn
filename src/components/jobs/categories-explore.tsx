'use client'

import { Globe, Heart, Video, Download, FileText, Briefcase, ArrowRight } from 'lucide-react'
import { useT } from '@/hooks/use-t'
import { formatNumber } from '@/lib/api'
import { cn } from '@/lib/utils'

type CatCount = { category: string; count: number }

const categoryMeta: Record<string, { icon: typeof Globe; color: string; bg: string }> = {
  visit: { icon: Globe, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/10' },
  social: { icon: Heart, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-500/10' },
  media: { icon: Video, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10' },
  download: { icon: Download, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
  survey: { icon: FileText, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10' },
  general: { icon: Briefcase, color: 'text-primary', bg: 'bg-primary/10' },
}

export function CategoriesExplore({
  categories,
  onSelect,
}: {
  categories: CatCount[]
  onSelect: (cat: string) => void
}) {
  const { t, lang } = useT()

  if (categories.length === 0) return null

  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-semibold text-lg">{t('exploreCategories')}</h2>
        <p className="text-xs text-muted-foreground">{t('exploreCategoriesDesc')}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {categories.map(({ category, count }) => {
          const meta = categoryMeta[category] || categoryMeta.general
          const Icon = meta.icon
          return (
            <button
              key={category}
              onClick={() => onSelect(category)}
              className="group rounded-2xl border bg-card p-4 text-left transition-all hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <div className={cn('size-10 rounded-xl grid place-items-center', meta.bg)}>
                  <Icon className={cn('size-5', meta.color)} />
                </div>
                <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="font-semibold capitalize mt-2.5">{category}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatNumber(count, lang)} {t('jobsInCategory')}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
