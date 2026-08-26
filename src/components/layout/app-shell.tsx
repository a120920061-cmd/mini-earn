'use client'

import { useEffect } from 'react'
import { Wallet, Globe, Sun, Moon, Home, Briefcase, Wallet as WalletIcon, User } from 'lucide-react'
import { useAppStore, type UserView } from '@/store/use-app-store'
import { useT } from '@/hooks/use-t'
import { useTheme } from 'next-themes'
import { formatMoney } from '@/lib/api'
import { cn } from '@/lib/utils'
import { DashboardView } from '@/components/dashboard/dashboard-view'
import { JobsListView } from '@/components/jobs/jobs-list-view'
import { JobDetailsView } from '@/components/jobs/job-details-view'
import { WalletView } from '@/components/wallet/wallet-view'
import { ProfileView } from '@/components/profile/profile-view'
import { LeaderboardView } from '@/components/leaderboard/leaderboard-view'
import { SettingsView } from '@/components/settings/settings-view'
import { BottomNav } from '@/components/layout/bottom-nav'
import { NotificationBell } from '@/components/layout/notification-bell'
import { Button } from '@/components/ui/button'

const navItems: { key: UserView; tKey: 'home' | 'jobs' | 'wallet' | 'profile'; icon: typeof Home }[] = [
  { key: 'dashboard', tKey: 'home', icon: Home },
  { key: 'jobs', tKey: 'jobs', icon: Briefcase },
  { key: 'wallet', tKey: 'wallet', icon: WalletIcon },
  { key: 'profile', tKey: 'profile', icon: User },
]

export function AppShell({ adminBanner = false }: { adminBanner?: boolean }) {
  const { t, lang } = useT()
  const user = useAppStore((s) => s.user)
  const view = useAppStore((s) => s.view)
  const setView = useAppStore((s) => s.setView)
  const curLang = useAppStore((s) => s.lang)
  const setLang = useAppStore((s) => s.setLang)
  const setAdminAsUser = useAppStore((s) => s.setAdminAsUser)
  const { theme, setTheme } = useTheme()

  // sync html lang attribute
  useEffect(() => {
    document.documentElement.lang = curLang
  }, [curLang])

  const activeTab: UserView = view === 'job-details' ? 'jobs' : view

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-2xl px-4 h-14 flex items-center justify-between gap-2">
          {/* brand */}
          <button
            onClick={() => setView('dashboard')}
            className="flex items-center gap-2 shrink-0"
          >
            <div className="size-8 rounded-lg bg-primary text-primary-foreground grid place-items-center">
              <Wallet className="size-4.5" />
            </div>
            <span className="font-bold hidden sm:block">{t('appName')}</span>
          </button>

          {/* desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ key, tKey, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  activeTab === key
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className="size-4" />
                {t(tKey)}
              </button>
            ))}
          </nav>

          {/* right controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-1 rounded-full bg-primary/8 px-2.5 py-1">
              <Wallet className="size-3.5 text-primary" />
              <span className="text-xs font-bold text-primary">
                {formatMoney(user?.balance || 0, t('taka'), lang)}
              </span>
            </div>
            <NotificationBell />
            <Button
              variant="ghost"
              size="icon"
              className="size-9 rounded-full hidden sm:inline-flex"
              onClick={() => setLang(curLang === 'bn' ? 'en' : 'bn')}
              aria-label="Language"
            >
              <Globe className="size-4.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 rounded-full hidden sm:inline-flex"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Theme"
            >
              {theme === 'dark' ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
            </Button>
          </div>
        </div>

        {/* admin banner */}
        {adminBanner && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-400">
            <div className="mx-auto max-w-2xl px-4 py-1.5 flex items-center justify-between text-xs">
              <span className="font-medium">{t('userView')}</span>
              <button
                onClick={() => setAdminAsUser(false)}
                className="underline font-semibold"
              >
                {t('backToAdmin')}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* content */}
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 pt-4 pb-28 md:pb-10">
        <div key={view} className="animate-view-in">
          {view === 'dashboard' && <DashboardView />}
          {view === 'jobs' && <JobsListView />}
          {view === 'job-details' && <JobDetailsView />}
          {view === 'wallet' && <WalletView />}
          {view === 'profile' && <ProfileView />}
          {view === 'leaderboard' && <LeaderboardView />}
          {view === 'settings' && <SettingsView />}
        </div>
      </main>

      {/* mobile bottom nav */}
      <BottomNav />
    </div>
  )
}
