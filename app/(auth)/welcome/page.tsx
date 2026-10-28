import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireUser, safeReturnPath } from '@/lib/auth'
import { hasBrand } from '@/lib/data/users'
import { WelcomeForm } from './welcome-form'

export const metadata: Metadata = { title: 'Welcome' }

export default async function WelcomePage({ searchParams }: PageProps<'/welcome'>) {
  const user = await requireUser('/welcome')
  const next = safeReturnPath((await searchParams).next)
  if (await hasBrand(user.id)) redirect(next)

  return (
    <main className="flex min-h-svh items-center justify-center bg-gradient-wallpaper-light p-4 dark:bg-gradient-wallpaper-dark">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-heading-sm">Welcome</CardTitle>
          <CardDescription>Two things before your first invoice. You can change both later in Settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <WelcomeForm next={next} defaultName={user.name ?? ''} />
        </CardContent>
      </Card>
    </main>
  )
}
