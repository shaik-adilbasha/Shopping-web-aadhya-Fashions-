import type { Metadata } from 'next'
import { AccountView } from '@/components/account/views'

export const metadata: Metadata = { title: 'My Account — Aadhya Fashions Studios' }

export default function Page() {
  return <AccountView />
}
