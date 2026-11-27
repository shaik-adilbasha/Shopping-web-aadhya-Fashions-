import {
  CalendarDays,
  Heart,
  House,
  Package,
  Phone,
  Scissors,
  ShoppingCart,
  Star,
  Store,
  User,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { categories, services } from '@/lib/catalog'

export type NavChild = { label: string; href: string; category?: string }
export type NavItem = { label: string; href: string; icon: LucideIcon; children?: NavChild[] }

export const sidebarNav: NavItem[] = [
  { label: 'Home', href: '/', icon: House },
  {
    label: 'Shop',
    href: '/shop',
    icon: Store,
    children: categories.map((c) => ({ label: c.label, href: `/shop?category=${c.id}`, category: c.id })),
  },
  {
    label: 'Services',
    href: '/services',
    icon: Scissors,
    children: services.map((s) => ({ label: s.name, href: `/services/${s.slug}` })),
  },
  { label: 'Wishlist', href: '/wishlist', icon: Heart },
  { label: 'My Cart', href: '/cart', icon: ShoppingCart },
  { label: 'My Orders', href: '/orders', icon: Package },
  { label: 'My Bookings', href: '/bookings', icon: CalendarDays },
  { label: 'My Reviews', href: '/reviews', icon: Star },
  { label: 'Contact Us', href: '/contact', icon: Phone },
  { label: 'About Us', href: '/about', icon: UserRound },
  { label: 'My Account', href: '/account', icon: User },
]

export const headerNav = [
  { label: 'All', href: '/shop', category: null as string | null },
  { label: 'Sarees', href: '/shop?category=sarees', category: 'sarees' },
  { label: 'Jewellery', href: '/shop?category=jewellery', category: 'jewellery' },
  { label: 'Services', href: '/services', category: null },
  { label: 'Contact', href: '/contact', category: null },
]
