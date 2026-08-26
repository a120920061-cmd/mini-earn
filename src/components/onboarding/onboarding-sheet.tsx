'use client'

import { useEffect, useState } from 'react'
import { Rocket, ListChecks, Send, Wallet, ArrowDownToLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { useAppStore } from '@/store/use-app-store'
import { useT } from '@/hooks/use-t'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'me-onboarding-seen'

type Step = {
  icon: typeof ListChecks
  titleKey: 'step1Title' | 'step2Title' | 'step3Title' | 'step4Title'
  descKey: 'step1Desc' | 'step2Desc' | 'step3Desc' | 'step4Desc'
  color: string
}

const steps: Step[] = [
  { icon: ListChecks, titleKey: 'step1Title', descKey: 'step1Desc', color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
  { icon: Send, titleKey: 'step2Title', descKey: 'step2Desc', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  { icon: Wallet, titleKey: 'step3Title', descKey: 'step3Desc', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  { icon: ArrowDownToLine, titleKey: 'step4Title', descKey: 'step4Desc', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
]

export function OnboardingSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const { t } = useT()
  const setView = useAppStore((s) => s.setView)

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, '1') } catch {}
    onOpenChange(false)
  }

  function startNow() {
    dismiss()
    setView('jobs')
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) dismiss(); onOpenChange(o) }}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <div className="size-14 rounded-2xl bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground grid place-items-center mx-auto mb-2 shadow-lg">
            <Rocket className="size-7" />
          </div>
          <SheetTitle className="text-center">{t('howItWorks')}</SheetTitle>
          <SheetDescription className="text-center">{t('howItWorksDesc')}</SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-8 pt-4 space-y-4">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={i} className="flex items-start gap-3">
                <div className="relative shrink-0">
                  <div className={cn('size-11 rounded-xl grid place-items-center', step.color)}>
                    <Icon className="size-5" />
                  </div>
                  <span className="absolute -top-1 -right-1 size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold grid place-items-center">
                    {i + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <p className="font-semibold leading-tight">{t(step.titleKey)}</p>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{t(step.descKey)}</p>
                </div>
              </div>
            )
          })}

          <div className="pt-4 space-y-2">
            <Button className="w-full h-12" onClick={startNow}>
              {t('startNow')}
            </Button>
            <Button variant="ghost" className="w-full" onClick={dismiss}>
              {t('gotIt')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/** Hook that returns whether to show the onboarding (first visit only). */
export function useOnboarding() {
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY)
      if (!seen) {
        const id = setTimeout(() => setShouldShow(true), 800)
        return () => clearTimeout(id)
      }
    } catch {}
  }, [])

  return { shouldShow, setShow: setShouldShow }
}
