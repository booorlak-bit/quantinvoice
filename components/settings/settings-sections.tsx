'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { IconBuildings, IconCrossMedium, IconPasswordStars, IconPencil, IconPlusMedium, IconTrashCan, IconUserDuo } from 'central-icons'

import {
  changePasswordAction,
  createAccountAction,
  deleteAccountAction,
  deleteCompanyAction,
  resetPasswordAction,
  saveCompanyAction,
  updateProfileAction,
  type SettingsState,
} from '@/app/(app)/settings/actions'
import { initials } from '@/components/app/app-sidebar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { formatDate } from '@/lib/format'
import type { Company, Note, User } from '@/lib/types'

/** Shows a toast and runs `then` each time a settings action completes without an error. */
function useDone(state: SettingsState, message: string, then?: () => void) {
  useEffect(() => {
    if (!state.done) return
    toast.success(message)
    then?.()
    // Only react to a newly completed submission.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.done])
}

function FormError({ state }: { state: SettingsState }) {
  if (!state.error) return null
  return (
    <Alert variant="destructive">
      <AlertDescription>{state.error}</AlertDescription>
    </Alert>
  )
}

// ——— Profile ——————————————————————————————————————————————————————————————————————————————

export function ProfileCard({ user }: { user: User }) {
  const [state, action, pending] = useActionState(updateProfileAction, { error: null })
  const [values, setValues] = useState({ name: user.name ?? '', email: user.email, avatarUrl: user.avatarUrl ?? '' })
  useDone(state, 'Profile saved')
  const label = values.name || values.email

  return (
    <Card id="profile" className="scroll-mt-4">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Your name and email for signing in. Invoices use the company details above.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="theme" value={user.theme} />
          <div className="flex items-center gap-3">
            <Avatar size="12">
              {values.avatarUrl && <AvatarImage src={values.avatarUrl} alt="" />}
              <AvatarFallback>{initials(label)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{label}</span>
              <span className="text-xs text-muted-foreground">{user.role === 'owner' ? 'Owner' : 'Member'} · since {formatDate(user.createdAt)}</span>
            </div>
          </div>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="profile-name">Name</FieldLabel>
              <Input id="profile-name" name="name" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} />
            </Field>
            <Field>
              <FieldLabel htmlFor="profile-email">Email</FieldLabel>
              <Input id="profile-email" name="email" type="email" required value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="profile-avatar">Avatar URL</FieldLabel>
              <Input id="profile-avatar" name="avatarUrl" type="url" placeholder="https://" value={values.avatarUrl} onChange={(event) => setValues({ ...values, avatarUrl: event.target.value })} />
            </Field>
          </FieldGroup>
          <FormError state={state} />
          <Button type="submit" loading={pending} className="self-end">
            Save profile
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export function PasswordCard() {
  const [state, action, pending] = useActionState(changePasswordAction, { error: null })
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  useDone(state, 'Password changed. Other devices are signed out.', () => setForm({ currentPassword: '', newPassword: '', confirmPassword: '' }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>At least 10 characters. Changing it signs you out on other devices.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-4">
          <FieldGroup className="grid gap-4 sm:grid-cols-3">
            {(
              [
                ['currentPassword', 'Current password', 'current-password'],
                ['newPassword', 'New password', 'new-password'],
                ['confirmPassword', 'Repeat new password', 'new-password'],
              ] as const
            ).map(([name, label, autoComplete]) => (
              <Field key={name}>
                <FieldLabel htmlFor={`password-${name}`}>{label}</FieldLabel>
                <Input
                  id={`password-${name}`}
                  name={name}
                  type="password"
                  autoComplete={autoComplete}
                  required
                  value={form[name]}
                  onChange={(event) => setForm({ ...form, [name]: event.target.value })}
                />
              </Field>
            ))}
          </FieldGroup>
          <FormError state={state} />
          <Button type="submit" variant="outline" loading={pending} className="self-end">
            <IconPasswordStars />
            Change password
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// ——— Companies ————————————————————————————————————————————————————————————————————————————

export function CompaniesSection({ companies, openNew }: { companies: Company[]; openNew: boolean }) {
  const [editing, setEditing] = useState<Company | 'new' | null>(openNew ? 'new' : null)
  const [working, start] = useTransition()

  return (
    <section id="companies" className="flex scroll-mt-4 flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-foreground">Companies</h2>
          <p className="text-sm text-muted-foreground">Each company is a brand you invoice from: its logo, details, numbering and default notes.</p>
        </div>
        <Button variant="outline" onClick={() => setEditing('new')}>
          <IconPlusMedium />
          Add company
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {companies.map((company) => (
          <Card key={company.id}>
            <CardHeader>
              <div className="flex items-center gap-3">
                {company.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={company.logoUrl} alt="" className="size-10 rounded-md object-cover" />
                ) : (
                  <span className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <IconBuildings />
                  </span>
                )}
                <div className="flex min-w-0 flex-col">
                  <CardTitle className="truncate">{company.name}</CardTitle>
                  <CardDescription className="truncate">{company.email ?? 'No email'}</CardDescription>
                </div>
              </div>
              <CardAction>{company.isDefault && <Badge color="blue">Default</Badge>}</CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Numbering</dt>
                  <dd className="font-mono">{company.invoicePrefix}001</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Currency</dt>
                  <dd className="font-medium">{company.defaultCurrency}</dd>
                </div>
              </dl>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(company)}>
                  <IconPencil />
                  Edit
                </Button>
                {companies.length > 1 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={working}>
                        <IconTrashCan />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {company.name}?</AlertDialogTitle>
                        <AlertDialogDescription>Only companies without invoices can be deleted.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          onClick={() =>
                            start(async () => {
                              const result = await deleteCompanyAction(company.id)
                              if (result.error) toast.error(result.error)
                              else toast.success('Company deleted')
                            })
                          }
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <CompanyDialog key={editing === 'new' ? 'new' : (editing?.id ?? 'closed')} company={editing} onClose={() => setEditing(null)} />
    </section>
  )
}

function CompanyDialog({ company, onClose }: { company: Company | 'new' | null; onClose: () => void }) {
  const [state, action, pending] = useActionState(saveCompanyAction, { error: null })
  const existing = company && company !== 'new' ? company : null
  const [notes, setNotes] = useState<(Note & { key: number })[]>(() => (existing?.defaultNotes ?? []).map((note, key) => ({ ...note, key })))
  useDone(state, existing ? 'Company saved' : 'Company added', onClose)

  return (
    <Dialog open={company !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        <form action={action} className="flex flex-col gap-4">
          {existing && <input type="hidden" name="id" value={existing.id} />}
          <DialogHeader>
            <DialogTitle>{existing ? `Edit ${existing.name}` : 'Add company'}</DialogTitle>
            <DialogDescription>These details appear on invoices under “From”.</DialogDescription>
          </DialogHeader>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="company-name">Name</FieldLabel>
              <Input id="company-name" name="name" required defaultValue={existing?.name} />
            </Field>
            <Field>
              <FieldLabel htmlFor="company-tagline">Tagline</FieldLabel>
              <Input id="company-tagline" name="tagline" defaultValue={existing?.tagline ?? ''} placeholder="Design studio" />
            </Field>
            <Field>
              <FieldLabel htmlFor="company-email">Email on invoices</FieldLabel>
              <Input id="company-email" name="email" type="email" defaultValue={existing?.email ?? ''} />
            </Field>
            <Field>
              <FieldLabel htmlFor="company-contact">“Get in touch” email</FieldLabel>
              <Input id="company-contact" name="contactEmail" type="email" defaultValue={existing?.contactEmail ?? ''} placeholder="Same as above" />
            </Field>
            <Field>
              <FieldLabel htmlFor="company-website">Website</FieldLabel>
              <Input id="company-website" name="website" type="url" defaultValue={existing?.website ?? ''} placeholder="https://" />
            </Field>
            <Field>
              <FieldLabel htmlFor="company-tax">Tax ID</FieldLabel>
              <Input id="company-tax" name="taxId" defaultValue={existing?.taxId ?? ''} />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="company-logo">Logo URL</FieldLabel>
              <Input id="company-logo" name="logoUrl" type="url" defaultValue={existing?.logoUrl ?? ''} placeholder="https://…/logo.png" />
              <FieldDescription>A square image. Without one, invoices show the first letter of the name.</FieldDescription>
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="company-address">Address</FieldLabel>
              <Textarea id="company-address" name="address" rows={2} defaultValue={existing?.address ?? ''} />
            </Field>
            <Field>
              <FieldLabel htmlFor="company-prefix">Invoice prefix</FieldLabel>
              <Input id="company-prefix" name="invoicePrefix" className="font-mono" defaultValue={existing?.invoicePrefix ?? 'INV-'} />
            </Field>
            <Field>
              <FieldLabel htmlFor="company-currency">Default currency</FieldLabel>
              <Input id="company-currency" name="defaultCurrency" maxLength={3} className="uppercase" defaultValue={existing?.defaultCurrency ?? 'USD'} />
            </Field>
          </FieldGroup>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Default notes</span>
            {notes.map((note, index) => (
              <div key={note.key} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <div className="flex flex-col gap-2">
                  <Input name="noteTitle" aria-label={`Note ${index + 1} title`} placeholder="Title" value={note.title} onChange={(event) => setNotes((rows) => rows.map((row) => (row.key === note.key ? { ...row, title: event.target.value } : row)))} />
                  <Textarea name="noteBody" aria-label={`Note ${index + 1} text`} rows={2} placeholder="Text" value={note.body} onChange={(event) => setNotes((rows) => rows.map((row) => (row.key === note.key ? { ...row, body: event.target.value } : row)))} />
                </div>
                <Button type="button" variant="ghost" size="icon" aria-label={`Remove note ${index + 1}`} onClick={() => setNotes((rows) => rows.filter((row) => row.key !== note.key))}>
                  <IconCrossMedium />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setNotes((rows) => [...rows, { title: '', body: '', key: Date.now() }])}>
              <IconPlusMedium />
              Add note
            </Button>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium">
            <Checkbox name="isDefault" defaultChecked={existing?.isDefault ?? false} />
            Use for new invoices by default
          </label>
          <FormError state={state} />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" loading={pending}>
              {existing ? 'Save company' : 'Add company'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ——— Accounts —————————————————————————————————————————————————————————————————————————————

export function AccountsSection({ accounts, currentUserId }: { accounts: (User & { invoiceCount: number })[]; currentUserId: string }) {
  const [adding, setAdding] = useState(false)
  const [resetting, setResetting] = useState<User | null>(null)
  const [working, start] = useTransition()

  return (
    <Card id="accounts" className="scroll-mt-4">
      <CardHeader>
        <CardTitle>Accounts</CardTitle>
        <CardDescription>Everyone signs in with email and password and sees only their own clients, invoices and payments.</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <IconUserDuo />
            Add account
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border px-2">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Account</TableHead>
                <TableHead className="hidden sm:table-cell">Role</TableHead>
                <TableHead className="hidden md:table-cell">Invoices</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>
                    <span className="flex items-center gap-2.5">
                      <Avatar size="8">
                        {account.avatarUrl && <AvatarImage src={account.avatarUrl} alt="" />}
                        <AvatarFallback>{initials(account.name || account.email)}</AvatarFallback>
                      </Avatar>
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-medium">{account.name || account.email}</span>
                        {account.name && <span className="truncate text-xs text-muted-foreground">{account.email}</span>}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={account.role === 'owner' ? 'default' : 'secondary'}>{account.role === 'owner' ? 'Owner' : 'Member'}</Badge>
                  </TableCell>
                  <TableCell className="hidden tabular-nums md:table-cell">{account.invoiceCount}</TableCell>
                  <TableCell>
                    {account.id !== currentUserId && account.role !== 'owner' && (
                      <span className="flex gap-1">
                        <Button variant="ghost" size="icon-sm" aria-label={`Set a new password for ${account.email}`} onClick={() => setResetting(account)}>
                          <IconPasswordStars />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon-sm" aria-label={`Delete ${account.email}`} disabled={working}>
                              <IconTrashCan />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete {account.email}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Their companies, clients, invoices and payments are deleted with the account. This can’t be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                variant="destructive"
                                onClick={() =>
                                  start(async () => {
                                    const result = await deleteAccountAction(account.id)
                                    if (result.error) toast.error(result.error)
                                    else toast.success('Account deleted')
                                  })
                                }
                              >
                                Delete account
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <AddAccountDialog open={adding} onOpenChange={setAdding} />
      <ResetPasswordDialog account={resetting} onClose={() => setResetting(null)} />
    </Card>
  )
}

function AddAccountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [state, action, pending] = useActionState(createAccountAction, { error: null })
  useDone(state, 'Account created', () => onOpenChange(false))
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form action={action} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Add account</DialogTitle>
            <DialogDescription>Share the email and temporary password with the person. They can change the password in Settings.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="account-name">Name</FieldLabel>
              <Input id="account-name" name="name" />
            </Field>
            <Field>
              <FieldLabel htmlFor="account-email">Email</FieldLabel>
              <Input id="account-email" name="email" type="email" required placeholder="you@example.com" />
            </Field>
            <Field>
              <FieldLabel htmlFor="account-password">Temporary password</FieldLabel>
              <Input id="account-password" name="password" type="text" autoComplete="off" required minLength={10} />
              <FieldDescription>At least 10 characters.</FieldDescription>
            </Field>
          </FieldGroup>
          <FormError state={state} />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" loading={pending}>
              Create account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ResetPasswordDialog({ account, onClose }: { account: User | null; onClose: () => void }) {
  const [state, action, pending] = useActionState(resetPasswordAction, { error: null })
  useDone(state, 'Password updated', onClose)
  return (
    <Dialog open={account !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={account?.id ?? ''} />
          <DialogHeader>
            <DialogTitle>New password for {account?.email}</DialogTitle>
            <DialogDescription>Signs them out everywhere. Share the new password with them.</DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="reset-password">New password</FieldLabel>
            <Input id="reset-password" name="password" type="text" autoComplete="off" required minLength={10} />
          </Field>
          <FormError state={state} />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" loading={pending}>
              Set password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
