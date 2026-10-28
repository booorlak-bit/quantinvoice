'use client'

import { REGEXP_ONLY_DIGITS } from 'input-otp'
import { startTransition, useActionState, useEffect, useRef, useState } from 'react'
import { IconArrowLeft } from 'central-icons'

import { requestCodeAction, verifyCodeAction, type CodeState } from '@/app/(auth)/actions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { CardDescription, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { submitWithoutReset } from '@/lib/submit'

const RESEND_SECONDS = 60

/** Seconds left before a new code can be requested, counting down once a second. */
function useCountdown(sentAt: number | undefined) {
  // Only the ticks read the clock, never the render: Next.js can render this on the server ahead of the visit.
  const [now, setNow] = useState(0)
  useEffect(() => {
    if (!sentAt) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [sentAt])
  // Clamped: `now` trails the server's `sentAt` until the first tick, so the count starts at the full minute.
  return sentAt ? Math.min(RESEND_SECONDS, Math.max(0, RESEND_SECONDS - Math.floor((now - sentAt) / 1000))) : 0
}

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

  // A new code clears what was typed for the previous one.
  const resend = () => {
    setCode('')
    const formData = new FormData()
    formData.set('email', sent.email)
    startTransition(() => request(formData))
  }

  if (!onCodeStep) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <CardTitle className="text-heading-sm">Sign in or sign up</CardTitle>
          <CardDescription>Enter your email and we’ll send you a 6-digit code. New here? The same code creates your account.</CardDescription>
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
            <Button type="submit" loading={requesting} className="w-full">
              Continue
            </Button>
          </FieldGroup>
        </form>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <CardTitle className="text-heading-sm">Check your email</CardTitle>
        <CardDescription>
          We sent a code to <span className="font-medium text-foreground">{sent.email}</span>. It expires in 10 minutes.
        </CardDescription>
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
              containerClassName="justify-center"
              aria-invalid={Boolean(error) || undefined}
            >
              <InputOTPGroup>
                {Array.from({ length: 6 }, (_, index) => (
                  <InputOTPSlot key={index} index={index} aria-invalid={Boolean(error) || undefined} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </Field>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" loading={verifying} disabled={code.length !== 6} className="w-full">
            Continue
          </Button>
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
  )
}
