import type { ReactNode } from 'react'

/** The bar pinned to the bottom of the public invoice: a contact link and the ways to pay. */
export function PayBar({ contactEmail, invoiceNumber, children }: { contactEmail: string | null; invoiceNumber: string; children?: ReactNode }) {
  if (!contactEmail && !children) return null
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-popover/80 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-lg">
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3">
        {contactEmail ? (
          <p className="text-sm text-muted-foreground">
            Have a question?{' '}
            <a
              className="font-medium text-foreground underline-offset-4 hover:underline"
              href={`mailto:${contactEmail}?subject=${encodeURIComponent(`Invoice ${invoiceNumber}`)}`}
            >
              Get in touch
            </a>
          </p>
        ) : (
          <span />
        )}
        {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
      </div>
    </div>
  )
}
