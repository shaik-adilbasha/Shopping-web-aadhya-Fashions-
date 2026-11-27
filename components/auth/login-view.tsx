'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { LogoBadge } from '@/components/brand/logo'
import { OwnerLoginForm } from '@/components/owner/login-form'
import { useStore } from '@/lib/store'
import { btnPrimary, inputCls } from '@/lib/wa'
import { cn } from '@/lib/utils'

export function LoginView() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  )
}

function Inner() {
  const router = useRouter()
  const next = useSearchParams().get('next') || '/account'
  const { login, register, resetPassword } = useStore()
  const [tab, setTab] = useState<'customer' | 'owner'>('customer')
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login')
  const [f, setF] = useState({ name: '', email: '', phone: '', idf: '', password: '' })
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const err =
      mode === 'login' ? await login(f.idf, f.password) : mode === 'register' ? await register({ name: f.name, email: f.email, phone: f.phone, password: f.password }) : await resetPassword(f.idf, f.password)
    setBusy(false)
    if (err) return toast.error(err)
    if (mode === 'forgot') {
      toast.success('Password updated. Please log in.')
      return setMode('login')
    }
    toast.success(mode === 'register' ? 'Account created!' : 'Welcome back!')
    router.push(next)
  }

  const title = mode === 'register' ? 'Create Account' : mode === 'forgot' ? 'Reset Password' : 'Welcome Back!'
  return (
    <div className="floral-bg px-4 py-8 md:px-8">
      <div className="mx-auto w-full max-w-[420px] rounded-3xl bg-white/90 p-7 ring-1 ring-border md:p-9">
        <LogoBadge className="mx-auto" />
        <h1 className="mt-5 text-center font-serif text-2xl text-ink">{tab === 'owner' ? 'Owner Login' : title}</h1>
        <p className="mb-5 mt-1 text-center text-xs text-muted-foreground">Sign in to continue your fashion journey</p>

        <div className="mb-5 grid grid-cols-2 rounded-lg bg-muted p-1 text-xs">
          {(['customer', 'owner'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={cn('h-9 rounded-md transition', tab === t ? 'bg-primary font-medium text-white' : 'text-ink/70')}>
              {t === 'customer' ? 'Customer Login' : 'Owner Login'}
            </button>
          ))}
        </div>

        {tab === 'owner' ? (
          <OwnerLoginForm />
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            {mode === 'register' && (
              <>
                <input required minLength={2} placeholder="Full name" value={f.name} onChange={set('name')} className={inputCls} autoComplete="name" />
                <input required type="email" placeholder="Email" value={f.email} onChange={set('email')} className={inputCls} autoComplete="email" />
                <input required inputMode="numeric" maxLength={10} placeholder="Mobile number (10 digits)" value={f.phone} onChange={set('phone')} className={inputCls} autoComplete="tel-national" />
              </>
            )}
            {mode !== 'register' && (
              <div className="relative">
                <Mail className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <input required placeholder="Email or Mobile Number" value={f.idf} onChange={set('idf')} className={inputCls + ' pl-9'} autoComplete="username" />
              </div>
            )}
            <div className="relative">
              <Lock className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <input required minLength={6} type={show ? 'text' : 'password'} placeholder={mode === 'forgot' ? 'New password' : 'Password'} value={f.password} onChange={set('password')} className={inputCls + ' px-9'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
              <button type="button" onClick={() => setShow((s) => !s)} aria-label="Show password" className="absolute right-3 top-3 text-muted-foreground">
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {mode === 'login' && (
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-ink/80"><input type="checkbox" defaultChecked className="accent-primary" /> Remember me</label>
                <button type="button" onClick={() => setMode('forgot')} className="text-primary">Forgot password?</button>
              </div>
            )}
            <button type="submit" disabled={busy} className={btnPrimary + ' gap-2'}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              {mode === 'login' ? 'Login' : mode === 'register' ? 'Create Account' : 'Update Password'}
            </button>
            {mode === 'login' && (
              <>
                <p className="text-center text-[11px] text-muted-foreground">or</p>
                <p className="text-center text-[11px] text-muted-foreground">Continue with</p>
                <div className="grid grid-cols-2 gap-3">
                  {['Google', 'Facebook'].map((n) => (
                    <button key={n} type="button" onClick={() => toast.info(`${n} sign-in needs to be connected by the owner first.`)} className="h-10 rounded-lg border border-input bg-white text-xs text-ink hover:bg-blush">
                      {n}
                    </button>
                  ))}
                </div>
              </>
            )}
            <p className="mt-2 text-center text-xs text-ink/80">
              {mode === 'register' ? 'Already have an account? ' : mode === 'forgot' ? 'Back to ' : "Don't have an account? "}
              <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="font-medium text-primary">
                {mode === 'login' ? 'Create Account' : 'Login'}
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
