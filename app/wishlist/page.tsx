import type { Metadata } from 'next'
import { WishlistView } from '@/components/account/views'

export const metadata: Metadata = { title: 'Wishlist — Aadhya Fashions Studios' }

export default function Page() {
  return <WishlistView />
}
