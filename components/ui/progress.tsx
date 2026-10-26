'use client'

import * as React from 'react'
import { Progress as ProgressPrimitive } from 'radix-ui'

import { cn } from '@/lib/utils'

/*
 * No Figma component: Progress is the Slider (3:244) without its thumb, so both read as one family.
 *   Track (root) → the Slider track: 6px (h-1.5) base/muted pill, full width.
 *   Indicator     → the Slider range ("Track" layer): base/primary with rounded-full ends.
 * States are Radix data attributes, not props:
 *   data-state="loading" | "complete" → determinate; the indicator slides in from the left to value / max.
 *   data-state="indeterminate" (value null / undefined) → a third-width range sweeps across the track
 *   (tw-animate-css exit animation, repeated); with reduced motion it rests in the middle third instead.
 */

// Root: the slider track. Height can be overridden with h-* (the indicator follows).
const progressClassName = 'relative h-1.5 w-full overflow-hidden rounded-full bg-muted'

const progressIndicatorClassName = [
  'h-full w-full flex-1 rounded-full bg-primary transition-transform duration-300 ease-out motion-reduce:transition-none',
  // Indeterminate: a 1/3-wide range parked just off the left edge, translated 4× its width (= the whole track + itself)
  // so it travels from fully hidden on the left to fully hidden on the right, then repeats.
  'data-[state=indeterminate]:w-1/3 data-[state=indeterminate]:-translate-x-full',
  'motion-safe:data-[state=indeterminate]:animate-out motion-safe:data-[state=indeterminate]:slide-out-to-right-[400%]',
  'motion-safe:data-[state=indeterminate]:repeat-infinite motion-safe:data-[state=indeterminate]:animation-duration-1500 motion-safe:data-[state=indeterminate]:ease-in-out',
  // No sweep with reduced motion: show the range resting in the middle of the track.
  'motion-reduce:data-[state=indeterminate]:translate-x-full',
]

/**
 * Percentage of the track to fill, or null when Radix treats the value as indeterminate. Mirrors Radix's own checks so
 * the fill always agrees with data-state: an invalid max (not a number above 0) falls back to 100, and a value that is
 * missing or outside 0…max is indeterminate.
 */
function fillPercent(value: number | null | undefined, max: number | undefined) {
  const safeMax = typeof max === 'number' && max > 0 ? max : 100
  if (typeof value !== 'number' || Number.isNaN(value) || value < 0 || value > safeMax) return null
  return (value / safeMax) * 100
}

/**
 * shadcn/ui Progress (Radix Progress). `value` from 0 to `max` fills the track; leave it out (or pass null) for an
 * indeterminate bar. Give it an accessible name with `aria-label` or `aria-labelledby`.
 */
export function Progress({ className, value, max = 100, ...props }: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const percent = fillPercent(value, max)

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      max={max}
      className={cn(progressClassName, className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(progressIndicatorClassName)}
        style={percent === null ? undefined : { transform: `translateX(-${100 - percent}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}
