import type { Metadata } from 'next'
import { ContactView } from '@/components/account/info'

export const metadata: Metadata = { title: 'Contact Us — Aadhya Fashions Studios' }

export default function Page() {
  return <ContactView />
}
