import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getCurrentUser, safeReturnPath } from '@/lib/auth'
import { LoginFlow } from './login-form'

export const metadata: Metadata = { title: 'Sign in' }

// The card is the same for every link here; the return path from the URL and the session stream in behind it.
export default function LoginPage({ searchParams }: PageProps<'/login'>) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-gradient-wallpaper-light p-4 dark:bg-gradient-wallpaper-dark">
      <Card className="w-full max-w-sm">
        <CardContent>
          <Suspense fallback={<LoginSkeleton />}>
            <Login searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  )
}

async function Login({ searchParams }: Pick<PageProps<'/login'>, 'searchParams'>) {
  const returnTo = safeReturnPath((await searchParams).next)
  if (await getCurrentUser()) redirect(returnTo)
  return <LoginFlow next={returnTo} />
}

/** The email step's shape, so the card keeps its size when the form arrives. */
function LoginSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Skeleton className="my-1.5 h-5 w-1/2" />
        <div className="flex h-[33px] flex-col justify-center gap-1.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-[13px] w-12" />
          <Skeleton className="h-8 w-full rounded-lg" />
        </div>
        <Skeleton className="h-8 w-full rounded-lg" />
      </div>
    </div>
  )
}
