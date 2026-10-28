import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { Card, CardContent } from '@/components/ui/card'
import { getCurrentUser, safeReturnPath } from '@/lib/auth'
import { LoginFlow } from './login-form'

export const metadata: Metadata = { title: 'Sign in' }

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const returnTo = safeReturnPath((await searchParams).next)
  if (await getCurrentUser()) redirect(returnTo)

  return (
    <main className="flex min-h-svh items-center justify-center bg-gradient-wallpaper-light p-4 dark:bg-gradient-wallpaper-dark">
      <Card className="w-full max-w-sm">
        <CardContent>
          <LoginFlow next={returnTo} />
        </CardContent>
      </Card>
    </main>
  )
}
