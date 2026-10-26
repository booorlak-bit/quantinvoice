'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { IconCrossMedium } from 'central-icons'
import { Toaster as Sonner, type ToastClassnames, type ToasterProps } from 'sonner'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// Figma: Sonner / Notifications (16:42613)
// · Sonner (16:42653) — State=Default | Focus, booleans Icon / Description / Action.
//   Glass card: custom/OS-Glass fill · 1px alpha/50 stroke · rounded-2xl (16px) · p-3 · gap-3 · shadow/xl ·
//   backdrop-blur/2xl. Title text-sm/medium in base/popover-foreground, description text-sm in base/muted-foreground,
//   2px between them. Figma's Focus variant renders like Default; in code it adds the focus/default ring.
// · Sonner / Icon (16:42620) — Type=Success | Info | Warning | Error | Loading. 20px, filled (sonner's own glyphs) and a
//   12-bar spinner for Loading.
// · Sonner / Action (16:42615) — Type=Default | Secondary. 28px pill, px-3, text-xs/medium.
//   Default → base/primary + shadow/xs · Secondary → base/secondary.
// · Notification Item (32:23457) — Property 1=Default | Hover. 400px glass card with a 32px app icon (shadow/lg),
//   title text-sm/semibold + time text-xs, description, secondary sm buttons. Hover swaps the time for a close button.
// · Notification Stack (32:23488) — Property 1=Default (list, 8px gap) | Variant2 (collapsed: the next item peeks 12px
//   below, inset 8px on each side, without a shadow).
// The Toaster is sonner, unstyled, with these classes. `Toast` renders the same markup statically (docs, custom UIs).

/* -------------------------------------------------------------------------------------------------
 * Theme — follows the `.dark` class (or data-mode="dark") on <html>, like the `dark:` variant (no next-themes).
 * -----------------------------------------------------------------------------------------------*/

function readDocumentTheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light'
  const html = document.documentElement
  return html.classList.contains('dark') || html.dataset.mode === 'dark' ? 'dark' : 'light'
}

function useDocumentTheme() {
  const [theme, setTheme] = React.useState(readDocumentTheme)
  React.useEffect(() => {
    const update = () => setTheme(readDocumentTheme())
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-mode'] })
    return () => observer.disconnect()
  }, [])
  return theme
}

/* -------------------------------------------------------------------------------------------------
 * Icons — Figma "Sonner / Icon"
 * -----------------------------------------------------------------------------------------------*/

export type ToastIconType = 'success' | 'info' | 'warning' | 'error' | 'loading'

// The Figma glyphs are sonner's built-in filled icons; the paths are sonner's (MIT).
const ICON_PATHS: Record<Exclude<ToastIconType, 'loading'>, { viewBox: string; d: string }> = {
  success: {
    viewBox: '0 0 20 20',
    d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z',
  },
  info: {
    viewBox: '0 0 20 20',
    d: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z',
  },
  warning: {
    viewBox: '0 0 24 24',
    d: 'M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z',
  },
  error: {
    viewBox: '0 0 20 20',
    d: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z',
  },
}

/** 12-bar spinner (Figma "Sonner / Icon", Type=Loading). Uses sonner's `sonner-spin` keyframes. */
function ToastSpinner({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span data-slot="toast-spinner" aria-hidden="true" className={cn('relative block size-5 shrink-0', className)} {...props}>
      {Array.from({ length: 12 }, (_, i) => (
        <span
          key={i}
          className="absolute top-[46%] left-[40%] h-[8%] w-[24%] animate-[sonner-spin_1.2s_linear_infinite] rounded-full bg-muted-foreground motion-reduce:animate-none"
          style={{ transform: `rotate(${i * 30}deg) translate(146%)`, animationDelay: `${(i - 12) / 10}s` }}
        />
      ))}
    </span>
  )
}

