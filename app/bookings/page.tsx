import type { Metadata } from 'next'
import { BookingsView } from '@/components/account/views'

export const metadata: Metadata = { title: 'My Bookings — Aadhya Fashions Studios' }

export default function Page() {
  return <BookingsView />
}
