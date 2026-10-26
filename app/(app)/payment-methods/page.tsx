import type { Metadata } from 'next'

import { PageBody, PageHeader } from '@/components/app/page-header'
import { MethodsView } from '@/components/payment-methods/methods-view'
import { requireUser } from '@/lib/auth'
import { listPaymentMethods } from '@/lib/data/payment-methods'

export const metadata: Metadata = { title: 'Payment methods' }

export default async function PaymentMethodsPage() {
  const user = await requireUser('/payment-methods')
  const methods = await listPaymentMethods(user.id)
  return (
    <>
      <PageHeader crumbs={[{ label: 'Payment methods' }]} />
      <PageBody title="Payment methods" description="Stripe, crypto wallets, bank details and payment links, each with your own name.">
        <MethodsView methods={methods} />
      </PageBody>
    </>
  )
}
