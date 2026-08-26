'use client'

import { useEffect } from 'react'

/**
 * Registers the service worker for PWA offline support. Only runs in
 * production to avoid caching issues during development.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    const register = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .catch(() => {
          // registration failed — silently ignore (offline support just won't work)
        })
    }

    // register after the page is fully loaded to avoid blocking
    if (document.readyState === 'complete') {
      register()
    } else {
      window.addEventListener('load', register)
      return () => window.removeEventListener('load', register)
    }
  }, [])

  return null
}
