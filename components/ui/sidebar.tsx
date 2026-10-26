'use client'

import * as React from 'react'
import { Slot } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'
import { IconSidebarSimpleLeftWide } from 'central-icons'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// Figma: page "Sidebar" (35:3081) — Pro Blocks / Sidebar Link (35:3203), State=Enabled | Hover | Selected, with the
// booleans hasIcon / soon. The full surface is "Sidebar" (30202:1247) in the Fliq kit and the settings sidebar of the
// Playground "Home" mock-up (86:3405), which composes Sidebar Links under "Sidebar / SidebarGroupLabel" rows.
//
// Surface:  base/sidebar-background (sidebar-*) fill, base/sidebar-border edge, 248px wide (232px links + px-2).
//           Floating (Fliq kit): rounded-md with a 1px border all round.
// Label:    "SidebarGroupLabel" — h-8 · px-2 · rounded-md · text-xs/leading-normal/medium · sidebar-foreground @ 70%.
// Link:     36px (min-h-[36px]) · pl-2 pr-3 · py-1.5 · rounded-md · text-sm/leading-normal/medium · base/foreground.
//           A 20px "Icon" slot holds a 16px icon in base/muted-foreground; the label wrapper adds px-1 (text at 34px,
//           trailing content 16px from the edge → pr-4 here).
//   Hover    base/secondary fill (= sidebar-accent in every theme and mode).
//   Selected a raised pill: alpha inverted/95 under alpha/10 (white 90%), shadow/xs and a 1px inside stroke painted
//            with the "Shiny Gradient" style (alpha/50 → alpha/90 → alpha/50 = Shiny Gradient/Strong, mode-aware).
//            alpha/10 is not mode-aware (white in dark mode too, which would hide the near-white dark text), so dark
//            mode lays alpha/90 (white 10%) over the fill instead.
// Nav rows (labels and links) are 4px apart (gap-1).

const SIDEBAR_COOKIE_NAME = 'sidebar_state'
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = '15.5rem' // 248px: 232px Figma links + 2 × 8px padding
const SIDEBAR_WIDTH_MOBILE = '18rem'
const SIDEBAR_WIDTH_ICON = '3.25rem' // 52px: a 36px square link + 2 × 8px padding
const SIDEBAR_KEYBOARD_SHORTCUT = 'b'
const MOBILE_BREAKPOINT = 768

const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function subscribeToMobileQuery(onChange: () => void) {
  const mql = window.matchMedia(MOBILE_QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

/** True below the `md` breakpoint (768px), where the sidebar becomes a sheet. */
function useIsMobile() {
  return React.useSyncExternalStore(
    subscribeToMobileQuery,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  )
}

type SidebarContextProps = {
  state: 'expanded' | 'collapsed'
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextProps | null>(null)

// The ids of the collapsible sidebars under a provider, for SidebarTrigger's aria-controls (kept out of useSidebar(),
// whose shape stays shadcn's).
type SidebarRegistry = { ids: string[]; register: (id: string) => () => void }
const SidebarRegistryContext = React.createContext<SidebarRegistry>({ ids: [], register: () => () => {} })

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.')
  }
  return context
}

export function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  keyboardShortcut = true,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  /** ⌘B / Ctrl+B toggles this sidebar. The listener is page-wide, so turn it off for a sidebar nested in another layout. */
  keyboardShortcut?: boolean
  /** Initial desktop state when uncontrolled. */
  defaultOpen?: boolean
  /** Controlled desktop state (expanded = true). */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const isMobile = useIsMobile()
  const [openMobile, setOpenMobile] = React.useState(false)

  // Internal state; `open` / `onOpenChange` take over when the sidebar is controlled.
  const [_open, _setOpen] = React.useState(defaultOpen)
  const open = openProp ?? _open
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === 'function' ? value(open) : value
      if (setOpenProp) {
        setOpenProp(openState)
      } else {
        _setOpen(openState)
      }
      // Persist the state so a server render can read it back (sandboxed frames may refuse cookies).
      try {
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
      } catch {
        /* cookies unavailable */
      }
    },
    [setOpenProp, open],
  )

  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((value) => !value) : setOpen((value) => !value)
  }, [isMobile, setOpen])

  // ⌘B / Ctrl+B toggles the sidebar.
  React.useEffect(() => {
    if (!keyboardShortcut) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebar, keyboardShortcut])

  const state = open ? 'expanded' : 'collapsed'

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({ state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar }),
    [state, open, setOpen, isMobile, openMobile, toggleSidebar],
  )

  const [sidebarIds, setSidebarIds] = React.useState<string[]>([])
  const registerSidebar = React.useCallback((id: string) => {
    setSidebarIds((ids) => [...ids, id])
    return () => setSidebarIds((ids) => ids.filter((other) => other !== id))
  }, [])
  const registry = React.useMemo(() => ({ ids: sidebarIds, register: registerSidebar }), [sidebarIds, registerSidebar])

  return (
    <SidebarContext.Provider value={contextValue}>
      <SidebarRegistryContext.Provider value={registry}>
        {/* As in shadcn: tooltips inside the sidebar (icon-rail labels) open without delay. */}
        <TooltipProvider delayDuration={0}>
          <div
            data-slot="sidebar-wrapper"
            style={
              {
                '--sidebar-width': SIDEBAR_WIDTH,
                '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
                ...style,
              } as React.CSSProperties
            }
            className={cn('group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar-background', className)}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarRegistryContext.Provider>
    </SidebarContext.Provider>
  )
}

