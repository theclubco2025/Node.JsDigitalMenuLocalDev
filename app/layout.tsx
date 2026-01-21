import type { Metadata } from 'next'
import { Inter, Italiana, Lora } from 'next/font/google'
import './globals.css'
import { resolveTenant } from '@/lib/tenant'
import { getTheme } from '@/lib/theme'
import { type CSSProperties, Suspense } from 'react'
import Providers from '@/components/Providers'

const inter = Inter({ subsets: ['latin'] })
const italiana = Italiana({ weight: '400', subsets: ['latin'] })
const lora = Lora({ subsets: ['latin'] })

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

  const cssVars: CSSProperties = {
    '--primary': theme.primary,
    '--accent': theme.accent,
    '--radius': theme.radius,
    '--heading-font': italiana.style.fontFamily,
  } as CSSProperties

  return (
    <html lang="en">
      <body
        className={`${inter.className} ${lora.className}`}
        style={cssVars}
      >
        {/* Client-side theme sync so URL ?tenant controls theme without reload */}
        <Suspense>
          <ThemeSync />
        </Suspense>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

function ThemeSync() {
  if (typeof window === 'undefined') return null

  fetch(`/api/theme${window.location.search}`, { cache: 'no-store' })
    .then(res => res.ok ? res.json() : null)
    .then(theme => {
      if (!theme) return
      document.body.style.setProperty('--primary', theme.primary)
      document.body.style.setProperty('--accent', theme.accent)
      document.body.style.setProperty('--radius', theme.radius)
    })
    .catch(() => {})
  return null
}
