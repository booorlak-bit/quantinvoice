'use client'

import { REGEXP_ONLY_DIGITS } from 'input-otp'
import { startTransition, useActionState, useEffect, useRef, useState } from 'react'
import { IconArrowLeft, IconArrowRight, IconEmail2Check, IconSquareArrowTopRight } from 'central-icons'

import { requestCodeAction, verifyCodeAction, type CodeState } from '@/app/(auth)/actions'
import { AuthShell, InboxShowcase, InvoiceShowcase } from '@/components/auth/auth-shell'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { submitWithoutReset } from '@/lib/submit'

const RESEND_SECONDS = 60

/** Seconds left before a new code can be requested, counting down once a second. */
function useCountdown(sentAt: number | undefined) {
  // No clock read during render: the first tick sets `now`, until then the full wait shows.
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    if (!sentAt) return
    const tick = () => setNow(Date.now())
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [sentAt])
  if (!sentAt) return 0
  // Clamped: `now` can trail a fresh `sentAt` until the next tick.
  return Math.min(RESEND_SECONDS, Math.max(0, RESEND_SECONDS - Math.floor(((now ?? sentAt) - sentAt) / 1000)))
}

// Webmail for the common providers, so the code is one click away.
const INBOXES: { domains: string[]; name: string; url: string }[] = [
  { domains: ['gmail.com', 'googlemail.com'], name: 'Gmail', url: 'https://mail.google.com/mail/u/0/#inbox' },
  { domains: ['outlook.com', 'hotmail.com', 'live.com', 'msn.com'], name: 'Outlook', url: 'https://outlook.live.com/mail/0/inbox' },
  { domains: ['icloud.com', 'me.com', 'mac.com'], name: 'iCloud Mail', url: 'https://www.icloud.com/mail' },
  { domains: ['yahoo.com'], name: 'Yahoo Mail', url: 'https://mail.yahoo.com' },
  { domains: ['proton.me', 'protonmail.com', 'pm.me'], name: 'Proton Mail', url: 'https://mail.proton.me' },
  { domains: ['yandex.ru', 'yandex.com', 'ya.ru'], name: 'Yandex Mail', url: 'https://mail.yandex.ru' },
  { domains: ['mail.ru', 'bk.ru', 'list.ru', 'inbox.ru'], name: 'Mail.ru', url: 'https://e.mail.ru/inbox' },
]
const inboxFor = (email: string) => INBOXES.find((inbox) => inbox.domains.includes(email.split('@')[1]?.toLowerCase() ?? ''))

/** Sign-in and sign-up in one: email, then the 6-digit code from the email. */
export function LoginFlow({ next }: { next: string }) {
  const [sent, request, requesting] = useActionState(requestCodeAction, { step: 'email', email: '', error: null } satisfies CodeState)
  const [checked, verify, verifying] = useActionState(verifyCodeAction, { step: 'code', email: '', error: null } satisfies CodeState)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [editing, setEditing] = useState(false)
  const codeForm = useRef<HTMLFormElement>(null)
  const secondsLeft = useCountdown(sent.sentAt)

  const onCodeStep = sent.step === 'code' && !editing
  const error = onCodeStep && (checked.at ?? 0) > (sent.at ?? 0) ? checked.error : sent.error
  const inbox = inboxFor(sent.email)

  // A new code clears what was typed for the previous one.
  const resend = () => {
    setCode('')
    const formData = new FormData()
    formData.set('email', sent.email)
    startTransition(() => request(formData))
  }

  if (!onCodeStep) {
    return (
      <AuthShell
        showcase={
          <InvoiceShowcase
            key="invoice"
            brand="Studio North"
            title="Invoices that look like your brand and get paid"
            description="Send from your own address. Clients pay by card, crypto or bank transfer, and you see every payment on the dashboard."
          />
        }
      >
        <div key="email" className="flex animate-in flex-col gap-8 duration-500 fade-in slide-in-from-bottom-2">
          <div className="flex flex-col gap-2">
            <h1 className="text-heading-lg text-foreground">Welcome to fliq.email</h1>
            <p className="text-sm text-pretty text-muted-foreground">Sign in or create an account. We’ll email you a 6-digit code, so there’s no password to remember.</p>
          </div>
          <form
            onSubmit={(event) => {
              setEditing(false)
              setCode('')
              submitWithoutReset(request)(event)
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  autoFocus
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </Field>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" size="lg" loading={requesting} className="w-full">
                Continue with email
                <IconArrowRight />
              </Button>
            </FieldGroup>
          </form>
          <p className="text-xs text-muted-foreground">New here? The same code creates your account in a few seconds.</p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell showcase={<InboxShowcase key="inbox" email={sent.email} />}>
      <div key="code" className="flex animate-in flex-col gap-8 duration-500 fade-in slide-in-from-right-4">
        <div className="flex flex-col gap-4">
          <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-foreground [&_svg]:size-5">
            <IconEmail2Check />
          </span>
          <div className="flex flex-col gap-2">
            <h1 className="text-heading-lg text-foreground">Check your email</h1>
            <p className="text-sm text-pretty text-muted-foreground">
              Enter the 6-digit code we sent to <span className="font-medium break-all text-foreground">{sent.email}</span>. It expires in 10 minutes.
            </p>
          </div>
        </div>
        <form ref={codeForm} onSubmit={submitWithoutReset(verify)}>
          <input type="hidden" name="email" value={sent.email} />
          <input type="hidden" name="next" value={next} />
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="code" className="sr-only">
                Code
              </FieldLabel>
              <InputOTP
                id="code"
                name="code"
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS}
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                value={code}
                onChange={setCode}
                onComplete={() => codeForm.current?.requestSubmit()}
                aria-invalid={Boolean(error) || undefined}
              >
                <InputOTPGroup variant="spacing" className="w-full justify-between">
                  {Array.from({ length: 6 }, (_, index) => (
                    <InputOTPSlot key={index} index={index} className="size-12 text-lg font-medium" aria-invalid={Boolean(error) || undefined} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </Field>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" size="lg" loading={verifying} disabled={code.length !== 6} className="w-full">
              Continue
            </Button>
            {inbox && (
              <Button asChild size="lg" variant="outline" className="w-full">
                <a href={inbox.url} target="_blank" rel="noreferrer">
                  Open {inbox.name}
                  <IconSquareArrowTopRight />
                </a>
              </Button>
            )}
            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEmail(sent.email)
                  setEditing(true)
                }}
              >
                <IconArrowLeft />
                Other email
              </Button>
              <Button type="button" variant="ghost" size="sm" disabled={secondsLeft > 0 || requesting} onClick={resend}>
                {secondsLeft > 0 ? `New code in ${secondsLeft}s` : 'Send a new code'}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </div>
    </AuthShell>
  )
}
