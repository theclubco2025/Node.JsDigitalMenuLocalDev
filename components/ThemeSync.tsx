'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function ThemeSync() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const qs = searchParams?.toString()
    const url = `/api/theme${qs ? `?${qs}` : ''}`
    fetch(url, { cache: 'no-store' })
      .then(res => res.ok ? res.json() : null)
      .then(theme => {
        if (!theme) return
        if (theme.primary) document.body.style.setProperty('--primary', theme.primary)
        if (theme.accent) document.body.style.setProperty('--accent', theme.accent)
        if (theme.radius) document.body.style.setProperty('--radius', theme.radius)
      })
      .catch(() => {})
  }, [searchParams])

  return null
}
