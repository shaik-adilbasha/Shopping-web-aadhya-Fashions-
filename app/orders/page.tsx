import type { Metadata } from 'next'
import { OrdersView } from '@/components/account/views'

export const metadata: Metadata = { title: 'My Orders — Aadhya Fashions Studios' }

export default function Page() {
  return <OrdersView />
}
