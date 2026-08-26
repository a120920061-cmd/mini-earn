'use client'

import { Download, Users, ClipboardList, ArrowDownToLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useT } from '@/hooks/use-t'
import { toast } from 'sonner'

export function ExportButtons() {
  const { t } = useT()

  function download(type: 'users' | 'submissions' | 'withdrawals') {
    // trigger a file download via a hidden link (keeps cookie auth)
    const a = document.createElement('a')
    a.href = `/api/admin/export?type=${type}`
    a.download = `${type}-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success(t('exportCsv'))
  }

  const buttons: { type: 'users' | 'submissions' | 'withdrawals'; label: string; icon: typeof Users }[] = [
    { type: 'users', label: t('exportUsers'), icon: Users },
    { type: 'submissions', label: t('exportSubmissions'), icon: ClipboardList },
    { type: 'withdrawals', label: t('exportWithdrawals'), icon: ArrowDownToLine },
  ]

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="size-7 rounded-lg bg-primary/10 text-primary grid place-items-center">
          <Download className="size-4" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">{t('exportData')}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">CSV</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {buttons.map(({ type, label, icon: Icon }) => (
          <Button
            key={type}
            variant="outline"
            size="sm"
            className="h-auto py-2.5 justify-start"
            onClick={() => download(type)}
          >
            <Icon className="size-4 shrink-0" />
            <span className="text-xs text-left leading-tight">{label}</span>
          </Button>
        ))}
      </div>
    </Card>
  )
}
