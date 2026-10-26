import type { Metadata } from 'next'
import { IconWallet1 } from 'central-icons'

import { ComingNext } from '@/components/app/coming-next'
import { PageBody, PageHeader } from '@/components/app/page-header'
import { requireUser } from '@/lib/auth'

export const metadata: Metadata = { title: 'Payment methods' }

export default async function PaymentMethodsPage() {
  await requireUser('/payment-methods')
  return (
    <>
      <PageHeader crumbs={[{ label: 'Payment methods' }]} />
      <PageBody title="Payment methods" description="Stripe, crypto wallets and bank details, each with your own name.">
        <ComingNext icon={<IconWallet1 />} title="Payment methods are coming next" description="Stripe (API or your own payment link), crypto wallets with QR codes and bank transfers." />
      </PageBody>
    </>
  )
}
