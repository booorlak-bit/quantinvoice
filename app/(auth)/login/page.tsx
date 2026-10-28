import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getCurrentUser, safeReturnPath } from '@/lib/auth'
import { LoginFlow } from './login-form'

// Signed-in visitors are redirected, so these pages always wait for the server.
export const instant = false

export const metadata: Metadata = { title: 'Sign in' }

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const returnTo = safeReturnPath((await searchParams).next)
  if (await getCurrentUser()) redirect(returnTo)

  return <LoginFlow next={returnTo} />
}