/** Figma "Sonner / Icon". 20px, coloured with currentColor (base/foreground inside a toast). */
export function ToastIcon({ type, className, ...props }: React.ComponentProps<'svg'> & { type: ToastIconType }) {
  if (type === 'loading') return <ToastSpinner className={className} />
  const { viewBox, d } = ICON_PATHS[type]
  return (
    <svg
      data-slot="toast-icon-glyph"
      data-type={type}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      fill="currentColor"
      aria-hidden="true"
      className={cn('size-5 shrink-0', className)}
      {...props}
    >
      <path fillRule="evenodd" clipRule="evenodd" d={d} />
    </svg>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Styles shared by <Toaster> (sonner, unstyled) and the static <Toast>
 * -----------------------------------------------------------------------------------------------*/

/** Figma "Sonner / Action": Type=Default | Secondary. */
export const toastActionVariants = cva(
  [
    'inline-flex h-7 shrink-0 cursor-pointer items-center justify-center rounded-full px-3 font-sans text-xs font-medium whitespace-nowrap outline-none transition-[box-shadow,opacity]',
    'focus-visible:shadow-focus active:opacity-80 disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      type: {
        default: 'bg-primary text-primary-foreground shadow-xs',
        secondary: 'bg-secondary text-secondary-foreground',
      },
    },
    defaultVariants: { type: 'default' },
  },
)

/** Figma "Sonner" — the glass toast surface. */
export const toastVariants = cva([
  'group/toast flex items-center gap-3 rounded-2xl bg-custom-os-glass p-3 font-sans text-sm text-popover-foreground shadow-xl inset-ring inset-ring-alpha-50 backdrop-blur-2xl outline-none',
  // Figma strokes sit inside the frame, so the 1px alpha/50 stroke is an inset ring (no extra height).
  // Keep shadow/xl under the focus ring (sonner ships its own unlayered :focus-visible shadow, hence the `!`). The ring
  // is focus/default spelled out (= shadow-focus): var(--shadow-focus) would be resolved once on :root, so a toast in a
  // nested light / dark scope would get the page's custom/Focus colour instead of its own.
  'focus-visible:shadow-[0_0_0_2px_var(--custom-focus),var(--shadow-xl)]!',
])

// sonner's injected CSS is unlayered, so the few rules it applies to unstyled toasts in dark mode need `!` to lose.
const toastParts = {
  // The Sonner / Icon glyphs are bound to base/foreground in Figma.
  icon: 'relative flex size-5 shrink-0 items-center justify-center text-foreground [&_svg]:size-5',
  content: 'flex min-w-0 flex-1 flex-col gap-0.5 break-words',
  title: 'text-sm font-medium text-popover-foreground',
  description: 'text-sm font-normal text-muted-foreground!',
  closeButton: [
    'absolute top-0 left-0 z-1 inline-flex size-5 -translate-x-1/3 -translate-y-1/3 cursor-pointer items-center justify-center rounded-full outline-none',
    'border! border-alpha-50! bg-custom-os-glass! text-popover-foreground! shadow-xs backdrop-blur-2xl [&_svg]:size-3',
    'focus-visible:shadow-focus active:opacity-80',
  ].join(' '),
}

const toasterClassNames: ToastClassnames = {
  toast: cn(
    toastVariants(),
    'w-(--width)',
    // Collapsed stack: the toasts behind the front one show their surface only (sonner does this for styled toasts only).
    'data-[expanded=false]:data-[front=false]:*:opacity-0',
    // toast.custom(<Notification />): the notification brings its own surface, so the toast drops its own — except
    // behind the front toast in a collapsed stack, where the toast surface stays so the stack still peeks out.
    '[&:has([data-slot=notification]):not([data-expanded=false][data-front=false])]:bg-transparent',
    '[&:has([data-slot=notification]):not([data-expanded=false][data-front=false])]:p-0',
    '[&:has([data-slot=notification]):not([data-expanded=false][data-front=false])]:shadow-none',
    '[&:has([data-slot=notification]):not([data-expanded=false][data-front=false])]:inset-ring-0',
    '[&:has([data-slot=notification]):not([data-expanded=false][data-front=false])]:backdrop-blur-none',
  ),
  icon: toastParts.icon,
  content: toastParts.content,
  title: toastParts.title,
  description: toastParts.description,
  actionButton: toastActionVariants({ type: 'default' }),
  cancelButton: toastActionVariants({ type: 'secondary' }),
  closeButton: toastParts.closeButton,
}

