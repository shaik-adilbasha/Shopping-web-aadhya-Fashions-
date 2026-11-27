import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

export const OWNER_COOKIE = 'aadhya_owner'
const secret = () => process.env.OWNER_SESSION_SECRET ?? ''

export function ownerConfigured() {
  return !!(process.env.OWNER_EMAIL && process.env.OWNER_PASSWORD && process.env.OWNER_SESSION_SECRET)
}
export function signSession(email: string) {
  const exp = Date.now() + 1000 * 60 * 60 * 12
  const body = `${email}|${exp}`
  const sig = createHmac('sha256', secret()).update(body).digest('hex')
  return Buffer.from(`${body}|${sig}`).toString('base64url')
}
export function verifySession(token?: string) {
  if (!token || !secret()) return false
  try {
    const [email, exp, sig] = Buffer.from(token, 'base64url').toString().split('|')
    const expected = createHmac('sha256', secret()).update(`${email}|${exp}`).digest('hex')
    const a = Buffer.from(sig ?? ''), b = Buffer.from(expected)
    return a.length === b.length && timingSafeEqual(a, b) && Number(exp) > Date.now() && email === process.env.OWNER_EMAIL
  } catch {
    return false
  }
}
export async function isOwner() {
  return verifySession((await cookies()).get(OWNER_COOKIE)?.value)
}
