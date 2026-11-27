import type { Metadata } from 'next'
import { PhonePeReturn } from '@/components/checkout/phonepe-return'

export const metadata: Metadata = { title: 'Confirming payment — Aadhya Fashions Studio', robots: { index: false } }

export default function Page() {
  return <PhonePeReturn />
}
