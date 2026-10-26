'use client'

import { startTransition, type FormEvent } from 'react'

/**
 * Submits a form to a `useActionState` action without React's automatic form reset, so uncontrolled fields keep what
 * the user typed when the action returns an error.
 */
export function submitWithoutReset(action: (formData: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget, (event.nativeEvent as SubmitEvent).submitter)
    startTransition(() => action(formData))
  }
}
