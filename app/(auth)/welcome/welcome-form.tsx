'use client'

import { useActionState, useState } from 'react'
import { IconArrowRight } from 'central-icons'

import { welcomeAction } from '@/app/(auth)/actions'
import { AuthShell, InvoiceShowcase } from '@/components/auth/auth-shell'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { submitWithoutReset } from '@/lib/submit'

/** The first screen of a new account: its name and first brand, with the invoice preview following the brand name. */
export function WelcomeForm({ next, defaultName }: { next: string; defaultName: string }) {
  const [state, action, pending] = useActionState(welcomeAction, { error: null })
  const [brand, setBrand] = useState('')

  return (
    <AuthShell
      showcase={
        <InvoiceShowcase
          brand={brand}
          title="This is how your invoices will look"
          description="Your brand on every invoice and in every email. Add a logo, details and a sender address later in Settings."
        />
      }
    >
      <div className="flex animate-in flex-col gap-8 duration-500 fade-in slide-in-from-bottom-2">
        <div className="flex flex-col gap-2">
          <h1 className="text-heading-lg text-foreground">You’re in. One more step</h1>
          <p className="text-sm text-pretty text-muted-foreground">Tell us who invoices come from. You can change both later in Settings.</p>
        </div>
        <form onSubmit={submitWithoutReset(action)}>
          <input type="hidden" name="next" value={next} />
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Your name</FieldLabel>
              <Input id="name" name="name" autoComplete="name" defaultValue={defaultName} autoFocus />
            </Field>
            <Field>
              <FieldLabel htmlFor="brandName">Brand</FieldLabel>
              <Input
                id="brandName"
                name="brandName"
                required
                placeholder="Studio name, service or your name"
                value={brand}
                onChange={(event) => setBrand(event.target.value)}
              />
              <FieldDescription>Have several projects or services? Add more brands in Settings.</FieldDescription>
            </Field>
            {state.error && (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" size="lg" loading={pending} className="w-full">
              Start invoicing
              <IconArrowRight />
            </Button>
          </FieldGroup>
        </form>
      </div>
    </AuthShell>
  )
}
