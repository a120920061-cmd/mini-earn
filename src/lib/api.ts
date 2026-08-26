// Thin fetch wrapper used across client components.
export async function api<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<{ ok: boolean; data?: T; error?: string; status: number }> {
  try {
    const res = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      cache: 'no-store',
    })
    const isJson = res.headers.get('content-type')?.includes('application/json')
    const body = isJson ? await res.json().catch(() => ({})) : {}
    if (!res.ok) {
      return { ok: false, error: body?.error || `Request failed (${res.status})`, status: res.status }
    }
    return { ok: true, data: body as T, status: res.status }
  } catch (e) {
    return { ok: false, error: (e as Error).message || 'Network error', status: 0 }
  }
}

// --- Bangla numeral conversion ---
const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']

function toBnDigits(s: string): string {
  return s.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)])
}

/** Format a money amount. When lang === 'bn', digits are rendered in Bengali numerals. */
export function formatMoney(n: number, currency = '৳', lang: 'bn' | 'en' = 'en') {
  const safe = Number.isFinite(n) ? n : 0
  const fixed = (Math.round(safe * 100) / 100).toFixed(2)
  const out = `${currency}${lang === 'bn' ? toBnDigits(fixed) : fixed}`
  return out
}

/** Format a plain integer, respecting Bangla numerals when lang === 'bn'. */
export function formatNumber(n: number, lang: 'bn' | 'en' = 'en') {
  const safe = Number.isFinite(n) ? Math.round(n) : 0
  const s = String(safe)
  return lang === 'bn' ? toBnDigits(s) : s
}

export function timeAgo(date: Date | string, lang: 'bn' | 'en' = 'en') {
  const d = typeof date === 'string' ? new Date(date) : date
  const diff = Date.now() - d.getTime()
  const sec = Math.floor(diff / 1000)
  const min = Math.floor(sec / 60)
  const hr = Math.floor(min / 60)
  const day = Math.floor(hr / 24)
  const bn = lang === 'bn'
  if (sec < 60) return bn ? 'এইমাত্র' : 'just now'
  if (min < 60) return bn ? `${toBnDigits(String(min))} মিনিট আগে` : `${min}m ago`
  if (hr < 24) return bn ? `${toBnDigits(String(hr))} ঘন্টা আগে` : `${hr}h ago`
  if (day < 7) return bn ? `${toBnDigits(String(day))} দিন আগে` : `${day}d ago`
  try {
    return d.toLocaleDateString(bn ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short' })
  } catch {
    return bn ? toBnDigits(d.toLocaleDateString()) : d.toLocaleDateString()
  }
}

/** Format an ISO date as a short readable date. */
export function formatDate(date: Date | string, lang: 'bn' | 'en' = 'en') {
  const d = typeof date === 'string' ? new Date(date) : date
  try {
    return d.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return d.toLocaleDateString()
  }
}
