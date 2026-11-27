import type { Metadata, Viewport } from 'next'
import { Jost, Playfair_Display } from 'next/font/google'
import { Toaster } from 'sonner'
import { StoreProvider } from '@/lib/store'
import { Shell } from '@/components/layout/shell'
import './globals.css'

const jost = Jost({ subsets: ['latin'], variable: '--font-jost' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })

export const metadata: Metadata = {
  title: 'Aadhya Fashions Studios — Sarees, Jewellery & Bridal Services',
  description:
    'Shop Kanchipuram & Banarasi silk sarees, lehengas, maggam work and jewellery. Book stitching, beauty parlour and bridal makeup services at Aadhya Fashions Studios.',
}

export const viewport: Viewport = {
  themeColor: '#1f0e1d',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${jost.variable} ${playfair.variable} bg-background`}>
      <body className="antialiased">
        <StoreProvider>
          <Shell>{children}</Shell>
          <Toaster position="top-center" richColors closeButton />
        </StoreProvider>
      </body>
    </html>
  )
}
