'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const slides = [
  {
    eyebrow: 'Aadhya Fashions Studio',
    title: 'Timeless Sarees for Every Occasion',
    subtitle: 'Grace in every thread | Tradition in every fold',
    cta: 'Shop Now',
    href: '/shop?category=sarees',
    image: '/images/hero-model.png',
    alt: 'Woman wearing a pink silk saree with gold jewellery',
  },
  {
    eyebrow: 'Aadhya Fashions Studio',
    title: 'The Collection',
    subtitle: 'Sarees & jewellery for every celebration.',
    cta: 'Explore Now',
    href: '/shop',
    image: '/images/hero-collection.png',
    alt: 'Folded pink and gold Kanchipuram silk sarees with jewellery',
  },
  {
    eyebrow: 'Aadhya Fashions Studio',
    title: 'Bridal Lehengas for Your Big Day',
    subtitle: 'Designer festive and bridal wear',
    cta: 'Shop Lehengas',
    href: '/shop?category=lehengas',
    image: '/images/lehenga-pink.png',
    alt: 'Pink bridal lehenga',
  },
  {
    eyebrow: 'Aadhya Fashions Studio',
    title: 'Jewellery That Shines',
    subtitle: 'Gold plated jhumkas, sets and more',
    cta: 'Shop Jewellery',
    href: '/shop?category=jewellery',
    image: '/images/jewellery-set.png',
    alt: 'Gold plated jewellery set',
  },
]

export function HeroCarousel() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000)
    return () => clearInterval(id)
  }, [])

  return (
    <section aria-roledescription="carousel" aria-label="Featured collections" className="relative overflow-hidden rounded-xl bg-blush shadow-[0_8px_30px_-12px_rgb(216_27_106/0.3)] ring-1 ring-rose-line md:rounded-2xl">
      <div className="relative h-[176px] md:h-[240px]">
        {slides.map((s, i) => (
          <div
            key={s.title}
            aria-hidden={i !== index}
            className={cn(
              'floral-bg absolute inset-0 grid grid-cols-[1.35fr_1fr] transition-opacity duration-700 md:grid-cols-[1fr_1.2fr]',
              i === index ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
          >
            <div className="relative z-10 flex flex-col justify-center pl-4 pr-1 md:pl-[72px] md:pr-2">
              <p className="text-[8.5px] font-medium uppercase tracking-[0.2em] text-primary md:text-[15px]">{s.eyebrow}</p>
              <h2
                className={cn(
                  'mt-1.5 text-balance font-serif font-medium leading-[1.12] text-ink transition-all duration-700 md:mt-2 md:font-semibold md:leading-[1.05]',
                  i === index ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
                  s.title.length > 16 ? 'text-[22px] md:text-[44px]' : 'text-[30px] md:text-[64px]',
                )}
              >
                {s.title}
              </h2>
              <p className="mt-1.5 whitespace-nowrap text-[10px] text-ink/75 md:mt-3 md:whitespace-normal md:text-lg">{s.subtitle}</p>
              <Link
                href={s.href}
                tabIndex={i === index ? 0 : -1}
                className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[12px] font-medium text-white shadow-lg shadow-primary/30 transition-all hover:gap-3 hover:bg-primary/90 md:mt-6 md:gap-2 md:px-7 md:py-3 md:text-base"
              >
                {s.cta}
                <ArrowRight className="size-3.5 md:size-4" />
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 -left-16 right-0 overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_45%)] md:-left-6 md:rounded-l-[160px] md:[mask-image:none]">
                <Image
                  src={s.image || '/placeholder.svg'}
                  alt={s.alt}
                  fill
                  priority={i === 0}
                  sizes="(min-width: 768px) 50vw, 60vw"
                  className={cn('object-cover transition-transform duration-[6000ms] ease-out', i === index ? 'scale-105' : 'scale-100')}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 gap-1.5 md:bottom-3 md:left-auto md:right-6 md:translate-x-0 md:gap-2">
        {slides.map((s, i) => (
          <button
            key={s.title}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Show slide ${i + 1}`}
            aria-current={i === index}
            className={cn('size-2 rounded-full transition-all md:h-2', i === index ? 'bg-primary md:w-5' : 'bg-white ring-1 ring-primary/30 md:w-2')}
          />
        ))}
      </div>
    </section>
  )
}
