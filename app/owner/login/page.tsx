import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LogoBadge } from '@/components/brand/logo'
import { OwnerLoginForm } from '@/components/owner/login-form'
import { isOwner } from '@/lib/owner-auth'

export const metadata: Metadata = { title: 'Owner Login — Aadhya Fashions Studios', robots: { index: false } }

export default async function OwnerLoginPage() {
  if (await isOwner()) redirect('/owner')
  return (
    <div className="floral-bg flex min-h-svh items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 ring-1 ring-border">
        <LogoBadge className="mx-auto" />
        <h1 className="mt-3 text-center font-serif text-2xl text-ink">Owner Login</h1>
        <p className="mb-6 mt-1 text-center text-xs text-muted-foreground">Authorised boutique owners only</p>
        <OwnerLoginForm />
      </div>
    </div>
  )
}
