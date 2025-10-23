import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TCC Digital Menus',
  description: 'Interactive restaurant menus with AI assistant and instant updates.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

