import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface User {
    role?: 'SUPER_ADMIN' | 'RESTAURANT_OWNER'
    name?: string | null
    email?: string | null
    image?: string | null
  }

  interface Session {
    user?: User
  }
}
