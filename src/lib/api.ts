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

export function formatMoney(n: number, currency = '৳') {
  const fixed = (Math.round(n * 100) / 100).toFixed(2)
  return `${currency}${fixed}`
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
  if (min < 60) return bn ? `${min} মিনিট আগে` : `${min}m ago`
  if (hr < 24) return bn ? `${hr} ঘন্টা আগে` : `${hr}h ago`
  if (day < 7) return bn ? `${day} দিন আগে` : `${day}d ago`
  return d.toLocaleDateString(bn ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short' })
}
