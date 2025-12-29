import { redirect } from 'next/navigation'

export default function Home() {
  // POC: show the post-payment "Thank you / QR download" page immediately
  redirect('/billing/success?tenant=demo&mock=1')
}