export function Sidebar({
  side = 'left',
  variant = 'sidebar',
  collapsible = 'offcanvas',
  id,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  side?: 'left' | 'right'
  /** `sidebar` docks to the edge, `floating` is the bordered card of the Fliq kit, `inset` frames <SidebarInset>. */
  variant?: 'sidebar' | 'floating' | 'inset'
  /** How it collapses on desktop: slide off-canvas, shrink to an icon rail, or never. */
  collapsible?: 'offcanvas' | 'icon' | 'none'
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar()
  // The mobile sheet has no Radix trigger (SidebarTrigger / ⌘B open it), so remember what had focus and hand it back on close.
  const returnFocusRef = React.useRef<HTMLElement | null>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // SidebarTrigger points aria-controls at every sidebar it toggles.
  const autoId = React.useId()
  const sidebarId = id ?? autoId
  const { register } = React.useContext(SidebarRegistryContext)
  React.useEffect(() => (collapsible === 'none' ? undefined : register(sidebarId)), [collapsible, register, sidebarId])

  // Collapsed off-canvas, the desktop sidebar slides out of view and then turns `invisible` (visibility transitions at
  // the end of the slide), which takes its links out of the Tab order and the accessibility tree. SidebarRail stays
  // visible so the edge still reopens it. Focus inside the sidebar moves to the sidebar trigger first.
  const offscreen = !isMobile && collapsible === 'offcanvas' && state === 'collapsed'
  React.useLayoutEffect(() => {
    const container = containerRef.current
    if (!offscreen || !container?.contains(document.activeElement)) return
    container.closest('[data-slot=sidebar-wrapper]')?.querySelector<HTMLElement>('[data-slot=sidebar-trigger]')?.focus()
  }, [offscreen])

  if (collapsible === 'none') {
    return (
      <div
        id={id}
        data-slot="sidebar"
        data-variant={variant}
        className={cn(
          'flex h-full w-(--sidebar-width) flex-col bg-sidebar-background text-sidebar-foreground',
          variant === 'floating' && 'rounded-md border border-sidebar-border',
          className,
        )}
        style={style}
        {...props}
      >
        {children}
      </div>
    )
  }

  // Below md the sidebar is a Sheet (overlay, slide-in, focus trap, Escape) filled with the sidebar surface.
  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          id={sidebarId}
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          side={side}
          showCloseButton={false}
          className="w-(--sidebar-width) gap-0 bg-sidebar-background p-0 text-sidebar-foreground"
          style={{ '--sidebar-width': SIDEBAR_WIDTH_MOBILE, ...style } as React.CSSProperties}
          onOpenAutoFocus={() => {
            returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
          }}
          onCloseAutoFocus={(event) => {
            if (returnFocusRef.current?.isConnected) {
              event.preventDefault()
              returnFocusRef.current.focus()
            }
          }}
          {...props}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div className="flex size-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      className="group peer hidden text-sidebar-foreground md:block"
      data-state={state}
      data-collapsible={state === 'collapsed' ? collapsible : ''}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      {/* Reserves the sidebar's width in the layout (the sidebar itself is fixed). */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          'relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear',
          'group-data-[collapsible=offcanvas]:w-0',
          'group-data-[side=right]:rotate-180',
          variant === 'floating' || variant === 'inset'
            ? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]'
            : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon)',
        )}
      />
      <div
        ref={containerRef}
        id={sidebarId}
        data-slot="sidebar-container"
        className={cn(
          'fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width,visibility] duration-200 ease-linear md:flex',
          'group-data-[collapsible=offcanvas]:invisible',
          side === 'left'
            ? 'left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]'
            : 'right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]',
          // Floating and inset sit 8px in from the edge.
          variant === 'floating' || variant === 'inset'
            ? 'p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]'
            : 'border-sidebar-border group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l',
          className,
        )}
        style={style}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="flex size-full flex-col bg-sidebar-background group-data-[variant=floating]:rounded-md group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border"
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export function SidebarTrigger({ className, onClick, ...props }: React.ComponentProps<typeof Button>) {
  const { toggleSidebar, isMobile, open, openMobile } = useSidebar()
  const { ids } = React.useContext(SidebarRegistryContext)
  const expanded = isMobile ? openMobile : open

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon-sm"
      aria-expanded={expanded}
      // The closed mobile sheet is not in the DOM, so there is nothing to point at.
      aria-controls={ids.length > 0 && (expanded || !isMobile) ? ids.join(' ') : undefined}
      className={className}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <IconSidebarSimpleLeftWide />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
}

