import { redirect } from 'next/navigation'

export default function Home() {
  // POC: go straight to checkout on this branch
  redirect('/billing?tenant=demo')
}
