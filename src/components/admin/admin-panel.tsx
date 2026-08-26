'use client'

import { useEffect } from 'react'
import { LayoutDashboard, Briefcase, Users as UsersIcon, Globe, Sun, Moon, ExternalLink, ArrowDownToLine, Megaphone } from 'lucide-react'
import { useAppStore, type AdminView } from '@/store/use-app-store'
import { useT } from '@/hooks/use-t'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AdminOverview } from '@/components/admin/admin-overview'
import { AdminJobsManager } from '@/components/admin/admin-jobs-manager'
import { AdminJobForm } from '@/components/admin/admin-job-form'
import { AdminUsersManager } from '@/components/admin/admin-users-manager'
import { AdminWithdrawalsManager } from '@/components/admin/admin-withdrawals-manager'
import { BroadcastDialog } from '@/components/admin/broadcast-dialog'
import { useState } from 'react'

const tabs: { key: AdminView; tKey: 'overview' | 'manageJobs' | 'manageUsers' | 'withdrawals'; icon: typeof LayoutDashboard }[] = [
  { key: 'admin-overview', tKey: 'overview', icon: LayoutDashboard },
  { key: 'admin-jobs', tKey: 'manageJobs', icon: Briefcase },
  { key: 'admin-users', tKey: 'manageUsers', icon: UsersIcon },
  { key: 'admin-withdrawals', tKey: 'withdrawals', icon: ArrowDownToLine },
]

export function AdminPanel() {
  const { t } = useT()
  const adminView = useAppStore((s) => s.adminView)
  const setAdminView = useAppStore((s) => s.setAdminView)
  const setAdminAsUser = useAppStore((s) => s.setAdminAsUser)
  const curLang = useAppStore((s) => s.lang)
  const setLang = useAppStore((s) => s.setLang)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    document.documentElement.lang = curLang
  }, [curLang])

  // when showing the job form, no tab is "active" — treat as Jobs context
  const activeTab: AdminView = adminView === 'admin-job-form' ? 'admin-jobs' : adminView
  const [broadcastOpen, setBroadcastOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary text-primary-foreground grid place-items-center">
              <Briefcase className="size-4.5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">{t('appName')}</span>
              <Badge variant="secondary" className="text-[10px] hidden sm:inline-flex">{t('adminPanel')}</Badge>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBroadcastOpen(true)}
              className="h-9"
            >
              <Megaphone className="size-4" />
              <span className="hidden sm:inline">{t('broadcast')}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAdminAsUser(true)}
              className="h-9"
            >
              <ExternalLink className="size-4" />
              <span className="hidden sm:inline">{t('viewSite')}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 rounded-full"
              onClick={() => setLang(curLang === 'bn' ? 'en' : 'bn')}
              aria-label="Language"
            >
              <Globe className="size-4.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 rounded-full"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Theme"
            >
              {theme === 'dark' ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
            </Button>
          </div>
        </div>

        {/* tabs */}
        {adminView !== 'admin-job-form' && (
          <div className="border-t">
            <div className="mx-auto max-w-5xl px-2 flex overflow-x-auto no-scrollbar">
              {tabs.map(({ key, tKey, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setAdminView(key)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                    activeTab === key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="size-4" />
                  {t(tKey)}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* content */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-5 pb-10">
        <div key={adminView} className="animate-view-in">
          {adminView === 'admin-overview' && <AdminOverview />}
          {adminView === 'admin-jobs' && <AdminJobsManager />}
          {adminView === 'admin-users' && <AdminUsersManager />}
          {adminView === 'admin-withdrawals' && <AdminWithdrawalsManager />}
          {adminView === 'admin-job-form' && <AdminJobForm />}
        </div>
      </main>

      <BroadcastDialog open={broadcastOpen} onOpenChange={setBroadcastOpen} />
    </div>
  )
}
