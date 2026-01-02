import { redirect } from 'next/navigation'

export default function SouthForkGrilleSlug() {
  // South Fork Grille canonical tenant id uses hyphens in storage/config.
  // This pretty path is a no-op alias for marketing/QR friendliness.
  redirect('/menu?tenant=south-fork-grille')
}


