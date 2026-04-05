import type { Metadata } from 'next'
import { Inter, Italiana, Lora } from 'next/font/google'
import './globals.css'
import { resolveTenant } from '@/lib/tenant'
import { getTheme } from '@/lib/theme'
import { type CSSProperties, Suspense } from 'react'
import Providers from '@/components/Providers'
import ThemeSync from '@/components/ThemeSync'

const inter = Inter({ subsets: ['latin'] })
const italiana = Italiana({ weight: '400', subsets: ['latin'] })
const lora = Lora({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'PlateHaven',
    template: '%s | PlateHaven',
  },
  description: 'Online ordering, redefined. A digital ordering system for catering businesses, food trucks, and modern food operations.',
  icons: {
    icon: '/assets/platehaven-logo-transparent.png',
    shortcut: '/assets/platehaven-logo-transparent.png',
    apple: '/assets/platehaven-logo-transparent.png',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
        <Suspense>
          <ThemeSync />
        </Suspense>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
