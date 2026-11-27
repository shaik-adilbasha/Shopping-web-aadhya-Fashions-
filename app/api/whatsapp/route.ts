import { NextResponse, type NextRequest } from 'next/server'

// number can come from ?to= (owner Settings, digits only) or the WHATSAPP_NUMBER env var.
export function GET(request: NextRequest) {
  const text = (request.nextUrl.searchParams.get('text') ?? '').slice(0, 1500)
  const to = (request.nextUrl.searchParams.get('to') ?? '').replace(/\D/g, '').slice(0, 15)
  const number = to || (process.env.WHATSAPP_NUMBER ?? '').replace(/\D/g, '')
  const base = number ? `https://wa.me/${number}` : 'https://wa.me/'
  return NextResponse.redirect(`${base}?text=${encodeURIComponent(text)}`)
}
