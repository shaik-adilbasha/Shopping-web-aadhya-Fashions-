'use server'

import { timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { OWNER_COOKIE, ownerConfigured, signSession } from '@/lib/owner-auth'

const same = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

export async function ownerLogin(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  if (!ownerConfigured())
    return { ok: false, error: 'Owner login is not set up yet. Add OWNER_EMAIL, OWNER_PASSWORD and OWNER_SESSION_SECRET in Vercel → Settings → Environment Variables.' }
  const okEmail = same(email.trim().toLowerCase(), (process.env.OWNER_EMAIL ?? '').trim().toLowerCase())
  const okPass = same(password, process.env.OWNER_PASSWORD ?? '')
  if (!okEmail || !okPass) return { ok: false, error: 'Incorrect owner email or password.' }
  ;(await cookies()).set(OWNER_COOKIE, signSession(process.env.OWNER_EMAIL!), {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 12,
  })
  return { ok: true }
}
export async function ownerLogout() {
  ;(await cookies()).delete(OWNER_COOKIE)
}
