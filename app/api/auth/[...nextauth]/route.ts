import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth/options'

const handler = (req: Request, ctx: unknown) => {
  return (NextAuth(authOptions) as unknown as (req: Request, ctx?: unknown) => Promise<Response>)(req, ctx)
}

export { handler as GET, handler as POST }