'use client'

import { useAppStore } from '@/store/use-app-store'
import { dict, type DictKey } from '@/lib/i18n'

export function useT() {
  const lang = useAppStore((s) => s.lang)
  const t = (key: DictKey) => dict[lang][key] ?? dict.en[key] ?? key
  return { t, lang }
}
