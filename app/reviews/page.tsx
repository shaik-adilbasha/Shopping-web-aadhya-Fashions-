import type { Metadata } from 'next'
import { ReviewsView } from '@/components/account/views'

export const metadata: Metadata = { title: 'My Reviews — Aadhya Fashions Studios' }

export default function Page() {
  return <ReviewsView />
}
