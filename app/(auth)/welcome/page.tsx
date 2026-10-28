import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { requireUser, safeReturnPath } from '@/lib/auth'
import { hasBrand } from '@/lib/data/users'
import { WelcomeForm } from './welcome-form'

// Signed-in visitors are redirected, so these pages always wait for the server.
export const instant = false

export const metadata: Metadata = { title: 'Welcome' }

export default async function WelcomePage({ searchParams }: PageProps<'/welcome'>) {
  const user = await requireUser('/welcome')
  const next = safeReturnPath((await searchParams).next)
  if (await hasBrand(user.id)) redirect(next)

  return <WelcomeForm next={next} defaultName={user.name ?? ''} />
}
