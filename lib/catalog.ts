export type CategoryId =
  | 'sarees'
  | 'blouses-accessories'
  | 'fabrics'
  | 'lehengas'
  | 'maggam-work'
  | 'jewellery'
  | 't-shirts'
  | 'shirts'
  | 'pants'

export type ProductColor = { name: string; hex: string }

export type Product = {
  slug: string
  name: string
  subtitle: string
  category: CategoryId
  price: number
  mrp: number
  rating: number
  reviews: number
  images: string[]
  colors: ProductColor[]
  description: string
  highlights: string[]
  specs: Record<string, string>
  stock: number
  featured?: boolean
  newArrival?: boolean
}

export type Service = {
  slug: string
  name: string
  tagline: string
  startingPrice: number
  image: string
  description: string
  includes: string[]
  duration: string
}

export const categories: { id: CategoryId; label: string; short: string }[] = [
  { id: 'sarees', label: 'Sarees', short: 'Sarees' },
  { id: 'blouses-accessories', label: 'Matching Blouses & Accessories', short: 'Accessories' },
  { id: 'fabrics', label: 'Fabrics', short: 'Fabrics' },
  { id: 'lehengas', label: 'Lehengas', short: 'Lehengas' },
  { id: 'maggam-work', label: 'Ready-made Maggam Work', short: 'Maggam Work' },
  { id: 'jewellery', label: 'Jewellery', short: 'Jewellery' },
  { id: 't-shirts', label: 'T-Shirts', short: 'T-Shirts' },
  { id: 'shirts', label: 'Shirts', short: 'Shirts' },
  { id: 'pants', label: 'Pants', short: 'Pants' },
]

const palette = {
  pink: { name: 'Rani Pink', hex: '#d81b6a' },
  purple: { name: 'Royal Purple', hex: '#6a2fb5' },
  maroon: { name: 'Maroon', hex: '#8a3a3a' },
  green: { name: 'Bottle Green', hex: '#1f7a3e' },
  cream: { name: 'Ivory', hex: '#f6efdc' },
  red: { name: 'Sindoor Red', hex: '#c62828' },
  gold: { name: 'Antique Gold', hex: '#c9a13b' },
  orange: { name: 'Saffron', hex: '#e07b28' },
}

