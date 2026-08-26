import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Lang } from '@/lib/i18n'

export type UserView =
  | 'dashboard'
  | 'jobs'
  | 'wallet'
  | 'profile'
  | 'job-details'
  | 'leaderboard'
  | 'settings'

export type AdminView = 'admin-overview' | 'admin-jobs' | 'admin-users' | 'admin-job-form' | 'admin-withdrawals'

export type AppUser = {
  id: string
  name: string
  username: string
  email: string
  balance: number
  totalEarned: number
  isAdmin: boolean
  enabled: boolean
  streak: number
  bestStreak: number
  lastJobAt: string | null
}

interface AppState {
  // auth
  user: AppUser | null
  authLoading: boolean
  setUser: (u: AppUser | null) => void
  setAuthLoading: (b: boolean) => void
  logoutLocal: () => void

  // language (persisted)
  lang: Lang
  setLang: (l: Lang) => void
  toggleLang: () => void

  // navigation
  view: UserView
  adminView: AdminView
  selectedJobId: string | null
  editingJobId: string | null
  adminAsUser: boolean

  setView: (v: UserView) => void
  setAdminView: (v: AdminView) => void
  openJob: (id: string) => void
  editJob: (id: string | null) => void
  setAdminAsUser: (b: boolean) => void

  resetNav: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      authLoading: true,
      setUser: (u) => set({ user: u }),
      setAuthLoading: (b) => set({ authLoading: b }),
      logoutLocal: () =>
        set({ user: null, view: 'dashboard', adminView: 'admin-overview', selectedJobId: null, editingJobId: null, adminAsUser: false }),

      lang: 'bn',
      setLang: (l) => set({ lang: l }),
      toggleLang: () => set({ lang: get().lang === 'bn' ? 'en' : 'bn' }),

      view: 'dashboard',
      adminView: 'admin-overview',
      selectedJobId: null,
      editingJobId: null,
      adminAsUser: false,

      setView: (v) => set({ view: v }),
      setAdminView: (v) => set({ adminView: v }),
      openJob: (id) => set({ selectedJobId: id, view: 'job-details' }),
      editJob: (id) => set({ editingJobId: id, adminView: 'admin-job-form' }),
      setAdminAsUser: (b) => set({ adminAsUser: b, view: 'dashboard' }),

      resetNav: () => set({ view: 'dashboard', adminView: 'admin-overview', selectedJobId: null, editingJobId: null, adminAsUser: false }),
    }),
    {
      name: 'me-app-store',
      partialize: (s) => ({ lang: s.lang }) as AppState,
    }
  )
)