function mergeClassNames(base: ToastClassnames, extra?: ToastClassnames): ToastClassnames {
  if (!extra) return base
  const keys = new Set([...Object.keys(base), ...Object.keys(extra)]) as Set<keyof ToastClassnames>
  return Object.fromEntries([...keys].map((key) => [key, cn(base[key], extra[key])]))
}

/* -------------------------------------------------------------------------------------------------
 * Toaster — shadcn/ui API
 * -----------------------------------------------------------------------------------------------*/

export function Toaster({ toastOptions, icons, ...props }: ToasterProps) {
  const theme = useDocumentTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        success: <ToastIcon type="success" />,
        info: <ToastIcon type="info" />,
        warning: <ToastIcon type="warning" />,
        error: <ToastIcon type="error" />,
        loading: <ToastIcon type="loading" />,
        close: <IconCrossMedium />,
        ...icons,
      }}
      {...props}
      toastOptions={{
        ...toastOptions,
        unstyled: true,
        classNames: mergeClassNames(toasterClassNames, toastOptions?.classNames),
      }}
    />
  )
}

/* -------------------------------------------------------------------------------------------------
 * Toast — the same toast, rendered in place (docs, previews, custom surfaces)
 * -----------------------------------------------------------------------------------------------*/

export type ToastType = 'default' | ToastIconType

interface ToastButton {
  label: React.ReactNode
  onClick?: React.MouseEventHandler<HTMLButtonElement>
}

export function Toast({
  type = 'default',
  title,
  description,
  icon,
  action,
  cancel,
  className,
  ...props
}: Omit<React.ComponentProps<'div'>, 'title'> & {
  /** Picks the leading icon, like toast.success() / toast.loading(). */
  type?: ToastType
  title: React.ReactNode
  description?: React.ReactNode
  /** Overrides the type icon; `null` hides it. */
  icon?: React.ReactNode
  /** Primary pill button (Figma Sonner / Action, Type=Default). */
  action?: ToastButton
  /** Secondary pill button (Figma Sonner / Action, Type=Secondary). */
  cancel?: ToastButton
}) {
  const iconNode = icon === undefined ? (type === 'default' ? null : <ToastIcon type={type} />) : icon

  return (
    <div
      data-slot="toast"
      data-type={type}
      role="status"
      tabIndex={0}
      className={cn(toastVariants(), 'w-89 max-w-full', className)}
      {...props}
    >
      {iconNode && (
        <div data-slot="toast-icon" className={toastParts.icon}>
          {iconNode}
        </div>
      )}
      <div data-slot="toast-content" className={toastParts.content}>
        <div data-slot="toast-title" className={toastParts.title}>
          {title}
        </div>
        {description && (
          <div data-slot="toast-description" className={toastParts.description}>
            {description}
          </div>
        )}
      </div>
      {cancel && (
        <button type="button" data-slot="toast-cancel" className={toastActionVariants({ type: 'secondary' })} onClick={cancel.onClick}>
          {cancel.label}
        </button>
      )}
      {action && (
        <button type="button" data-slot="toast-action" className={toastActionVariants({ type: 'default' })} onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Notification — Figma "Notification Item" / "Notification Stack"
 * -----------------------------------------------------------------------------------------------*/

export function Notification({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="notification"
      className={cn(
        'group/notification relative flex min-h-15.5 w-100 max-w-full items-start gap-3 overflow-clip rounded-2xl bg-custom-os-glass p-3 text-foreground shadow-xl inset-ring inset-ring-alpha-50 backdrop-blur-2xl',
        className,
      )}
      {...props}
    />
  )
}

/** The 32px app icon column (2px from the top so it centres on the first two text lines). */
export function NotificationMedia({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="notification-media"
      className={cn('flex shrink-0 items-start py-0.5 *:size-8 *:shrink-0 *:rounded-lg *:shadow-lg', className)}
      {...props}
    />
  )
}

export function NotificationContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="notification-content" className={cn('flex min-w-0 flex-1 flex-col gap-0.5', className)} {...props} />
}

export function NotificationHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="notification-header" className={cn('flex w-full items-center gap-4', className)} {...props} />
}

export function NotificationTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="notification-title"
      className={cn('min-w-0 flex-1 text-sm font-semibold break-words text-foreground', className)}
      {...props}
    />
  )
}

