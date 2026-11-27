import type { Metadata } from 'next'
import { AboutView } from '@/components/account/info'

export const metadata: Metadata = { title: 'About Us — Aadhya Fashions Studios' }

export default function Page() {
  return <AboutView />
}
