import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentUser, safeReturnPath } from '@/lib/auth'
import { countUsers } from '@/lib/data/users'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Sign in' }

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const returnTo = safeReturnPath((await searchParams).next)
  if (await getCurrentUser()) redirect(returnTo)
  const firstRun = (await countUsers()) === 0

  return (
    <main className="flex min-h-svh items-center justify-center bg-gradient-wallpaper-light p-4 dark:bg-gradient-wallpaper-dark">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-heading-sm">{firstRun ? 'Set up your account' : 'Sign in'}</CardTitle>
          <CardDescription>
            {firstRun
              ? 'Enter your email and the admin password from the server settings. This creates the owner account.'
              : 'Use the email and password of your account.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm next={returnTo} />
        </CardContent>
      </Card>
    </main>
  )
}
