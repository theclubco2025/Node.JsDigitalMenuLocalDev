// Keeping placeholder; demo login uses a separate dev-only route. This file remains minimal.
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'

function tenantFromRequest(req: Request): string | null {
  try {
    const url = new URL(req.url)
    const t = (url.searchParams.get('tenant') || '').trim().toLowerCase()
    return t && /^[a-z0-9\-]+$/.test(t) ? t : null
  } catch {
    return null
  }
}

export const authOptions = {
  session: { strategy: 'jwt' as const },
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
        return { id: user.id, email: user.email, name: user.name, tenantId: user.tenantId, role: user.role }
      }
    }),
    // Optional Google per-tenant via environment; can be extended to DB-stored client IDs
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        allowDangerousEmailAccountLinking: true
      })
    ] : [])
  ],
  callbacks: {
    async jwt({ token, user, trigger, session, account, profile, }) {
      if (user) {
        token.userId = (user as any).id
        token.tenantId = (user as any).tenantId || null
        token.role = (user as any).role
      }
      if (trigger === 'update' && session?.tenantId) {
        token.tenantId = session.tenantId as any
      }
      return token
    },
    async session({ session, token }) {
      ;(session as any).userId = (token as any).userId
      ;(session as any).tenantId = (token as any).tenantId
      ;(session as any).role = (token as any).role
      return session
    }
  }
}

const handler = async (req: Request, ctx: any) => {
  // Optionally gate Google provider per-tenant later by reading tenant settings
  return NextAuth(authOptions as any)(req, ctx)
}

export { handler as GET, handler as POST }