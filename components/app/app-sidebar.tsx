'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  IconChevronGrabberVertical,
  IconDoor,
  IconLayersTwo,
  IconLayoutDashboard,
  IconPeople,
  IconPlusMedium,
  IconReceiptBill,
  IconSettingsGear1,
  IconUser,
  IconWallet1,
} from 'central-icons'

import { logout } from '@/app/(auth)/actions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuUser,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'

const NAV = [
  { href: '/dashboard', title: 'Dashboard', icon: IconLayoutDashboard },
  { href: '/invoices', title: 'Invoices', icon: IconReceiptBill },
  { href: '/clients', title: 'Clients', icon: IconPeople },
  { href: '/templates', title: 'Templates', icon: IconLayersTwo },
  { href: '/payment-methods', title: 'Payment methods', icon: IconWallet1 },
  { href: '/settings', title: 'Settings', icon: IconSettingsGear1 },
]

export type SidebarUser = { name: string | null; email: string; avatarUrl: string | null }

export function initials(text: string) {
  const words = text.trim().split(/[\s@._-]+/).filter(Boolean)
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase() || '?'
}

export function AppSidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()
  const close = () => isMobile && setOpenMobile(false)

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="gap-2.5 pt-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="Dashboard">
              <Link href="/dashboard" onClick={close}>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
                  f
                </span>
                <span className="truncate font-medium">fliq.email</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <Button asChild className="group-data-[collapsible=icon]:hidden">
          <Link href="/invoices/new" onClick={close}>
            <IconPlusMedium />
            New invoice
          </Link>
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link href={item.href} aria-current={active ? 'page' : undefined} onClick={close}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <AccountMenu user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

function AccountMenu({ user }: { user: SidebarUser }) {
  const label = user.name || user.email
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-12 w-full justify-start gap-2 px-2 text-left group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:p-0.5"
        >
          <Avatar size="8">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
            <AvatarFallback>{initials(label)}</AvatarFallback>
          </Avatar>
          <span className="grid min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium">{label}</span>
            {user.name && <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>}
          </span>
          <IconChevronGrabberVertical className="opacity-50 group-data-[collapsible=icon]:hidden" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-(--radix-dropdown-menu-trigger-width) min-w-56">
        <DropdownMenuUser name={label} email={user.name ? user.email : undefined} avatar={user.avatarUrl ?? undefined} fallback={initials(label)} />
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings#profile">
            <IconUser />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <IconSettingsGear1 />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => logout()}>
          <IconDoor />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
