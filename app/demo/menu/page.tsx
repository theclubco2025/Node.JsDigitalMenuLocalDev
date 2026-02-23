import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function DemoMenuRedirect() {
  redirect('/menu?tenant=demo')
}

