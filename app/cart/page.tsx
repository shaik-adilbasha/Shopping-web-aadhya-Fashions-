import type { Metadata } from 'next'
import { CartView } from '@/components/cart/cart-view'

export const metadata: Metadata = { title: 'Your Cart — Aadhya Fashions Studios' }

export default function CartPage() {
  return <CartView />
}
