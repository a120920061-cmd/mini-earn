'use client'

import { Home, Briefcase, Wallet, User } from 'lucide-react'
import { useAppStore, type UserView } from '@/store/use-app-store'
import { useT } from '@/hooks/use-t'
import { cn } from '@/lib/utils'

const items: { key: UserView; iconKey: 'home' | 'jobs' | 'wallet' | 'profile'; icon: typeof Home }[] = [
  { key: 'dashboard', iconKey: 'home', icon: Home },
  { key: 'jobs', iconKey: 'jobs', icon: Briefcase },
  { key: 'wallet', iconKey: 'wallet', icon: Wallet },
  { key: 'profile', iconKey: 'profile', icon: User },
]

export function BottomNav() {
  const view = useAppStore((s) => s.view)
  const setView = useAppStore((s) => s.setView)
  const { t } = useT()

  // job-details is part of "jobs" tab context
  const activeKey: UserView = view === 'job-details' ? 'jobs' : view

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-card/95 backdrop-blur-md pb-safe"
      aria-label="Primary navigation"
    >
      <div className="grid grid-cols-4 h-16">
        {items.map(({ key, iconKey, icon: Icon }) => {
          const active = activeKey === key
          return (
            <button
              key={key}
              onClick={() => setView(key)}
              className="flex flex-col items-center justify-center gap-1 relative transition-colors"
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <span className="absolute top-0 h-1 w-8 rounded-b-full bg-primary" />
              )}
              <Icon
                className={cn(
                  'size-5 transition-all',
                  active ? 'text-primary scale-110' : 'text-muted-foreground'
                )}
                strokeWidth={active ? 2.5 : 2}
              />
              <span
                className={cn(
                  'text-[10px] font-medium leading-none',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {t(iconKey)}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
