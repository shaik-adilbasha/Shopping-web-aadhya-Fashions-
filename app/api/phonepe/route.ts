import { NextResponse } from 'next/server'
import { phonepeEnabled } from '@/lib/phonepe'

export function GET() {
  return NextResponse.json({ enabled: phonepeEnabled() })
}
