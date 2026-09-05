'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wallet, Globe, Sun, Moon, Eye, EyeOff, TrendingUp, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/store/use-app-store'
import { useT } from '@/hooks/use-t'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import { dict } from '@/lib/i18n'

type Mode = 'login' | 'register'

export function AuthScreen() {
  const { t, lang } = useT()
  const { setUser, setLang, lang: curLang } = useAppStore()
  const { theme, setTheme } = useTheme()
  const [mode, setMode] = useState<Mode>('login')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  // login fields
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  // register fields
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const d = dict[curLang]

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (mode === 'register') {
      if (!name.trim() || name.trim().length < 2) e.name = d.minName
      if (!username.trim() || username.trim().length < 3) e.username = d.minUsername
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = d.invalidEmail
    } else {
      if (!identifier.trim()) e.identifier = d.required
    }
    if (!password || password.length < 6) e.password = d.minPassword
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setErrors({})
    const path = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
    // capture ref from URL (?ref=username) for referral tracking
    const refParam = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('ref')
      : null
    const body =
      mode === 'login'
        ? { identifier: identifier.trim(), password }
        : { name: name.trim(), username: username.trim(), email: email.trim(), password, ...(refParam ? { ref: refParam } : {}) }
    const res = await api<{ user?: any; error?: string; fields?: Record<string, string> }>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    setLoading(false)
    if (!res.ok || !res.data?.user) {
      if (res.data?.fields) {
        const mapped: Record<string, string> = {}
        for (const [k, v] of Object.entries(res.data.fields)) mapped[k] = d[v as keyof typeof d] || v
        setErrors(mapped)
      } else {
        const key = (res.data?.error || 'invalidCredentials') as keyof typeof d
        toast.error(d[key] || res.error || 'Error')
      }
      return
    }
    setUser(res.data.user)
    toast.success(mode === 'login' ? d.loginSuccess : d.registerSuccess)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/8 via-background to-background">
      {/* top controls */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-xl bg-primary text-primary-foreground grid place-items-center shadow-sm">
            <Wallet className="size-5" />
          </div>
          <span className="font-bold text-lg">{t('appName')}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLang(curLang === 'bn' ? 'en' : 'bn')}
            aria-label="Language"
            className="rounded-full"
          >
            <Globe className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Theme"
            className="rounded-full"
          >
            {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>
        </div>
      </div>

      {/* hero */}
      <div className="px-6 pt-4 pb-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          {t('appTagline')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {mode === 'login' ? t('loginSubtitle') : t('registerSubtitle')}
        </p>
      </div>

      {/* form card */}
      <div className="flex-1 flex items-start sm:items-center justify-center px-4 pb-8 pt-4">
        <div className="w-full max-w-md">
          <div className="bg-card border rounded-2xl shadow-sm p-5 sm:p-6">
            {/* mode tabs */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-xl mb-5">
              <button
                type="button"
                onClick={() => { setMode('login'); setErrors({}) }}
                className={`py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === 'login' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
                }`}
              >
                {t('login')}
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setErrors({}) }}
                className={`py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === 'register' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
                }`}
              >
                {t('register')}
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-3.5">
              {mode === 'register' && (
                <>
                  <Field label={t('name')} error={errors.name}>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={curLang === 'bn' ? 'আপনার নাম' : 'Your name'}
                      autoComplete="name"
                      className="h-11"
                    />
                  </Field>
                  <Field label={t('username')} error={errors.username}>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="username"
                      autoComplete="username"
                      className="h-11"
                    />
                  </Field>
                  <Field label={t('email')} error={errors.email}>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="h-11"
                    />
                  </Field>
                </>
              )}

              {mode === 'login' && (
                <Field label={t('email') + ' / ' + t('username')} error={errors.identifier}>
                  <Input
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="username"
                    className="h-11"
                  />
                </Field>
              )}

              <Field label={t('password')} error={errors.password}>
                <div className="relative">
                  <Input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
                    aria-label="Toggle password"
                  >
                    {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </Field>

              <Button type="submit" size="lg" className="w-full h-12 text-base" disabled={loading}>
                {loading ? <Loader2 className="size-5 animate-spin" /> : mode === 'login' ? t('login') : t('register')}
              </Button>
            </form>

            {/* switch mode */}
            <div className="text-center text-sm text-muted-foreground mt-4">
              {mode === 'login' ? t('noAccount') : t('haveAccount')}{' '}
              <button
                type="button"
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErrors({}) }}
                className="text-primary font-semibold hover:underline"
              >
                {mode === 'login' ? t('register') : t('login')}
              </button>
            </div>
          </div>

          {/* admin hint */}
          <p className="text-center text-xs text-muted-foreground mt-4 px-4">
            {t('adminHint')}
          </p>

          {/* feature strip */}
          <div className="hidden sm:flex items-center justify-center gap-6 mt-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><TrendingUp className="size-3.5" /> {curLang === 'bn' ? 'তাৎক্ষণিক পুরস্কার' : 'Instant rewards'}</span>
            <span className="flex items-center gap-1.5"><Wallet className="size-3.5" /> {curLang === 'bn' ? 'সহজ উত্তোলন' : 'Easy wallet'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
