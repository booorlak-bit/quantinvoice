import { redirect } from 'next/navigation'

import { AppSidebar } from '@/components/app/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { getCurrentUser } from '@/lib/auth'
import { getDefaultCompany } from '@/lib/data/companies'

export default async function AppLayout({ children }: LayoutProps<'/'>) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const company = await getDefaultCompany(user.id)

  return (
    <SidebarProvider>
      <AppSidebar
        user={{ name: user.name, email: user.email, avatarUrl: user.avatarUrl }}
        workspace={company?.name ?? 'Workspace'}
      />
      <SidebarInset className="min-w-0">{children}</SidebarInset>
    </SidebarProvider>
  )
}
