'use client'

import * as React from 'react'
import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'
import { IconCheckmark1Medium, IconChevronRightMedium, IconCirclePlaceholderOn } from 'central-icons'

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { popoverMotion, popoverSurface } from '@/components/ui/popover'

// Figma: Dropdown Menu page (16:32213) — DropdownMenu / Menu (16:35896), DropdownMenu / Item / Default (16:35951),
// Item / Label (16:36018), Item / SubTrigger (16:36085), Item / Separator (16:36072), Item / User (16:36023),
// DropdownMenu Trigger / Avatar (16:36047) and the composed DropdownMenu (16:36004).
//
// Menu: the shared floating surface of popover.tsx (base/popover + backdrop-blur/md, base/popover-foreground) with
// the menu's own 1px base/border stroke · rounded-md · p-1 · shadow/md.
// Item: px-2 · py-1.5 · gap-2 · rounded-lg · text-sm/leading-normal/normal. Items sit on a 32px pitch (the Figma
//   instance is h-8) but the highlight is the 30px inner row at its top: a transparent 2px bottom border keeps the
//   pitch while bg-clip-padding stops the fill above it, and the pointer never falls into a gap between items.
//   State=Hover is Radix's highlighted item: base/accent fill + base/accent-foreground text.
//   State=Disabled: opacity 50%. State=Error (Variant=Icon) is variant="destructive": base/destructive text + icon.
//   Variant=Checkbox / Radio: pl-8 with the indicator (Icon / Check 16px · Icon / Circle 8px) in a 16px slot at left-2.
//   Variant=Icon: a 16px leading icon in base/muted-foreground (the item text starts at 32px either way).
// Label: px-2 · py-1.5 · text-sm/leading-normal/semibold. Level=2 is `inset` (pl-8), same for items.
// SubTrigger: px-2 · py-1.5 · gap-2 · rounded-sm · Icon / ChevronRight; Active=Yes is data-state=open (base/accent).
//   Sub menus are a plain DropdownMenu / Menu (shadow/md, like the root menu).
// Separator: a full-bleed 1px base/border line with no margin.

const menuContentClassName = cn(popoverSurface, popoverMotion, 'z-50 overflow-x-hidden overflow-y-auto rounded-md border border-border p-1 shadow-md')

/** Shared by every item that can be highlighted: hover = Radix highlight, or data-force="hover" in the docs. */
const menuItemBaseClassName = cn(
  'relative flex cursor-default items-center gap-2 rounded-lg border-b-2 border-transparent bg-clip-padding px-2 py-1.5 text-sm outline-hidden select-none',
  'data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground',
  'data-[force~=hover]:bg-accent data-[force~=hover]:text-accent-foreground',
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8',
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
)

// Sub menus are portalled next to their root menu (the root's `container`, document.body by default): rendered
// inside the parent they would be clipped by its scroll overflow, because the backdrop blur makes the parent the
// containing block of the floating sub menu. Sharing the container keeps them in the same light / dark scope.
const PortalContainerContext = React.createContext<React.ComponentProps<typeof DropdownMenuPrimitive.Portal>['container']>(undefined)

