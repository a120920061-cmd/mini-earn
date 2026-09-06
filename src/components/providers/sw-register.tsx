'use client'

import { useEffect } from 'react'

/**
 * Service worker registration.
 *
 * NOTE: The /sw.js file now serves the Monetag verification service worker.
 * The PWA offline service worker has been replaced. Monetag's sw.js is
 * loaded automatically via its own importScripts mechanism.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    // Monetag service worker registration — registers /sw.js at root
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    const register = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .catch(() => {
          // registration failed — silently ignore
        })
    }

    if (document.readyState === 'complete') {
      register()
    } else {
      window.addEventListener('load', register)
      return () => window.removeEventListener('load', register)
    }
  }, [])

  return null
}
