import type { Metadata } from 'next'
import { CheckoutView } from '@/components/checkout/checkout-view'

export const metadata: Metadata = { title: 'Checkout — Aadhya Fashions Studios' }

export default function CheckoutPage() {
  return <CheckoutView />
}
