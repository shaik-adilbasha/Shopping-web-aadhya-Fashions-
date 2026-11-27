import type { Metadata } from 'next'
import { PayView } from '@/components/checkout/pay-view'

export const metadata: Metadata = { title: 'Pay with UPI — Aadhya Fashions Studio', robots: { index: false } }

export default async function PayPage({ params }: PageProps<'/pay/[id]'>) {
  const { id } = await params
  return <PayView id={id} />
}
