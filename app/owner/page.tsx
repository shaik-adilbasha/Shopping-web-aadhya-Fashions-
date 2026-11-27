import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { OwnerApp } from '@/components/owner/owner-app'
import { isOwner } from '@/lib/owner-auth'

export const metadata: Metadata = { title: 'Owner Dashboard — Aadhya Fashions Studios', robots: { index: false } }

export default async function OwnerPage() {
  if (!(await isOwner())) redirect('/owner/login')
  return <OwnerApp />
}