/**
 * Timestamp. Gives way to the close button while the notification is hovered or holds focus (Figma Hover).
 * Figma paints it in a raw black 40% (no variable), lighter than base/muted-foreground; muted-foreground/70 is the
 * token-based match that also follows dark mode. Both sit under 4.5:1 on the glass (open question for the Figma owner).
 */
export function NotificationTime({ className, ...props }: React.ComponentProps<'time'>) {
  return (
    <time
      data-slot="notification-time"
      className={cn(
        'shrink-0 text-xs font-normal whitespace-nowrap text-muted-foreground/70',
        'group-has-data-[slot=notification-close]/notification:group-hover/notification:hidden',
        'group-has-data-[slot=notification-close]/notification:group-focus-within/notification:hidden',
        className,
      )}
      {...props}
    />
  )
}

export function NotificationDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="notification-description"
      className={cn('text-sm font-normal break-words text-muted-foreground', className)}
      {...props}
    />
  )
}

/** Row of small secondary buttons, 6px below the text. */
export function NotificationActions({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="notification-actions" className={cn('mt-1 flex flex-wrap items-start gap-1.5', className)} {...props} />
}

/**
 * Dismiss button (Button secondary · icon-xs · X). Shown on hover / focus-within, in place of the time (Figma Hover).
 * While hidden it stays in the tab order (transparent, out of the layout), so keyboard users can always reach it —
 * focusing it reveals it.
 */
export function NotificationClose({
  className,
  children,
  'aria-label': ariaLabel = 'Dismiss notification',
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="secondary"
      size="icon-xs"
      aria-label={ariaLabel}
      className={cn(
        'pointer-events-none absolute top-3 right-3 opacity-0',
        'group-hover/notification:pointer-events-auto group-hover/notification:static group-hover/notification:opacity-100',
        'group-focus-within/notification:pointer-events-auto group-focus-within/notification:static group-focus-within/notification:opacity-100',
        className,
      )}
      {...props}
      data-slot="notification-close"
    >
      {children ?? <IconCrossMedium />}
    </Button>
  )
}

export const notificationStackVariants = cva('relative isolate flex w-100 max-w-full flex-col', {
  variants: {
    // Figma "Property 1": Default → expanded · Variant2 → collapsed.
    variant: {
      expanded: 'gap-2',
      collapsed: [
        'pb-3',
        '[&>*:first-child]:z-2',
        '[&>*:nth-child(2)]:absolute [&>*:nth-child(2)]:inset-x-2 [&>*:nth-child(2)]:top-3 [&>*:nth-child(2)]:bottom-0 [&>*:nth-child(2)]:z-1 [&>*:nth-child(2)]:w-auto [&>*:nth-child(2)]:shadow-none',
        // Like sonner's collapsed toasts, the card behind shows its surface only; its content is also invisible, so its
        // buttons leave the tab order and the accessibility tree.
        '[&>*:nth-child(2)>*]:invisible [&>*:nth-child(2)>*]:opacity-0',
        '[&>*:nth-child(n+3)]:hidden',
      ],
    },
  },
  defaultVariants: { variant: 'expanded' },
})

export function NotificationStack({
  className,
  variant = 'expanded',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof notificationStackVariants>) {
  return (
    <div
      data-slot="notification-stack"
      data-variant={variant}
      className={cn(notificationStackVariants({ variant }), className)}
      {...props}
    />
  )
}
