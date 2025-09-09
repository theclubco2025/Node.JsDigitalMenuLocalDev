import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { resolveTenant } from '@/lib/tenant'
import { getTheme } from '@/lib/theme'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Digital Menu SaaS',
  description: 'Smart restaurant menu system with AI assistant',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Compute theme from default tenant at layout render (server side)
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
        }}
      >
        {children}
      </body>
    </html>
  )
}
