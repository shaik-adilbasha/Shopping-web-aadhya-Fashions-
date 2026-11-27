'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'
import { ownerLogin } from '@/app/actions/owner'
import { btnPrimary, inputCls } from '@/lib/wa'

export function OwnerLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [pending, start] = useTransition()
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    start(async () => {
      const r = await ownerLogin(email, pw)
      if (r.ok) router.push('/owner')
      else setError(r.error ?? 'Login failed.')
    })
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="relative">
        <Mail className="absolute left-3 top-3 size-4 text-muted-foreground" />
        <input required type="email" autoComplete="username" placeholder="Owner email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls + ' pl-9'} />
      </div>
      <div className="relative">
        <Lock className="absolute left-3 top-3 size-4 text-muted-foreground" />
        <input required type={show ? 'text' : 'password'} autoComplete="current-password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} className={inputCls + ' px-9'} />
        <button type="button" onClick={() => setShow((s) => !s)} aria-label="Show password" className="absolute right-3 top-3 text-muted-foreground">
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      <button type="submit" disabled={pending} className={btnPrimary + ' gap-2'}>
        {pending && <Loader2 className="size-4 animate-spin" />} Owner Login
      </button>
    </form>
  )
}