export const products: Product[] = [
  {
    slug: 'kanchipuram-silk-saree',
    name: 'Kanchipuram Silk Saree',
    subtitle: 'Traditional Elegance',
    category: 'sarees',
    price: 2499,
    mrp: 3499,
    rating: 4.8,
    reviews: 124,
    images: ['/images/kanchipuram-pink.png', '/images/hero-collection.png', '/images/banarasi-red.png'],
    colors: [palette.pink, palette.purple, palette.maroon, palette.green, palette.cream],
    description:
      'Experience the timeless beauty of Kanchipuram silk, crafted with intricate zari work, perfect for weddings, festivals and special occasions.',
    highlights: ['100% Pure Silk', 'Traditional Design', 'Rich Zari Work', 'Premium Quality'],
    specs: { Fabric: 'Pure Kanchipuram Silk', Length: '5.5 m + 0.8 m blouse', Work: 'Gold zari weave', Care: 'Dry clean only' },
    stock: 12,
    featured: true,
  },
  {
    slug: 'banarasi-silk-saree',
    name: 'Banarasi Silk Saree',
    subtitle: 'Royal Heritage',
    category: 'sarees',
    price: 1999,
    mrp: 2999,
    rating: 4.7,
    reviews: 98,
    images: ['/images/banarasi-red.png', '/images/kanchipuram-pink.png'],
    colors: [palette.red, palette.pink, palette.gold],
    description: 'Handwoven Banarasi silk with heavy brocade, a regal choice for festive celebrations.',
    highlights: ['Handwoven Silk', 'Heavy Brocade', 'Festive Wear', 'Blouse Piece Included'],
    specs: { Fabric: 'Banarasi Silk', Length: '5.5 m + 0.8 m blouse', Work: 'Brocade weave', Care: 'Dry clean only' },
    stock: 8,
    featured: true,
  },
  {
    slug: 'emerald-silk-saree',
    name: 'Emerald Silk Saree',
    subtitle: 'Festive Classic',
    category: 'sarees',
    price: 2199,
    mrp: 3199,
    rating: 4.6,
    reviews: 61,
    images: ['/images/green-silk.png', '/images/kanchipuram-pink.png'],
    colors: [palette.green, palette.gold],
    description: 'A rich emerald silk saree with delicate gold zari motifs and a contrast border.',
    highlights: ['Soft Silk', 'Zari Motifs', 'Contrast Border', 'Lightweight Drape'],
    specs: { Fabric: 'Art Silk', Length: '5.5 m + 0.8 m blouse', Work: 'Zari motifs', Care: 'Dry clean only' },
    stock: 5,
    newArrival: true,
  },
  {
    slug: 'gold-plated-jhumka',
    name: 'Gold Plated Jhumka',
    subtitle: 'Classic & Timeless',
    category: 'jewellery',
    price: 1299,
    mrp: 1799,
    rating: 4.8,
    reviews: 140,
    images: ['/images/jhumka.png', '/images/jewellery-set.png'],
    colors: [palette.gold, palette.pink],
    description: 'Handcrafted gold plated jhumkas with kundan stones and pearl drops.',
    highlights: ['Gold Plated', 'Kundan Stones', 'Pearl Drops', 'Lightweight'],
    specs: { Material: 'Brass, gold plated', Stones: 'Kundan & pearl', Closure: 'Push back', Care: 'Keep away from moisture' },
    stock: 20,
    featured: true,
  },
  {
    slug: 'temple-jewellery-set',
    name: 'Jewellery Set',
    subtitle: 'Bridal Temple Collection',
    category: 'jewellery',
    price: 3999,
    mrp: 5499,
    rating: 4.6,
    reviews: 52,
    images: ['/images/jewellery-set.png', '/images/jhumka.png'],
    colors: [palette.gold, palette.red],
    description: 'Gold necklace set with matching earrings, inspired by South Indian temple jewellery.',
    highlights: ['Necklace + Earrings', 'Kundan Stones', 'Antique Finish', 'Gift Box'],
    specs: { Material: 'Alloy, gold plated', Stones: 'Kundan', Includes: 'Necklace, earrings', Care: 'Store in box' },
    stock: 7,
    newArrival: true,
  },
  {
    slug: 'designer-lehenga',
    name: 'Designer Lehenga',
    subtitle: 'Festive Collection',
    category: 'lehengas',
    price: 4999,
    mrp: 6999,
    rating: 4.8,
    reviews: 76,
    images: ['/images/lehenga-green.png', '/images/lehenga-pink.png'],
    colors: [palette.green, palette.pink],
    description: 'A designer lehenga with heavy zari embroidery, matching choli and net dupatta.',
    highlights: ['Semi-stitched', 'Zari Embroidery', 'Net Dupatta', 'Custom Fit Available'],
    specs: { Fabric: 'Silk blend', Sizes: 'S, M, L, XL', Work: 'Embroidery', Care: 'Dry clean only' },
    stock: 4,
    featured: true,
  },
  {
    slug: 'bridal-lehenga-set',
    name: 'Lehenga Set',
    subtitle: 'Bridal Edit',
    category: 'lehengas',
    price: 4999,
    mrp: 7499,
    rating: 4.7,
    reviews: 44,
    images: ['/images/lehenga-pink.png', '/images/lehenga-green.png'],
    colors: [palette.pink, palette.red],
    description: 'Rani pink bridal lehenga with gold embroidery, perfect for your special day.',
    highlights: ['Bridal Wear', 'Gold Embroidery', 'Sheer Dupatta', 'Can-can Included'],
    specs: { Fabric: 'Raw silk', Sizes: 'S, M, L, XL', Work: 'Zardozi', Care: 'Dry clean only' },
    stock: 3,
  },
  {
    slug: 'banarasi-silk-fabric',
    name: 'Banarasi Silk Fabric',
    subtitle: 'Premium Quality',
    category: 'fabrics',
    price: 899,
    mrp: 1299,
    rating: 4.5,
    reviews: 33,
    images: ['/images/banarasi-fabric.png'],
    colors: [palette.purple, palette.pink, palette.orange],
    description: 'Premium Banarasi brocade fabric, sold per metre, ideal for blouses and kurtas.',
    highlights: ['Sold per metre', 'Brocade Weave', '44 inch width', 'Rich Colours'],
    specs: { Fabric: 'Banarasi brocade', Width: '44 inch', Unit: '1 metre', Care: 'Dry clean only' },
    stock: 40,
    featured: true,
  },
  {
    slug: 'maggam-work-blouse',
    name: 'Maggam Work Blouse',
    subtitle: 'Handcrafted Aari',
    category: 'maggam-work',
    price: 2799,
    mrp: 3599,
    rating: 4.9,
    reviews: 29,
    images: ['/images/maggam-blouse.png'],
    colors: [palette.maroon, palette.pink],
    description: 'Ready-made maggam blouse with intricate hand embroidery, beads and stones.',
    highlights: ['Hand Embroidered', 'Beads & Stones', 'Padded', 'Sizes 32-42'],
    specs: { Fabric: 'Silk', Sizes: '32, 34, 36, 38, 40, 42', Work: 'Maggam / Aari', Care: 'Dry clean only' },
    stock: 6,
    newArrival: true,
  },
  {
    slug: 'matching-blouse-accessories',
    name: 'Matching Blouse Set',
    subtitle: 'Blouse & Bangles',
    category: 'blouses-accessories',
    price: 1199,
    mrp: 1599,
    rating: 4.4,
    reviews: 18,
    images: ['/images/blouse-accessories.png'],
    colors: [palette.pink, palette.gold],
    description: 'Matching silk blouse piece with bangles and potli bag to complete your look.',
    highlights: ['Blouse Piece', 'Bangles Set', 'Potli Bag', 'Gift Ready'],
    specs: { Fabric: 'Silk', Includes: 'Blouse, bangles, potli', Care: 'Dry clean only' },
    stock: 15,
  },
]

