import type { ReactNode } from 'react'
import { IconBank, IconBitcoin, IconCircleCheck, IconCreditCard1, IconInboxEmpty, IconPaperPlaneTopRight } from 'central-icons'

import { Badge } from '@/components/ui/badge'

/** The sign-in screens: the form on the left and, from lg up, a live picture of the product on the right. */
export function AuthShell({ children, showcase }: { children: ReactNode; showcase: ReactNode }) {
  return (
    <main className="grid min-h-svh bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <div className="flex flex-col px-(--container-padding-x) py-6 sm:px-10">
        <span className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">f</span>
          <span className="text-sm font-medium text-foreground">fliq.email</span>
        </span>
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-sm">{children}</div>
        </div>
        <p className="text-xs text-muted-foreground">Invoices from your own brand, paid by card, crypto or bank transfer.</p>
      </div>
      <aside
        aria-hidden="true"
        className="relative m-2 hidden items-center justify-center overflow-hidden rounded-2xl bg-gradient-wallpaper-light lg:flex dark:bg-gradient-wallpaper-dark"
      >
        {showcase}
      </aside>
    </main>
  )
}

function Showcase({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="flex w-full max-w-md flex-col gap-20 px-10 py-16">
      <div className="relative">{children}</div>
      <div className="flex animate-in flex-col gap-2 duration-700 fade-in fill-mode-both delay-300 slide-in-from-bottom-2">
        <p className="text-heading-md text-balance text-foreground">{title}</p>
        <p className="text-sm text-pretty text-foreground/70">{description}</p>
      </div>
    </div>
  )
}

/** The part before the @ a brand might send from: "Studio North" → studionorth. */
const senderFor = (brand: string) => brand.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 20) || 'studio'

/** A paid invoice from `brand`, with the email it went out from and the payment that just came in. */
export function InvoiceShowcase({ brand, title, description }: { brand: string; title: string; description: string }) {
  const name = brand.trim() || 'Your brand'
  return (
    <Showcase title={title} description={description}>
      <div className="relative motion-safe:animate-float">
        <div className="animate-in rounded-2xl bg-card p-5 text-card-foreground shadow-2xl duration-700 fade-in fill-mode-both slide-in-from-bottom-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-custom-hues-violet-background-subtle text-base font-semibold text-custom-hues-violet-foreground">
              {name.charAt(0).toUpperCase()}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium text-foreground">{name}</span>
              <span className="text-xs text-muted-foreground">
                <span className="font-mono">INV-042</span> · Due Nov 30
              </span>
            </span>
            <Badge color="green">Paid</Badge>
          </div>
          <dl className="mt-5 flex flex-col gap-2.5 border-t border-border pt-4 text-sm">
            {[
              ['Brand identity', '$3,200.00'],
              ['Website design', '$1,600.00'],
            ].map(([item, amount]) => (
              <div key={item} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{item}</dt>
                <dd className="text-foreground tabular-nums">{amount}</dd>
              </div>
            ))}
            <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-border pt-3">
              <dt className="font-medium text-foreground">Total</dt>
              <dd className="text-heading-sm text-foreground tabular-nums">$4,800.00</dd>
            </div>
          </dl>
          <div className="mt-4 flex gap-1.5">
            {[
              { icon: IconCreditCard1, label: 'Card' },
              { icon: IconBitcoin, label: 'Crypto' },
              { icon: IconBank, label: 'Bank' },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                <Icon className="size-3.5" />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="absolute -top-4 right-5 flex max-w-[80%] animate-in items-center gap-1.5 rounded-full bg-popover/90 px-3 py-1.5 text-xs font-medium text-popover-foreground shadow-lg backdrop-blur-xl duration-500 fade-in fill-mode-both delay-500 slide-in-from-top-2">
          <IconPaperPlaneTopRight className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{senderFor(name)}@mail.fliq.email</span>
        </div>

        <div className="absolute -bottom-11 -left-8 flex animate-in items-center gap-3 rounded-xl bg-popover/90 py-3 pr-5 pl-3 text-popover-foreground shadow-xl backdrop-blur-xl duration-500 fade-in fill-mode-both delay-700 slide-in-from-left-4">
          <span className="flex size-8 items-center justify-center rounded-full bg-custom-hues-green-background-subtle text-custom-hues-green-foreground">
            <IconCircleCheck className="size-4" />
          </span>
          <span className="flex flex-col">
            <span className="text-sm font-medium">Payment received</span>
            <span className="text-xs text-muted-foreground tabular-nums">+$4,800.00 · Card · just now</span>
          </span>
        </div>
      </div>
    </Showcase>
  )
}

/** An inbox where the sign-in code has just landed. */
export function InboxShowcase({ email }: { email: string }) {
  return (
    <Showcase title="Your code is on its way" description="It usually lands in a few seconds. Nothing there? Look in spam or Promotions.">
      <div className="relative motion-safe:animate-float">
        <div className="animate-in overflow-hidden rounded-2xl bg-card text-card-foreground shadow-2xl duration-500 fade-in fill-mode-both zoom-in-95">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <IconInboxEmpty className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Inbox</span>
            <span className="ml-auto truncate text-xs text-muted-foreground">{email}</span>
          </div>
          <ul className="divide-y divide-border">
            <li className="flex animate-in items-start gap-3 bg-accent/60 px-4 py-3.5 duration-500 fade-in fill-mode-both delay-700 slide-in-from-top-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">f</span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">fliq.email</span>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
                    <span className="size-1.5 rounded-full bg-primary" />
                    now
                  </span>
                </span>
                <span className="truncate text-sm text-foreground">
                  <span className="font-mono tracking-widest">••••••</span> is your fliq.email code
                </span>
                <span className="truncate text-xs text-muted-foreground">It expires in 10 minutes. If you didn’t ask for it, ignore this email.</span>
              </span>
            </li>
            {[64, 48, 56].map((width, index) => (
              <li key={index} className="flex items-center gap-3 px-4 py-3.5 opacity-60">
                <span className="size-8 shrink-0 rounded-full bg-muted" />
                <span className="flex flex-1 flex-col gap-2">
                  <span className="h-2 w-24 rounded-full bg-muted" />
                  <span className="h-2 rounded-full bg-muted" style={{ width: `${width}%` }} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Showcase>
  )
}
