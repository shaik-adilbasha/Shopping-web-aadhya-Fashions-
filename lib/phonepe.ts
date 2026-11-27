// Server-side PhonePe Payment Gateway (Standard Checkout v2, OAuth client credentials). Secrets stay in env vars.
const env = process.env

export const phonepeEnabled = () => !!(env.PHONEPE_CLIENT_ID && env.PHONEPE_CLIENT_SECRET && env.PHONEPE_CLIENT_VERSION)

const urls = () =>
  env.PHONEPE_ENV === 'production'
    ? { token: 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token', base: 'https://api.phonepe.com/apis/pg' }
    : { token: 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token', base: 'https://api-preprod.phonepe.com/apis/pg-sandbox' }

let cached: { token: string; exp: number } | null = null

async function getToken(force = false) {
  if (!force && cached && cached.exp > Date.now() + 60_000) return cached.token
  const res = await fetch(urls().token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.PHONEPE_CLIENT_ID!,
      client_version: env.PHONEPE_CLIENT_VERSION!,
      client_secret: env.PHONEPE_CLIENT_SECRET!,
      grant_type: 'client_credentials',
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.access_token) throw new Error('PhonePe login failed. Check Client ID, Secret, Version and PHONEPE_ENV.')
  cached = { token: data.access_token, exp: (Number(data.expires_at) || Date.now() / 1000 + 900) * 1000 }
  return cached.token
}

/** Authenticated call to PhonePe; refreshes the token once on 401. */
export async function phonepeCall(path: string, init: { method?: string; body?: string } = {}) {
  for (const force of [false, true]) {
    const res = await fetch(urls().base + path, {
      method: init.method ?? 'GET',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `O-Bearer ${await getToken(force)}` },
      body: init.body,
    })
    if (res.status !== 401 || force) return { ok: res.ok, status: res.status, data: (await res.json().catch(() => ({}))) as Record<string, unknown> }
  }
  throw new Error('unreachable')
}