export const services: Service[] = [
  {
    slug: 'stitching-tailoring',
    name: 'Stitching & Tailoring',
    tagline: 'Perfect fit, every time',
    startingPrice: 499,
    image: '/images/stitching.png',
    description: 'Custom blouse, lehenga and dress stitching by our expert tailors with precise measurements.',
    includes: ['Measurement session', 'Lining & padding', 'Fall & pico', 'One free alteration'],
    duration: '5-7 days',
  },
  {
    slug: 'custom-maggam-work',
    name: 'Custom Maggam Work',
    tagline: 'Hand embroidery to your design',
    startingPrice: 1499,
    image: '/images/maggam-blouse.png',
    description: 'Bespoke maggam and aari embroidery on blouses, sarees and lehengas.',
    includes: ['Design consultation', 'Stones & beads', 'Zardozi options', 'Finishing'],
    duration: '10-14 days',
  },
  {
    slug: 'beauty-parlour',
    name: 'Beauty Parlour',
    tagline: 'Pamper yourself',
    startingPrice: 299,
    image: '/images/beauty-parlour.png',
    description: 'Facials, threading, hair care and party makeup in our hygienic studio.',
    includes: ['Facials', 'Hair styling', 'Threading & waxing', 'Party makeup'],
    duration: '30-120 min',
  },
  {
    slug: 'bridal-makeup',
    name: 'Bridal Makeup',
    tagline: 'Glow on your big day',
    startingPrice: 7999,
    image: '/images/bridal-makeup.png',
    description: 'HD and airbrush bridal makeup with saree draping and hairstyling.',
    includes: ['HD makeup', 'Hairstyling', 'Saree draping', 'Jewellery setting'],
    duration: '3-4 hours',
  },
  {
    slug: 'special-bridal-packages',
    name: 'Special Bridal Makeup Packages',
    tagline: 'Complete wedding look',
    startingPrice: 19999,
    image: '/images/hero-model.png',
    description: 'Pre-bridal care, engagement, wedding and reception looks in one package.',
    includes: ['Pre-bridal facials', 'Engagement look', 'Wedding look', 'Reception look'],
    duration: 'Multi-day',
  },
]

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug)
}

export function getService(slug: string) {
  return services.find((s) => s.slug === slug)
}

export function discountPercent(p: Pick<Product, 'price' | 'mrp'>) {
  return Math.round(((p.mrp - p.price) / p.mrp) * 100)
}

export function formatINR(amount: number) {
  return '₹' + amount.toLocaleString('en-IN')
}

export function categoryLabel(id: string) {
  return categories.find((c) => c.id === id)?.label ?? 'All Products'
}

/* ---------- Runtime catalog (owner edits) ---------- */
export type ProductOverride = Partial<
  Pick<Product, 'name' | 'subtitle' | 'description' | 'price' | 'mrp' | 'stock' | 'featured' | 'newArrival' | 'category' | 'images' | 'colors'>
> & { published?: boolean }
export type ServiceOverride = Partial<Pick<Service, 'name' | 'tagline' | 'description' | 'startingPrice' | 'image' | 'duration'>> & { enabled?: boolean }

const BASE_PRODUCTS = [...products]
const BASE_SERVICES = [...services]

export function mergedProducts(custom: Product[], ov: Record<string, ProductOverride>) {
  return [...BASE_PRODUCTS, ...custom].map((p) => ({ ...p, ...(ov[p.slug] ?? {}) }) as Product & { published?: boolean })
}
export function mergedServices(custom: Service[], ov: Record<string, ServiceOverride>) {
  return [...BASE_SERVICES, ...custom].map((s) => ({ ...s, ...(ov[s.slug] ?? {}) }) as Service & { enabled?: boolean })
}
/** Mutates the live arrays so every storefront component sees owner changes. */
export function applyCatalog(
  custom: Product[],
  ov: Record<string, ProductOverride>,
  customServices: Service[],
  svOv: Record<string, ServiceOverride>,
) {
  products.splice(0, products.length, ...mergedProducts(custom, ov).filter((p) => p.published !== false))
  services.splice(0, services.length, ...mergedServices(customServices, svOv).filter((s) => s.enabled !== false))
}
export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'item'
}
