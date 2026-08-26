'use client'

import { Plus, Megaphone, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/use-app-store'
import { useT } from '@/hooks/use-t'

export function QuickActions({ onBroadcast }: { onBroadcast: () => void }) {
  const { t } = useT()
  const editJob = useAppStore((s) => s.editJob)
  const setAdminView = useAppStore((s) => s.setAdminView)

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="size-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 grid place-items-center">
          <Zap className="size-4" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">{t('quickActions')}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          className="h-auto py-3 flex-col gap-1.5"
          onClick={() => editJob(null)}
        >
          <Plus className="size-5 text-primary" />
          <span className="text-xs font-medium">{t('quickAddJob')}</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-3 flex-col gap-1.5"
          onClick={onBroadcast}
        >
          <Megaphone className="size-5 text-amber-600" />
          <span className="text-xs font-medium">{t('quickBroadcast')}</span>
        </Button>
      </div>
    </Card>
  )
}
