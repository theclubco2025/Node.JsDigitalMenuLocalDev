import type { Metadata } from 'next'
import { Inter, Playfair_Display, Italianno } from 'next/font/google'
import './globals.css'
import { resolveTenant } from '@/lib/tenant'
import { getTheme } from '@/lib/theme'
import { Suspense } from 'react'

const inter = Inter({ subsets: ['latin'] })
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400','600','700'] })
const italianno = Italianno({ subsets: ['latin'], weight: '400' })

export const metadata: Metadata = {
  title: 'Digital Menu SaaS',
  description: 'Smart restaurant menu system with AI assistant',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Initial theme from default tenant (SSR safety)
  const tenant = resolveTenant(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001')
  const theme = await getTheme(tenant)

  return (
    <html lang="en">
      <body
        className={inter.className}
        style={{
          // Provide CSS variables for theme usage
          ['--primary' as any]: theme.primary,
          ['--accent' as any]: theme.accent,
          ['--radius' as any]: theme.radius,
          ['--font-serif' as any]: playfair.style.fontFamily,
          ['--font-italian' as any]: italianno.style.fontFamily,
        }}
      >
        {/* Client-side theme sync so URL ?tenant controls theme without reload */}
        <Suspense>
          <ThemeSync />
        </Suspense>
        {children}
      </body>
    </html>
  )
}

function ThemeSync() {
  // This is a small client component embedded in layout to sync theme
  // eslint-disable-next-line react-hooks/rules-of-hooks
  if (typeof window === 'undefined') return null as any
  // Fetch theme for current URL tenant and apply CSS vars dynamically
  fetch(`/api/theme${window.location.search}`, { cache: 'no-store' })
    .then(res => res.ok ? res.json() : null)
    .then(theme => {
      if (!theme) return
      const body = document.body as any
      body.style.setProperty('--primary', theme.primary)
      body.style.setProperty('--accent', theme.accent)
      body.style.setProperty('--radius', theme.radius)
    })
    .catch(() => {})
  return null as any
}
