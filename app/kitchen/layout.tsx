import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'KDS',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

