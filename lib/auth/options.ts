import type { NextAuthOptions } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'

type AppUser = {
  id: string
  email: string
  name: string
  tenantId?: string | null
  role: 'SUPER_ADMIN' | 'RESTAURANT_OWNER'
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: { email: {}, password: {}, tenant: {} },
      authorize: async (credentials) => {
        const email = String(credentials?.email || '').toLowerCase().trim()
        const password = String(credentials?.password || '')
        const tenantSlug = String(credentials?.tenant || '').trim() || null
        if (!email || !password) return null
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user || !user.passwordHash) return null
        if (tenantSlug && user.tenantId) {
          const tenant = await prisma.tenant.findFirst({ where: { id: user.tenantId } })
          if (!tenant || tenant.slug !== tenantSlug) return null
        }
        const ok = await compare(password, user.passwordHash)
        if (!ok) return null
        const result: AppUser = { id: user.id, email: user.email, name: user.name, tenantId: user.tenantId, role: user.role }
        return result
      }
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        allowDangerousEmailAccountLinking: true
      })
    ] : [])
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const u = user as unknown as { id?: unknown; tenantId?: unknown; role?: unknown }
        const t = token as unknown as Record<string, unknown>
        if (typeof u.id === 'string') t.userId = u.id
        if (typeof u.tenantId === 'string' || u.tenantId === null) t.tenantId = u.tenantId ?? null
        if (typeof u.role === 'string') t.role = u.role
      }
      if (trigger === 'update' && session) {
        const s = session as Record<string, unknown>
        if (Object.prototype.hasOwnProperty.call(s, 'tenantId')) {
          const t = token as unknown as Record<string, unknown>
          t.tenantId = s.tenantId
        }
      }
      return token
    },
    async session({ session, token }) {
      const t = token as unknown as Record<string, unknown>
      const s = session as unknown as Record<string, unknown>
      s.userId = t.userId
      s.tenantId = t.tenantId
      s.role = t.role
      return session
    }
  }
}


