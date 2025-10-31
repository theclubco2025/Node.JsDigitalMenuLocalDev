import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import DemoAdminConsole from '@/components/DemoAdminConsole'
import AdminSessionProvider from '@/components/AdminSessionProvider'

export default async function DemoAdminPage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/auth/login?callbackUrl=%2Fadmin%2Fdemo')
  }

  const role = (session as unknown as Record<string, unknown>).role as string | undefined
  if (role !== 'SUPER_ADMIN' && role !== 'RESTAURANT_OWNER') {
    redirect('/auth/login?callbackUrl=%2Fadmin%2Fdemo')
  }

  return (
    <AdminSessionProvider session={session}>
      <DemoAdminConsole tenantSlug="demo-draft" />
    </AdminSessionProvider>
  )
}


