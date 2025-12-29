import { redirect } from 'next/navigation'

// Common misspelling guard for testing links.
export default function ButterciupPantryRedirect() {
  redirect('/buttercuppantry')
}


