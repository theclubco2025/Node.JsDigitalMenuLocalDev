"use client"

import { SessionProvider } from 'next-auth/react'
import type { Session } from 'next-auth'
import type { ReactNode } from 'react'

type Props = {
  session: Session
  children: ReactNode
}

export default function AdminSessionProvider({ session, children }: Props) {
  return <SessionProvider session={session}>{children}</SessionProvider>
}


