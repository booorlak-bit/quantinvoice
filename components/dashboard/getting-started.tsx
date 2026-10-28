import Link from 'next/link'
import { IconArrowRight, IconCheckmark1Medium, IconPaperPlaneTopRight, IconReceiptBill, IconWallet1 } from 'central-icons'

import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export type SetupStep = { key: string; title: string; description: string; href: string; action: string; done: boolean }

/** The checklist a new account sees until its first invoice: what's done, and the next thing to do. */
export function GettingStarted({ steps, name }: { steps: SetupStep[]; name: string | null }) {
  const done = steps.filter((step) => step.done).length
  const next = steps.find((step) => !step.done)
  const firstName = name?.split(/\s+/)[0]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-heading-sm">{firstName ? `Welcome, ${firstName}` : 'Welcome to fliq.email'}</CardTitle>
        <CardDescription>A few steps and your first invoice is on its way.</CardDescription>
        <CardAction className="text-sm font-medium text-muted-foreground tabular-nums">
          {done} of {steps.length} done
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Progress value={done} max={steps.length} aria-label="Setup progress" />
        <ol className="flex flex-col divide-y divide-border">
          {steps.map((step, index) => {
            const current = step === next
            return (
              <li key={step.key} className="flex items-center gap-4 py-3.5">
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium',
                    step.done
                      ? 'bg-custom-hues-green-background-subtle text-custom-hues-green-foreground'
                      : current
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground',
                  )}
                >
                  {step.done ? <IconCheckmark1Medium className="size-4" aria-label="Done" /> : index + 1}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className={cn('text-sm font-medium', step.done ? 'text-muted-foreground' : 'text-foreground')}>{step.title}</span>
                  <span className="text-xs text-pretty text-muted-foreground">{step.description}</span>
                </span>
                {!step.done && (
                  <Button asChild size="sm" variant={current ? 'default' : 'outline'} className="shrink-0">
                    <Link href={step.href}>{step.action}</Link>
                  </Button>
                )}
              </li>
            )
          })}
        </ol>
      </CardContent>
    </Card>
  )
}

const FLOW = [
  { icon: IconReceiptBill, title: 'Create', text: 'Pick a brand, a client and line items, or start from a template.' },
  { icon: IconPaperPlaneTopRight, title: 'Send', text: 'Email it from your brand’s address, or share a link or a PDF.' },
  { icon: IconWallet1, title: 'Get paid', text: 'Clients pay by card, crypto or bank. Every payment lands on this dashboard.' },
]

/** How an invoice goes from draft to money in, in three steps. */
export function HowItWorks() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>How it works</CardTitle>
        <CardDescription>From draft to money in</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-5">
        <ol className="flex flex-col gap-4">
          {FLOW.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                <Icon className="size-4" />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">{title}</span>
                <span className="text-xs text-pretty text-muted-foreground">{text}</span>
              </span>
            </li>
          ))}
        </ol>
        <Button asChild variant="outline" size="sm" className="mt-auto self-start">
          <Link href="/templates">
            Browse templates
            <IconArrowRight />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

// Bar heights in % of the plot, drawn in a quiet fill so they read as a preview, not data.
const GHOST_BARS = [28, 42, 35, 58, 47, 66, 54, 80, 62]

/** Where the payments chart will be, before there is anything to plot. */
export function GhostChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payments</CardTitle>
        <CardDescription>Money received, overdue and scheduled, month by month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative flex h-56 items-end gap-3 border-b border-border px-2 sm:gap-6" aria-hidden="true">
          {GHOST_BARS.map((height, index) => (
            <span key={index} className="flex-1 rounded-t-sm bg-muted" style={{ height: `${height}%` }} />
          ))}
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
              Your chart starts with the first invoice
            </span>
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