/** A thin hit area on the sidebar's inner edge that toggles it (hover shows a 2px sidebar-border line). */
export function SidebarRail({ className, ...props }: React.ComponentProps<'button'>) {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        'absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-0.5 hover:after:bg-sidebar-border sm:flex',
        'in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize',
        '[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize',
        'group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full hover:group-data-[collapsible=offcanvas]:bg-sidebar-background',
        // The collapsed off-canvas sidebar is invisible; its rail is not, so the screen edge reopens it.
        'group-data-[collapsible=offcanvas]:visible',
        '[[data-side=left][data-collapsible=offcanvas]_&]:-right-2',
        '[[data-side=right][data-collapsible=offcanvas]_&]:-left-2',
        className,
      )}
      {...props}
    />
  )
}

/** The page next to the sidebar. With variant="inset" it becomes a rounded card on the sidebar colour. */
export function SidebarInset({ className, ...props }: React.ComponentProps<'main'>) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        'relative flex w-full flex-1 flex-col bg-background',
        'md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2',
        className,
      )}
      {...props}
    />
  )
}

/** Playground search field: h-8 · rounded-md · custom/background dark:input\30 fill · 1px base/input stroke. */
export function SidebarInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={cn('h-8 w-full rounded-md border border-input bg-custom-background-dark-input-30 shadow-none', className)}
      {...props}
    />
  )
}

export function SidebarHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="sidebar-header" data-sidebar="header" className={cn('flex flex-col gap-2 p-2', className)} {...props} />
}

export function SidebarFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="sidebar-footer" data-sidebar="footer" className={cn('flex flex-col gap-2 p-2', className)} {...props} />
}

export function SidebarSeparator({ className, ...props }: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn('mx-2 w-auto bg-sidebar-border', className)}
      {...props}
    />
  )
}

/** Scrolling middle section. Groups are 4px apart, like the rows of the Figma nav. */
export function SidebarContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-1 overflow-auto pb-2 group-data-[collapsible=icon]:overflow-hidden',
        className,
      )}
      {...props}
    />
  )
}

export function SidebarGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn('relative flex w-full min-w-0 flex-col gap-1 px-2', className)}
      {...props}
    />
  )
}

export function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'div'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'div'

  return (
    <Comp
      data-slot="sidebar-group-label"
      data-sidebar="group-label"
      className={cn(
        'flex h-8 shrink-0 items-center gap-2 rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none transition-[margin,opacity] duration-200 ease-linear',
        'focus-visible:shadow-focus [&>svg]:size-4 [&>svg]:shrink-0',
        // In icon mode the label folds away (its 32px height plus the 4px row gap).
        'group-data-[collapsible=icon]:-mt-9 group-data-[collapsible=icon]:opacity-0',
        className,
      )}
      {...props}
    />
  )
}

