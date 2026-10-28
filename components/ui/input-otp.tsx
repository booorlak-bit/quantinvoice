'use client'

import * as React from 'react'
import { OTPInput, OTPInputContext } from 'input-otp'
import { cva, type VariantProps } from 'class-variance-authority'
import { IconMinusMedium } from 'central-icons'

import { cn } from '@/lib/utils'

// Figma: InputOTP (18:5645) — Variant=Digits Only | With Separator | Simple | With Spacing
// and InputOTP / Slot (18:5711) — State=Default | Focus | Filled | Error | Error (Focus).
//
// Slot: size-9 · 1px base/input stroke on every side · custom/accent dark:input\50 fill · text-sm/leading-normal/normal
// base/foreground. Joined slots each keep their own stroke (a 2px seam, as in Figma); the first/last slot of a group is
// rounded-md. Groups carry shadow/xs.
// Focus (the active slot): base/ring stroke + focus/default. Error: base/destructive stroke; Error (Focus) adds
// focus/destructive. Separator: Icon / Minus (24px).

export function InputOTP({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof OTPInput> & { containerClassName?: string }) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn('group/input-otp flex items-center gap-2 has-disabled:opacity-50', containerClassName)}
      className={cn('disabled:cursor-not-allowed', className)}
      {...props}
    />
  )
}

const inputOTPGroupVariants = cva('flex items-center', {
  variants: {
    variant: {
      // Variant=Digits Only / With Separator / Simple: slots are joined.
      default: 'rounded-md shadow-xs',
      // Variant=With Spacing: gap-2, every slot is a separate rounded-md box.
      spacing: 'gap-2 [&>[data-slot=input-otp-slot]]:rounded-md [&>[data-slot=input-otp-slot]]:shadow-xs',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export function InputOTPGroup({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof inputOTPGroupVariants>) {
  return (
    <div
      data-slot="input-otp-group"
      data-variant={variant}
      className={cn(inputOTPGroupVariants({ variant }), className)}
      {...props}
    />
  )
}

export function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<'div'> & {
  index: number
}) {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {}

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        'relative flex size-9 items-center justify-center border border-input bg-custom-accent-dark-input-50 text-sm font-normal text-foreground outline-none transition-[color,box-shadow]',
        'first:rounded-l-md last:rounded-r-md',
        // Focus — the active slot (focus-visible also matches the docs' data-force="focus").
        'data-[active=true]:z-10 data-[active=true]:border-ring data-[active=true]:shadow-focus',
        'focus-visible:z-10 focus-visible:border-ring focus-visible:shadow-focus',
        // Error — aria-invalid on the slot, or on <InputOTP> itself.
        'aria-invalid:border-destructive group-has-[input[aria-invalid=true]]/input-otp:border-destructive',
        'data-[active=true]:aria-invalid:border-destructive data-[active=true]:aria-invalid:shadow-focus-destructive',
        'focus-visible:aria-invalid:border-destructive focus-visible:aria-invalid:shadow-focus-destructive',
        'group-has-[input[aria-invalid=true]]/input-otp:data-[active=true]:shadow-focus-destructive',
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  )
}

export function InputOTPSeparator({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="input-otp-separator"
      role="separator"
      className={cn('flex items-center text-foreground [&_svg:not([class*=size-])]:size-6', className)}
      {...props}
    >
      <IconMinusMedium />
    </div>
  )
}

export { inputOTPGroupVariants }
