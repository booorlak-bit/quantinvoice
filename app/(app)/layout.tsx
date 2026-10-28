import { redirect } from 'next/navigation'

import { AppSidebar } from '@/components/app/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { getCurrentUser } from '@/lib/auth'
import { hasBrand } from '@/lib/data/users'

export default async function AppLayout({ children }: LayoutProps<'/'>) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  // New accounts set up their first brand before anything else.
  if (!(await hasBrand(user.id))) redirect('/welcome')

  return (
    <SidebarProvider>
      <AppSidebar user={{ name: user.name, email: user.email, avatarUrl: user.avatarUrl }} />
      <SidebarInset className="min-w-0">{children}</SidebarInset>
    </SidebarProvider>
  )
}
