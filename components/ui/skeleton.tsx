import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

// Figma: Skeleton (18:3699) — Variant=Default | Card | Text. No interaction states.
//   Every block is a base/accent fill with rounded-md corners (rounded-full for the avatar circle).
//   Variant=Default → 40px circle + two 16px lines (150px / 100px), gap 16px between, 8px between the lines.
//   Variant=Card    → 334px column, gap 24px: two full-width 16px lines (gap 8px) above a square block.
//   Variant=Text    → two 16px lines, 222px and 167px (= 3/4) wide, gap 8px.
// <Skeleton> is the shadcn primitive (one block, sized with utilities); <SkeletonPreset> renders the Figma variants.

export function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('animate-pulse rounded-md bg-accent motion-reduce:animate-none', className)}
      {...props}
    />
  )
}

export const skeletonPresetVariants = cva('flex', {
  variants: {
    variant: {
      default: 'w-fit items-center gap-4',
      card: 'w-[334px] max-w-full flex-col justify-center gap-6',
      text: 'w-[222px] max-w-full flex-col justify-center gap-4',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export type SkeletonPresetVariant = NonNullable<VariantProps<typeof skeletonPresetVariants>['variant']>

/** Two 16px lines, 8px apart. The second line is `short` of the first. */
function SkeletonLines({ className, short }: { className?: string; short: string }) {
  return (
    <div data-slot="skeleton-lines" className={cn('flex flex-col items-start gap-2', className)}>
      <Skeleton className="h-4 w-full" />
      <Skeleton className={cn('h-4', short)} />
    </div>
  )
}

export function SkeletonPreset({
  className,
  variant = 'default',
  ...props
}: Omit<React.ComponentProps<'div'>, 'children'> & VariantProps<typeof skeletonPresetVariants>) {
  return (
    <div
      data-slot="skeleton-preset"
      data-variant={variant}
      className={cn(skeletonPresetVariants({ variant, className }))}
      {...props}
    >
      {variant === 'default' && (
        <>
          <Skeleton data-slot="skeleton-avatar" className="size-10 shrink-0 rounded-full" />
          <SkeletonLines className="w-[150px]" short="w-2/3" />
        </>
      )}
      {variant === 'card' && (
        <>
          <SkeletonLines className="w-full" short="w-full" />
          <Skeleton data-slot="skeleton-media" className="aspect-square w-full" />
        </>
      )}
      {variant === 'text' && <SkeletonLines className="w-full" short="w-3/4" />}
    </div>
  )
}