export function SidebarGroupAction({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="sidebar-group-action"
      data-sidebar="group-action"
      className={cn(
        'absolute top-1.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none transition-transform',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:shadow-focus',
        "[&>svg]:size-4 [&>svg]:shrink-0 [&>svg:not([class*='text-'])]:text-muted-foreground",
        // A larger hit area on touch screens.
        'after:absolute after:-inset-2 md:after:hidden',
        'group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  )
}

export function SidebarGroupContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="sidebar-group-content" data-sidebar="group-content" className={cn('w-full text-sm', className)} {...props} />
}

export function SidebarMenu({ className, ...props }: React.ComponentProps<'ul'>) {
  return <ul data-slot="sidebar-menu" data-sidebar="menu" className={cn('flex w-full min-w-0 flex-col gap-1', className)} {...props} />
}

export function SidebarMenuItem({ className, ...props }: React.ComponentProps<'li'>) {
  return <li data-slot="sidebar-menu-item" data-sidebar="menu-item" className={cn('group/menu-item relative', className)} {...props} />
}

/** Hover, pressed, selected, focus and disabled — shared by menu buttons and sub-menu buttons. */
const sidebarItemStateClasses = cn(
  // Figma State=Hover: base/secondary fill.
  'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground',
  'data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground',
  // Figma State=Selected: alpha/10 over alpha inverted/95 (= sidebar-accent) with shadow/xs.
  'relative data-[active=true]:bg-sidebar-accent data-[active=true]:bg-[image:linear-gradient(var(--alpha-10),var(--alpha-10))] data-[active=true]:text-sidebar-accent-foreground data-[active=true]:shadow-xs',
  'dark:data-[active=true]:bg-[image:linear-gradient(var(--alpha-90),var(--alpha-90))]',
  // …and its 1px inside stroke painted with "Shiny Gradient" (Strong: shiny-gradient-1 → 2 → 1, i.e. alpha/50 →
  // alpha/90 → alpha/50 in light mode). A masked ::before draws the gradient as a ring so nothing shifts.
  'data-[active=true]:before:pointer-events-none data-[active=true]:before:absolute data-[active=true]:before:inset-0 data-[active=true]:before:rounded-[inherit] data-[active=true]:before:p-px',
  'data-[active=true]:before:bg-gradient-shiny-gradient-strong data-[active=true]:before:[mask:linear-gradient(var(--color-black)_0_0)_content-box_exclude,linear-gradient(var(--color-black)_0_0)]',
  // Focus (no Figma state): the system focus ring, like Button.
  'focus-visible:shadow-focus focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-sidebar-ring focus-visible:outline-solid',
  'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
)

export const sidebarMenuButtonVariants = cva(
  [
    'peer/menu-button flex w-full items-center gap-1.5 overflow-hidden rounded-md py-1.5 pr-4 pl-3 text-left font-medium text-sidebar-foreground outline-none transition-[width,height,padding]',
    // The 20px Figma "Icon" slot: a 16px icon with 2px either side, in base/muted-foreground. With an icon the row
    // starts at pl-2 (icon slot 8–28px, label at 34px); without one (hasIcon=false) the label sits at 12px.
    'has-[>svg:first-child]:pl-2',
    "[&>svg:first-child]:mx-0.5 [&>svg]:size-4 [&>svg]:shrink-0 [&>svg:not([class*='text-'])]:text-muted-foreground",
    '[&>span:last-child]:truncate',
    sidebarItemStateClasses,
    // Leave room for a <SidebarMenuAction>.
    'group-has-data-[sidebar=menu-action]/menu-item:pr-9',
    // Icon mode: a 36px square showing only the icon slot (the label starts past the clipped edge).
    'group-data-[collapsible=icon]:size-9! group-data-[collapsible=icon]:gap-2 group-data-[collapsible=icon]:p-2!',
  ],
  {
    variants: {
      variant: {
        default: '',
        outline: 'bg-background inset-ring inset-ring-sidebar-border hover:inset-ring-sidebar-accent',
      },
      size: {
        default: 'h-9 text-sm',
        sm: 'h-7 py-1 text-xs',
        lg: 'h-12 pl-2 text-sm group-data-[collapsible=icon]:p-0.5!',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = 'default',
  size = 'default',
  tooltip,
  className,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof sidebarMenuButtonVariants> & {
    /** Render the child (e.g. a router link) with the menu button styles. */
    asChild?: boolean
    /** Figma State=Selected — the current page. */
    isActive?: boolean
    /** Shown to the right while the sidebar is collapsed to icons. */
    tooltip?: string | React.ComponentProps<typeof TooltipContent>
  }) {
  const Comp = asChild ? Slot.Root : 'button'
  // Read the context directly so a menu button also renders outside a provider (static previews).
  const sidebar = React.useContext(SidebarContext)

  const button = (
    <Comp
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-size={size}
      data-active={isActive}
      className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
      {...props}
    />
  )

  if (!tooltip) {
    return button
  }

  const tooltipProps = typeof tooltip === 'string' ? { children: tooltip } : tooltip

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right" align="center" hidden={sidebar?.state !== 'collapsed' || sidebar.isMobile} {...tooltipProps} />
    </Tooltip>
  )
}

export function SidebarMenuAction({
  className,
  asChild = false,
  showOnHover = false,
  ...props
}: React.ComponentProps<'button'> & {
  asChild?: boolean
  /** Only show while the menu item is hovered, focused or its menu is open (always shown on touch screens). */
  showOnHover?: boolean
}) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="sidebar-menu-action"
      data-sidebar="menu-action"
      className={cn(
        'absolute top-2 right-2 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none transition-transform',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:shadow-focus peer-hover/menu-button:text-sidebar-accent-foreground',
        "[&>svg]:size-4 [&>svg]:shrink-0 [&>svg:not([class*='text-'])]:text-muted-foreground",
        'after:absolute after:-inset-2 md:after:hidden',
        'peer-data-[size=sm]/menu-button:top-1',
        'peer-data-[size=default]/menu-button:top-2',
        'peer-data-[size=lg]/menu-button:top-3.5',
        'group-data-[collapsible=icon]:hidden',
        showOnHover &&
          'group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground data-[state=open]:opacity-100 md:opacity-0',
        className,
      )}
      {...props}
    />
  )
}

/** The Figma "Soon" badge: h-5 · px-1.5 · rounded-sm · base/background fill · 1px base/border · text-xs medium. */
export function SidebarMenuBadge({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        'pointer-events-none absolute right-4 flex h-5 min-w-5 items-center justify-center rounded-sm border border-sidebar-border bg-background px-1.5 text-xs font-medium text-sidebar-foreground tabular-nums select-none',
        'peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground',
        'peer-data-[size=sm]/menu-button:top-1',
        'peer-data-[size=default]/menu-button:top-2',
        'peer-data-[size=lg]/menu-button:top-3.5',
        'group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  )
}

export function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<'div'> & {
  showIcon?: boolean
}) {
  // A random width between 50 and 90%, fixed for the lifetime of the row.
  const [width] = React.useState(() => `${Math.floor(Math.random() * 40) + 50}%`)

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn('flex h-9 items-center gap-1.5 rounded-md pr-4', showIcon ? 'pl-2' : 'pl-3', className)}
      {...props}
    >
      {showIcon && <Skeleton className="mx-0.5 size-4 rounded-md" data-sidebar="menu-skeleton-icon" />}
      <Skeleton
        className="h-4 max-w-(--skeleton-width) flex-1"
        data-sidebar="menu-skeleton-text"
        style={{ '--skeleton-width': width } as React.CSSProperties}
      />
    </div>
  )
}

/** Nested links, hung off a 1px sidebar-border line under the parent's icon. */
export function SidebarMenuSub({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        'mx-4 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5',
        'group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  )
}

export function SidebarMenuSubItem({ className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li data-slot="sidebar-menu-sub-item" data-sidebar="menu-sub-item" className={cn('group/menu-sub-item relative', className)} {...props} />
  )
}

export function SidebarMenuSubButton({
  asChild = false,
  size = 'md',
  isActive = false,
  className,
  ...props
}: React.ComponentProps<'a'> & {
  asChild?: boolean
  size?: 'sm' | 'md'
  /** Figma State=Selected — the current page. */
  isActive?: boolean
}) {
  const Comp = asChild ? Slot.Root : 'a'

  return (
    <Comp
      data-slot="sidebar-menu-sub-button"
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        'flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 font-medium text-sidebar-foreground outline-none',
        "[&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg:not([class*='text-'])]:text-muted-foreground",
        sidebarItemStateClasses,
        size === 'sm' && 'text-xs',
        size === 'md' && 'text-sm',
        'group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  )
}