export function DropdownMenu({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

export function DropdownMenuPortal({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
}

// DropdownMenu Trigger / Avatar (16:36047): State=Default | Hover | Focus | Disabled.
// h-12 · px-3 · py-2 · gap-2 · rounded-lg · 1px base/input stroke · custom/background dark:input\30 · shadow/xs.
// Hover: custom/accent dark:input\50 fill + base/accent-foreground text. Focus: base/ring stroke + focus/default ring.
// Disabled: opacity 50%. Children: an avatar, a title (text-sm/medium) + description (text-xs, muted) and
// Icon / ChevronsUpDown at 50% opacity.
export const dropdownMenuTriggerVariants = cva('', {
  variants: {
    variant: {
      /** Unstyled — compose with `asChild` and a Button, like shadcn. */
      default: '',
      avatar: [
        'flex h-12 min-w-0 items-center gap-2 overflow-hidden rounded-lg border border-input bg-custom-background-dark-input-30 px-3 py-2 text-left text-sm text-foreground shadow-xs outline-none transition-[color,background-color,border-color,box-shadow]',
        'hover:bg-custom-accent-dark-input-50 hover:text-accent-foreground',
        'focus-visible:border-ring focus-visible:shadow-focus',
        'disabled:pointer-events-none disabled:opacity-50',
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
      ],
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export function DropdownMenuTrigger({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger> & VariantProps<typeof dropdownMenuTriggerVariants>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      // Only the styled variant is written. With asChild, Slot hands the trigger's props to the child element, so a
      // data-variant="default" here would overwrite the data-variant of a slotted <Button variant="outline">.
      {...(variant === 'default' ? {} : { 'data-variant': variant })}
      className={cn(dropdownMenuTriggerVariants({ variant }), className) || undefined}
      {...props}
    />
  )
}

export function DropdownMenuContent({
  className,
  sideOffset = 8,
  container,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content> & {
  /** Element to portal into (defaults to document.body). */
  container?: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>['container']
}) {
  return (
    <DropdownMenuPrimitive.Portal container={container}>
      <PortalContainerContext.Provider value={container}>
        <DropdownMenuPrimitive.Content
          data-slot="dropdown-menu-content"
          sideOffset={sideOffset}
          className={cn(
            menuContentClassName,
            'max-h-(--radix-dropdown-menu-content-available-height) min-w-32 origin-(--radix-dropdown-menu-content-transform-origin)',
            className,
          )}
          {...props}
        />
      </PortalContainerContext.Provider>
    </DropdownMenuPrimitive.Portal>
  )
}

export function DropdownMenuGroup({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
}

export const dropdownMenuItemVariants = cva(
  [menuItemBaseClassName, "text-popover-foreground [&_svg:not([class*='text-'])]:text-muted-foreground"],
  {
    variants: {
      variant: {
        default: '',
        // Figma State=Error (Variant=Icon): text and icon in base/destructive, also while highlighted.
        destructive:
          'text-destructive data-[highlighted]:text-destructive data-[force~=hover]:text-destructive [&_svg]:text-destructive!',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export function DropdownMenuItem({
  className,
  inset,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> &
  VariantProps<typeof dropdownMenuItemVariants> & {
    /** Indent the text to line up with checkbox / radio / icon items (Figma Level=2). */
    inset?: boolean
  }) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset || undefined}
      data-variant={variant}
      className={cn(dropdownMenuItemVariants({ variant }), className)}
      {...props}
    />
  )
}

export function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(dropdownMenuItemVariants(), 'pr-2 pl-8', className)}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <IconCheckmark1Medium className="size-4 text-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

export function DropdownMenuRadioGroup({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return <DropdownMenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />
}

export function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(dropdownMenuItemVariants(), 'pr-2 pl-8', className)}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <IconCirclePlaceholderOn className="size-2 fill-current text-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

export function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  /** Indent to line up with checkbox / radio / icon items (Figma Level=2). */
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset || undefined}
      className={cn('px-2 py-1.5 text-sm font-semibold text-popover-foreground data-[inset]:pl-8', className)}
      {...props}
    />
  )
}

/** Initials of a name ("Jane Doe" → "JD"), for the avatar fallback. */
function initialsOf(name: React.ReactNode) {
  if (typeof name !== 'string') return undefined
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}

// DropdownMenu / Item / User (16:36023): the account header of a menu — a label, not a selectable item.
// px-1 · py-1.5 · gap-2 · 32px avatar (Avatar size 8) · name text-sm/leading-normal/semibold base/popover-foreground
// over email text-xs/leading-normal/normal base/muted-foreground, both truncating (292px wide in Figma).
export function DropdownMenuUser({
  className,
  name,
  email,
  avatar,
  fallback,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  /** The user's name (semibold). */
  name?: React.ReactNode
  /** Secondary line, usually the email (muted, text-xs). */
  email?: React.ReactNode
  /** Avatar image URL. */
  avatar?: string
  /** Avatar fallback while the image loads or when there is none. Defaults to the initials of a string `name`. */
  fallback?: React.ReactNode
  /** Replaces the generated avatar (e.g. an Avatar with a badge). Without name / email it is the whole content. */
  children?: React.ReactNode
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-user"
      className={cn('flex min-w-0 items-center gap-2 px-1 py-1.5 text-left text-sm text-popover-foreground', className)}
      {...props}
    >
      {children ?? (
        // The Avatar keeps its own data-slot="avatar" (AvatarGroup and [data-slot=avatar] selectors rely on it).
        <Avatar size="8">
          {avatar && <AvatarImage src={avatar} alt="" />}
          <AvatarFallback>{fallback ?? initialsOf(name)}</AvatarFallback>
        </Avatar>
      )}
      {(name || email) && (
        <span className="grid min-w-0 flex-1">
          {name && (
            <span data-slot="dropdown-menu-user-name" className="truncate font-semibold">
              {name}
            </span>
          )}
          {email && (
            <span data-slot="dropdown-menu-user-email" className="truncate text-xs text-muted-foreground">
              {email}
            </span>
          )}
        </span>
      )}
    </DropdownMenuPrimitive.Label>
  )
}

export function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn('-mx-1 h-px bg-border', className)}
      {...props}
    />
  )
}

/** Keyboard shortcut at the end of an item: text-xs/leading-normal/normal at 60% opacity of the item colour. */
export function DropdownMenuShortcut({ className, ...props }: React.ComponentProps<'span'>) {
  return <span data-slot="dropdown-menu-shortcut" className={cn('ml-auto text-xs opacity-60', className)} {...props} />
}

export function DropdownMenuSub({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />
}

export function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  /** Indent to line up with checkbox / radio / icon items. */
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset || undefined}
      className={cn(
        menuItemBaseClassName,
        // Active=Yes: the sub menu is open.
        'rounded-sm text-popover-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
        // Leading icons are muted like Variant=Icon items; the chevron keeps the text colour (Figma).
        "[&_svg:not([class*='text-'])]:text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
      <IconChevronRightMedium className="ml-auto size-4 text-current" />
    </DropdownMenuPrimitive.SubTrigger>
  )
}

export function DropdownMenuSubContent({ className, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  const container = React.useContext(PortalContainerContext)
  return (
    <DropdownMenuPrimitive.Portal container={container}>
      <DropdownMenuPrimitive.SubContent
        data-slot="dropdown-menu-sub-content"
        className={cn(
          menuContentClassName,
          'max-h-(--radix-dropdown-menu-content-available-height) min-w-32 origin-(--radix-dropdown-menu-content-transform-origin)',
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}
