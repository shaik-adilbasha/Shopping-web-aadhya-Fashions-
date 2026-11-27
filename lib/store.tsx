'use client'

/**
 * Aadhya store (TRIAL MODE).
 * All shop data is saved in this browser's localStorage so it survives refresh.
 * To go live across devices, replace the `usePersist` calls with a hosted database
 * (e.g. Supabase) — every screen reads data only through this file.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  applyCatalog,
  getProduct,
  type Product,
  type ProductOverride,
  type Service,
  type ServiceOverride,
} from './catalog'

export type CartItem = { slug: string; qty: number; color?: string }
export type Address = { id: string; fullName: string; phone: string; address: string; city: string; state: string; pincode: string }
export type User = { id: string; name: string; email: string; phone: string; passHash: string; addresses: Address[] }
export type OrderLine = { slug: string; name: string; price: number; qty: number; color?: string; image: string }
export type OrderStatus = 'Placed' | 'Confirmed' | 'Packed' | 'Shipped' | 'Delivered' | 'Cancelled'
export type PaymentStatus = 'Payment Pending' | 'Verification Pending' | 'Paid' | 'Failed' | 'Refunded'
export type Order = {
  id: string
  userId: string
  customer: { name: string; email: string; phone: string }
  address: Omit<Address, 'id'>
  items: OrderLine[]
  subtotal: number
  delivery: number
  total: number
  placedAt: string
  paymentMethod: 'phonepe' | 'razorpay' | 'upi' | 'cod'
  paymentStatus: PaymentStatus
  paymentRef?: string
  utr?: string // UPI reference number entered by the customer (never trusted until the owner verifies)
  paymentProof?: string // optional screenshot (compressed data URL)
  status: OrderStatus
  cancelRequested?: boolean
  tracking?: string
  deliveredAt?: string // set when the owner marks the order Delivered (starts the return window)
}
export type BookingStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Rescheduled' | 'Completed' | 'Cancelled'
export type Booking = {
  id: string
  userId: string
  serviceSlug: string
  service: string
  name: string
  phone: string
  email: string
  date: string
  time: string
  notes: string
  status: BookingStatus
  ownerNote?: string
  changeRequest?: string
  createdAt: string
}
export type Review = {
  id: string
  userId: string
  userName: string
  kind: 'product' | 'service'
  ref: string
  refName: string
  rating: number
  text: string
  date: string
  hidden?: boolean
  reply?: string
}
export type ReturnRequest = {
  id: string
  orderId: string
  userId: string
  customerName: string
  product: string
  reason: string
  description?: string // detailed explanation (required for new requests)
  photos?: string[]
  videoKey?: string // proof video id (see lib/video-store.ts)
  videoName?: string
  date: string
  status: 'Requested' | 'Approved' | 'Rejected'
  refundStatus: 'Not started' | 'Pending' | 'Completed'
  note?: string
}
export type Settings = {
  boutiqueName: string
  phone: string
  whatsapp: string
  email: string
  address: string
  hours: string
  instagram: string
  facebook: string
  deliveryCharge: number
  freeDeliveryAbove: number
  upiId: string
  upiQr: string
  appointmentSlots: string
  mapUrl: string
  returnDays: number // days after delivery in which a return can be requested
}

export const defaultSettings: Settings = {
  boutiqueName: 'Aadhya Fashions Studios',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  hours: 'Mon–Sat: 10:00 AM – 8:00 PM\nSunday: 11:00 AM – 6:00 PM',
  instagram: '',
  facebook: '',
  deliveryCharge: 0,
  freeDeliveryAbove: 0,
  upiId: '',
  upiQr: '',
  appointmentSlots: '10:00 AM,11:30 AM,1:00 PM,3:00 PM,4:30 PM,6:00 PM',
  mapUrl: '',
  returnDays: 7,
}

export const uid = (prefix: string) => prefix + Date.now().toString().slice(-6) + Math.floor(Math.random() * 90 + 10)

async function sha(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function usePersist<T>(key: string, init: T) {
  const [value, setValue] = useState<T>(init)
  const [loaded, setLoaded] = useState(false)
  const skip = useRef(false)
  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem(key)
        if (raw) {
          skip.current = true
          setValue(JSON.parse(raw) as T)
        }
      } catch {}
    }
    read()
    setLoaded(true)
    const onStorage = (e: StorageEvent) => e.key === key && read()
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key])
  useEffect(() => {
    if (!loaded) return
    if (skip.current) {
      skip.current = false
      return
    }
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      toast.error('Browser storage is full. Remove some images and try again.')
    }
  }, [key, value, loaded])
  return [value, setValue, loaded] as const
}

type StoreValue = {
  ready: boolean
  catalogVersion: number
  // auth
  user: User | null
  register: (d: { name: string; email: string; phone: string; password: string }) => Promise<string | null>
  login: (idf: string, password: string) => Promise<string | null>
  logout: () => void
  updateProfile: (d: { name: string; phone: string }) => void
  changePassword: (oldPw: string, newPw: string) => Promise<string | null>
  resetPassword: (idf: string, newPw: string) => Promise<string | null>
  saveAddress: (a: Omit<Address, 'id'> & { id?: string }) => void
  removeAddress: (id: string) => void
  // cart / wishlist
  cart: CartItem[]
  wishlist: string[]
  cartCount: number
  subtotal: number
  deliveryFor: (subtotal: number) => number
  addToCart: (slug: string, qty?: number, color?: string) => void
  setQty: (slug: string, qty: number) => void
  removeFromCart: (slug: string) => void
  clearCart: () => void
  toggleWishlist: (slug: string) => void
  isWishlisted: (slug: string) => boolean
  // orders
  allOrders: Order[]
  orders: Order[]
  addOrder: (o: Order) => void
  updateOrder: (id: string, patch: Partial<Order>) => void
  // bookings
  allBookings: Booking[]
  bookings: Booking[]
  addBooking: (b: Booking) => void
  updateBooking: (id: string, patch: Partial<Booking>) => void
  // reviews & returns
  allReviews: Review[]
  myReviews: Review[]
  addReview: (r: Omit<Review, 'id' | 'date' | 'userId' | 'userName'>) => void
  updateReview: (id: string, patch: Partial<Review>) => void
  returns: ReturnRequest[]
  addReturn: (r: Omit<ReturnRequest, 'id' | 'date' | 'status' | 'refundStatus'>) => void
  updateReturn: (id: string, patch: Partial<ReturnRequest>) => void
  // users (owner view)
  users: User[]
  // owner catalog
  customProducts: Product[]
  productOv: Record<string, ProductOverride>
  customServices: Service[]
  serviceOv: Record<string, ServiceOverride>
  saveProduct: (p: Product, isCustom: boolean) => void
  deleteCustomProduct: (slug: string) => void
  patchProduct: (slug: string, o: ProductOverride) => void
  saveService: (s: Service, isCustom: boolean) => void
  deleteCustomService: (slug: string) => void
  patchService: (slug: string, o: ServiceOverride) => void
  // settings
  settings: Settings
  saveSettings: (s: Settings) => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart, l1] = usePersist<CartItem[]>('aadhya.cart', [])
  const [wishlist, setWishlist] = usePersist<string[]>('aadhya.wishlist', [])
  const [users, setUsers] = usePersist<User[]>('aadhya.users', [])
  const [session, setSession] = usePersist<string | null>('aadhya.session', null)
  const [allOrders, setOrders] = usePersist<Order[]>('aadhya.orders', [])
  const [allBookings, setBookings] = usePersist<Booking[]>('aadhya.bookings', [])
  const [allReviews, setReviews] = usePersist<Review[]>('aadhya.reviews', [])
  const [returns, setReturns] = usePersist<ReturnRequest[]>('aadhya.returns', [])
  const [customProducts, setCustomProducts, l2] = usePersist<Product[]>('aadhya.customProducts', [])
  const [productOv, setProductOv, l3] = usePersist<Record<string, ProductOverride>>('aadhya.productOv', {})
  const [customServices, setCustomServices, l4] = usePersist<Service[]>('aadhya.customServices', [])
  const [serviceOv, setServiceOv, l5] = usePersist<Record<string, ServiceOverride>>('aadhya.serviceOv', {})
  const [settings, setSettings] = usePersist<Settings>('aadhya.settings', defaultSettings)
  const [catalogVersion, setCatalogVersion] = useState(0)
  const ready = l1 && l2 && l3 && l4 && l5

  useEffect(() => {
    if (!ready) return
    const changed =
      customProducts.length || customServices.length || Object.keys(productOv).length || Object.keys(serviceOv).length
    applyCatalog(customProducts, productOv, customServices, serviceOv)
    if (changed) setCatalogVersion((v) => v + 1)
  }, [ready, customProducts, productOv, customServices, serviceOv])

  const user = useMemo(() => users.find((u) => u.id === session) ?? null, [users, session])

  const register: StoreValue['register'] = useCallback(
    async ({ name, email, phone, password }) => {
      const mail = email.trim().toLowerCase()
      const ph = phone.replace(/\D/g, '')
      if (name.trim().length < 2) return 'Please enter your name.'
      if (!/^\S+@\S+\.\S+$/.test(mail)) return 'Please enter a valid email address.'
      if (ph.length !== 10) return 'Please enter a valid 10-digit phone number.'
      if (password.length < 6) return 'Password must be at least 6 characters.'
      if (users.some((u) => u.email === mail || u.phone === ph)) return 'An account with this email or phone already exists.'
      const u: User = { id: uid('U'), name: name.trim(), email: mail, phone: ph, passHash: await sha(password), addresses: [] }
      setUsers((p) => [...p, u])
      setSession(u.id)
      return null
    },
    [users, setUsers, setSession],
  )

  const login: StoreValue['login'] = useCallback(
    async (idf, password) => {
      const key = idf.trim().toLowerCase()
      const digits = key.replace(/\D/g, '')
      const u = users.find((x) => x.email === key || (digits.length === 10 && x.phone === digits))
      if (!u || u.passHash !== (await sha(password))) return 'Incorrect email/phone or password.'
      setSession(u.id)
      return null
    },
    [users, setSession],
  )

  const logout = useCallback(() => setSession(null), [setSession])
  const patchUser = useCallback((fn: (u: User) => User) => setUsers((p) => p.map((u) => (u.id === session ? fn(u) : u))), [session, setUsers])

  const updateProfile = useCallback(
    (d: { name: string; phone: string }) => patchUser((u) => ({ ...u, name: d.name.trim(), phone: d.phone.replace(/\D/g, '') })),
    [patchUser],
  )
  const changePassword: StoreValue['changePassword'] = useCallback(
    async (oldPw, newPw) => {
      if (!user) return 'Please log in first.'
      if (user.passHash !== (await sha(oldPw))) return 'Current password is incorrect.'
      if (newPw.length < 6) return 'New password must be at least 6 characters.'
      const h = await sha(newPw)
      patchUser((u) => ({ ...u, passHash: h }))
      return null
    },
    [user, patchUser],
  )
  const resetPassword: StoreValue['resetPassword'] = useCallback(
    async (idf, newPw) => {
      const key = idf.trim().toLowerCase()
      const digits = key.replace(/\D/g, '')
      const u = users.find((x) => x.email === key || (digits.length === 10 && x.phone === digits))
      if (!u) return 'No account found with that email or phone.'
      if (newPw.length < 6) return 'New password must be at least 6 characters.'
      const h = await sha(newPw)
      setUsers((p) => p.map((x) => (x.id === u.id ? { ...x, passHash: h } : x)))
      return null
    },
    [users, setUsers],
  )
  const saveAddress = useCallback(
    (a: Omit<Address, 'id'> & { id?: string }) =>
      patchUser((u) => {
        const addr: Address = { ...a, id: a.id ?? uid('A') }
        return { ...u, addresses: a.id ? u.addresses.map((x) => (x.id === a.id ? addr : x)) : [...u.addresses, addr] }
      }),
    [patchUser],
  )
  const removeAddress = useCallback((id: string) => patchUser((u) => ({ ...u, addresses: u.addresses.filter((a) => a.id !== id) })), [patchUser])

  const addToCart = useCallback(
    (slug: string, qty = 1, color?: string) => {
      const product = getProduct(slug)
      if (!product) return
      if (product.stock <= 0) {
        toast.error(`${product.name} is out of stock`)
        return
      }
      setCart((prev) => {
        const existing = prev.find((i) => i.slug === slug)
        if (existing) {
          const nextQty = Math.min(existing.qty + qty, product.stock)
          return prev.map((i) => (i.slug === slug ? { ...i, qty: nextQty, color: color ?? i.color } : i))
        }
        return [...prev, { slug, qty: Math.min(qty, product.stock), color }]
      })
      toast.success(`${product.name} added to cart`)
    },
    [setCart],
  )
  const setQty = useCallback(
    (slug: string, qty: number) => {
      const product = getProduct(slug)
      if (!product) return
      const clamped = Math.max(1, Math.min(qty, product.stock))
      if (qty > product.stock) toast.error(`Only ${product.stock} in stock`)
      setCart((prev) => prev.map((i) => (i.slug === slug ? { ...i, qty: clamped } : i)))
    },
    [setCart],
  )
  const removeFromCart = useCallback((slug: string) => setCart((p) => p.filter((i) => i.slug !== slug)), [setCart])
  const clearCart = useCallback(() => setCart([]), [setCart])
  const toggleWishlist = useCallback(
    (slug: string) => {
      const has = wishlist.includes(slug)
      toast(`${getProduct(slug)?.name ?? 'Item'} ${has ? 'removed from' : 'added to'} wishlist`)
      setWishlist(has ? wishlist.filter((s) => s !== slug) : [...wishlist, slug])
    },
    [wishlist, setWishlist],
  )

  const deliveryFor = useCallback(
    (sub: number) => (settings.freeDeliveryAbove > 0 && sub >= settings.freeDeliveryAbove ? 0 : settings.deliveryCharge),
    [settings.deliveryCharge, settings.freeDeliveryAbove],
  )

  const addOrder = useCallback(
    (o: Order) => {
      setOrders((p) => [o, ...p])
      // reduce stock for each purchased item
      setProductOv((ov) => {
        const next = { ...ov }
        for (const l of o.items) {
          const p = getProduct(l.slug)
          if (p) next[l.slug] = { ...next[l.slug], stock: Math.max(0, p.stock - l.qty) }
        }
        return next
      })
    },
    [setOrders, setProductOv],
  )
  const updateOrder = useCallback(
    (id: string, patch: Partial<Order>) => {
      const prev = allOrders.find((o) => o.id === id)
      if (prev && patch.status === 'Cancelled' && prev.status !== 'Cancelled') {
        // put the stock back when an order is cancelled
        setProductOv((ov) => {
          const next = { ...ov }
          for (const l of prev.items) {
            const p = getProduct(l.slug)
            if (p) next[l.slug] = { ...next[l.slug], stock: p.stock + l.qty }
          }
          return next
        })
      }
      const extra = prev && patch.status === 'Delivered' && !prev.deliveredAt ? { deliveredAt: new Date().toISOString() } : {}
      setOrders((p) => p.map((o) => (o.id === id ? { ...o, ...patch, ...extra } : o)))
    },
    [allOrders, setOrders, setProductOv],
  )
  const addBooking = useCallback((b: Booking) => setBookings((p) => [b, ...p]), [setBookings])
  const updateBooking = useCallback((id: string, patch: Partial<Booking>) => setBookings((p) => p.map((b) => (b.id === id ? { ...b, ...patch } : b))), [setBookings])

  const addReview = useCallback(
    (r: Omit<Review, 'id' | 'date' | 'userId' | 'userName'>) => {
      if (!user) return
      setReviews((p) => [{ ...r, id: uid('R'), date: new Date().toISOString(), userId: user.id, userName: user.name }, ...p])
    },
    [user, setReviews],
  )
  const updateReview = useCallback((id: string, patch: Partial<Review>) => setReviews((p) => p.map((r) => (r.id === id ? { ...r, ...patch } : r))), [setReviews])
  const addReturn = useCallback(
    (r: Omit<ReturnRequest, 'id' | 'date' | 'status' | 'refundStatus'>) =>
      setReturns((p) => [{ ...r, id: uid('RT'), date: new Date().toISOString(), status: 'Requested', refundStatus: 'Not started' }, ...p]),
    [setReturns],
  )
  const updateReturn = useCallback((id: string, patch: Partial<ReturnRequest>) => setReturns((p) => p.map((r) => (r.id === id ? { ...r, ...patch } : r))), [setReturns])

  const saveProduct = useCallback(
    (p: Product, isCustom: boolean) => {
      if (isCustom) setCustomProducts((prev) => (prev.some((x) => x.slug === p.slug) ? prev.map((x) => (x.slug === p.slug ? p : x)) : [...prev, p]))
      else setProductOv((o) => ({ ...o, [p.slug]: { ...o[p.slug], ...p } }))
    },
    [setCustomProducts, setProductOv],
  )
  const deleteCustomProduct = useCallback((slug: string) => setCustomProducts((p) => p.filter((x) => x.slug !== slug)), [setCustomProducts])
  const patchProduct = useCallback((slug: string, o: ProductOverride) => setProductOv((prev) => ({ ...prev, [slug]: { ...prev[slug], ...o } })), [setProductOv])
  const saveService = useCallback(
    (s: Service, isCustom: boolean) => {
      if (isCustom) setCustomServices((prev) => (prev.some((x) => x.slug === s.slug) ? prev.map((x) => (x.slug === s.slug ? s : x)) : [...prev, s]))
      else setServiceOv((o) => ({ ...o, [s.slug]: { ...o[s.slug], ...s } }))
    },
    [setCustomServices, setServiceOv],
  )
  const deleteCustomService = useCallback((slug: string) => setCustomServices((p) => p.filter((x) => x.slug !== slug)), [setCustomServices])
  const patchService = useCallback((slug: string, o: ServiceOverride) => setServiceOv((prev) => ({ ...prev, [slug]: { ...prev[slug], ...o } })), [setServiceOv])
  const saveSettings = useCallback((s: Settings) => setSettings(s), [setSettings])

  const value = useMemo<StoreValue>(() => {
    const cartCount = cart.reduce((n, i) => n + i.qty, 0)
    const subtotal = cart.reduce((sum, i) => sum + (getProduct(i.slug)?.price ?? 0) * i.qty, 0)
    const uid_ = user?.id
    return {
      ready,
      catalogVersion,
      user,
      register,
      login,
      logout,
      updateProfile,
      changePassword,
      resetPassword,
      saveAddress,
      removeAddress,
      cart,
      wishlist,
      cartCount,
      subtotal,
      deliveryFor,
      addToCart,
      setQty,
      removeFromCart,
      clearCart,
      toggleWishlist,
      isWishlisted: (slug) => wishlist.includes(slug),
      allOrders,
      orders: allOrders.filter((o) => o.userId === uid_),
      addOrder,
      updateOrder,
      allBookings,
      bookings: allBookings.filter((b) => b.userId === uid_),
      addBooking,
      updateBooking,
      allReviews,
      myReviews: allReviews.filter((r) => r.userId === uid_),
      addReview,
      updateReview,
      returns,
      addReturn,
      updateReturn,
      users,
      customProducts,
      productOv,
      customServices,
      serviceOv,
      saveProduct,
      deleteCustomProduct,
      patchProduct,
      saveService,
      deleteCustomService,
      patchService,
      settings,
      saveSettings,
    }
  }, [
    ready, catalogVersion, user, register, login, logout, updateProfile, changePassword, resetPassword, saveAddress, removeAddress,
    cart, wishlist, deliveryFor, addToCart, setQty, removeFromCart, clearCart, toggleWishlist, allOrders, addOrder, updateOrder,
    allBookings, addBooking, updateBooking, allReviews, addReview, updateReview, returns, addReturn, updateReturn, users,
    customProducts, productOv, customServices, serviceOv, saveProduct, deleteCustomProduct, patchProduct, saveService,
    deleteCustomService, patchService, settings, saveSettings,
  ])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
