'use client'

import { useActionState } from 'react'

import { welcomeAction } from '@/app/(auth)/actions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { submitWithoutReset } from '@/lib/submit'

export function WelcomeForm({ next, defaultName }: { next: string; defaultName: string }) {
  const [state, action, pending] = useActionState(welcomeAction, { error: null })
  return (
    <form onSubmit={submitWithoutReset(action)}>
      <input type="hidden" name="next" value={next} />
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Your name</FieldLabel>
          <Input id="name" name="name" autoComplete="name" defaultValue={defaultName} autoFocus />
        </Field>
        <Field>
          <FieldLabel htmlFor="brandName">Brand</FieldLabel>
          <Input id="brandName" name="brandName" required placeholder="Studio name, service or your name" />
          <FieldDescription>Who invoices come from. Have several projects or services? Add more brands in Settings.</FieldDescription>
        </Field>
        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" loading={pending} className="w-full">
          Start invoicing
        </Button>
      </FieldGroup>
    </form>
  )
}
