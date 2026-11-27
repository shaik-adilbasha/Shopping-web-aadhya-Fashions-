'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { categories, services } from '@/lib/catalog'
import { useStore } from '@/lib/store'
import { btnPrimary, inputCls, waHref } from '@/lib/wa'
import { PageTitle } from '@/components/shop/ui-bits'

const card = 'rounded-2xl bg-white p-5 ring-1 ring-border'

export function ContactView() {
  const { settings: s } = useStore()
  const [f, setF] = useState({ name: '', phone: '', message: '' })
  const rows = [
    { icon: Phone, label: 'Phone', value: s.phone, href: s.phone ? `tel:${s.phone}` : '' },
    { icon: MessageCircle, label: 'WhatsApp', value: s.whatsapp, href: s.whatsapp ? waHref(s.whatsapp, 'Hello! I have an enquiry.') : '' },
    { icon: Mail, label: 'Email', value: s.email, href: s.email ? `mailto:${s.email}` : '' },
    { icon: MapPin, label: 'Address', value: s.address, href: '' },
  ]
  const send = (e: React.FormEvent) => {
    e.preventDefault()
    if (f.phone.replace(/\D/g, '').length !== 10) return toast.error('Enter a valid 10-digit phone number.')
    if (!s.whatsapp) return toast.error('The boutique has not set a WhatsApp number yet. Please call or email instead.')
    window.open(waHref(s.whatsapp, `Hello! I'm ${f.name} (${f.phone}).\n${f.message}`), '_blank', 'noopener')
  }
  return (
    <div className="px-4 pt-6 md:px-8">
      <PageTitle>Contact Us</PageTitle>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className={card + ' flex flex-col gap-4'}>
          {rows.map(({ icon: Icon, label, value, href }) => (
            <div key={label} className="flex items-start gap-3 text-sm">
              <span className="flex size-9 items-center justify-center rounded-full bg-blush text-primary"><Icon className="size-4" /></span>
              <span><span className="block text-xs text-muted-foreground">{label}</span>{value ? (href ? <a href={href} className="text-ink hover:text-primary" target={label === 'WhatsApp' ? '_blank' : undefined} rel="noopener noreferrer">{value}</a> : value) : <span className="text-muted-foreground">Not added yet</span>}</span>
            </div>
          ))}
          <div className="flex items-start gap-3 text-sm"><span className="flex size-9 items-center justify-center rounded-full bg-blush text-primary"><Clock className="size-4" /></span><span><span className="block text-xs text-muted-foreground">Business hours</span><span className="whitespace-pre-line">{s.hours}</span></span></div>
          {s.mapUrl && <iframe title="Boutique location" src={s.mapUrl} className="h-56 w-full rounded-xl border-0" loading="lazy" />}
        </section>
        <form onSubmit={send} className={card + ' flex flex-col gap-3'}>
          <h2 className="text-base font-medium">Send us a message</h2>
          <input required minLength={2} placeholder="Your name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inputCls} />
          <input required inputMode="numeric" maxLength={10} placeholder="Phone number" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className={inputCls} />
          <textarea required minLength={5} rows={4} placeholder="How can we help?" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} className={inputCls + ' h-auto py-2'} />
          <button type="submit" className={btnPrimary}>Send via WhatsApp</button>
          <p className="text-[11px] text-muted-foreground">This opens WhatsApp with your message ready to send.</p>
        </form>
      </div>
    </div>
  )
}

export function AboutView() {
  const { settings: s, catalogVersion } = useStore()
  return (
    <div className="px-4 pt-6 md:px-8" key={catalogVersion}>
      <PageTitle>About Us</PageTitle>
      <section className="floral-bg mt-5 rounded-3xl bg-white p-6 ring-1 ring-border md:p-10">
        <h2 className="font-serif text-3xl text-primary">{s.boutiqueName}</h2>
        <p className="mt-1 text-sm text-ink/70">Traditional beauty, modern elegance.</p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink/85">We bring together handpicked Kanchipuram and Banarasi silk sarees, lehengas, ready-made maggam work and jewellery, along with stitching, custom embroidery, beauty parlour and bridal makeup — everything for your special moments, under one roof.</p>
      </section>
      <h3 className="mt-8 font-serif text-xl text-ink">Our Collections</h3>
      <ul className="mt-3 flex flex-wrap gap-2">{categories.map((c) => <li key={c.id}><Link href={`/shop?category=${c.id}`} className="rounded-full bg-blush px-4 py-2 text-xs text-primary hover:bg-rose-soft">{c.label}</Link></li>)}</ul>
      <h3 className="mt-8 font-serif text-xl text-ink">Our Services</h3>
      <ul className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {services.map((v) => (
          <li key={v.slug}><Link href={`/services/${v.slug}`} className="block overflow-hidden rounded-2xl bg-white ring-1 ring-border"><span className="relative block aspect-[4/3]"><Image src={v.image || '/placeholder.svg'} alt={v.name} fill sizes="25vw" className="object-cover" /></span><span className="block p-3 text-sm">{v.name}</span></Link></li>
        ))}
      </ul>
    </div>
  )
}
