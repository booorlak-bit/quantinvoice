'use client'

import * as React from 'react'
import { Avatar as AvatarPrimitive } from 'radix-ui'
import { cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

// Figma: Avatar (16:8588) — Type=Image | Fallback × Size=12 | 10 | 8 | 6 | 5, and Avatar Group (16:8582).
//   Root: rounded-full · size-12 / 10 / 8 / 6 / 5 (48 / 40 / 32 / 24 / 20px). The image and fallback inherit the
//         root's radius (so a className radius such as rounded-lg reaches them) and the root itself does not clip,
//         which keeps an AvatarBadge whole at the corner.
//   Type=Image    → <AvatarImage>: object-cover photo filling the root.
//   Type=Fallback → <AvatarFallback>: base/muted fill, centred initials in base/foreground,
//                   text-sm/leading-normal/medium (sizes 12–6) or text-xs/leading-normal/medium (size 5).
//   Avatar Group  → avatars overlap by 8px (mr -8px). The playground group (16:8618) gives every avatar a 2px
//                   base/background stroke outside its edge (its render bounds are 84 × 36 for an 80 × 32 layout),
//                   which is shadcn's ring-2 ring-background. Figma's item4 / item5 booleans are simply more children.
// There are no interaction states. AvatarBadge and AvatarGroupCount are shadcn parts with no Figma counterpart.

export type AvatarSize = '12' | '10' | '8' | '6' | '5'

/** shadcn's size names, mapped onto the Figma steps so shadcn snippets keep working. */
const SHADCN_SIZES = { sm: '6', default: '8', lg: '10' } as const satisfies Record<string, AvatarSize>

export const avatarVariants = cva('group/avatar relative flex shrink-0 rounded-full select-none', {
  variants: {
    size: {
      '12': 'size-12',
      '10': 'size-10',
      '8': 'size-8',
      '6': 'size-6',
      '5': 'size-5',
    } satisfies Record<AvatarSize, string>,
  },
  defaultVariants: {
    size: '8',
  },
})

export function Avatar({
  className,
  size = '8',
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & {
  /**
   * Figma property Size: the Tailwind size step (12 = 48px, 10 = 40px, 8 = 32px, 6 = 24px, 5 = 20px).
   * shadcn's "sm" | "default" | "lg" are accepted as aliases for 6 | 8 | 10.
   */
  size?: AvatarSize | keyof typeof SHADCN_SIZES
}) {
  const step: AvatarSize = size in SHADCN_SIZES ? SHADCN_SIZES[size as keyof typeof SHADCN_SIZES] : (size as AvatarSize)
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={step}
      className={cn(avatarVariants({ size: step, className }))}
      {...props}
    />
  )
}

export function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('aspect-square size-full rounded-[inherit] object-cover', className)}
      {...props}
    />
  )
}

export function AvatarFallback({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'flex size-full items-center justify-center overflow-hidden rounded-[inherit] bg-muted text-sm font-medium text-foreground',
        'group-data-[size=5]/avatar:text-xs',
        className,
      )}
      {...props}
    />
  )
}

/** A status dot on the avatar's bottom-right corner. Children (an icon) show from size 8 up. */
export function AvatarBadge({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        'absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background select-none',
        'group-data-[size=5]/avatar:size-2 group-data-[size=5]/avatar:[&>svg]:hidden',
        'group-data-[size=6]/avatar:size-2 group-data-[size=6]/avatar:[&>svg]:hidden',
        'group-data-[size=8]/avatar:size-2.5 group-data-[size=8]/avatar:[&>svg]:size-2',
        'group-data-[size=10]/avatar:size-3 group-data-[size=10]/avatar:[&>svg]:size-2',
        'group-data-[size=12]/avatar:size-3.5 group-data-[size=12]/avatar:[&>svg]:size-2.5',
        className,
      )}
      {...props}
    />
  )
}

export function AvatarGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        'group/avatar-group flex items-center -space-x-2',
        // 2px base/background stroke outside each avatar's edge, so the overlap reads as a cut-out.
        '*:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background',
        className,
      )}
      {...props}
    />
  )
}

/** The "+N" circle at the end of a group. It takes the size of the group's avatars. */
export function AvatarGroupCount({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        'relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-foreground ring-2 ring-background select-none',
        '[&>svg]:size-4',
        'group-has-data-[size=12]/avatar-group:size-12 group-has-data-[size=12]/avatar-group:[&>svg]:size-5',
        'group-has-data-[size=10]/avatar-group:size-10 group-has-data-[size=10]/avatar-group:[&>svg]:size-5',
        'group-has-data-[size=6]/avatar-group:size-6 group-has-data-[size=6]/avatar-group:[&>svg]:size-3',
        'group-has-data-[size=5]/avatar-group:size-5 group-has-data-[size=5]/avatar-group:text-xs group-has-data-[size=5]/avatar-group:[&>svg]:size-3',
        className,
      )}
      {...props}
    />
  )
}
