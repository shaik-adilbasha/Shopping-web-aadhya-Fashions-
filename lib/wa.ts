/** Opens a WhatsApp prefilled chat via our redirect route. Number comes from owner Settings (never hard-coded). */
export function waHref(number: string, text: string) {
  return `/api/whatsapp?to=${encodeURIComponent((number ?? '').replace(/\D/g, ''))}&text=${encodeURIComponent(text)}`
}
export const inputCls =
  'h-10 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20'
export const btnPrimary = 'flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60'
export const btnOutline = 'flex h-11 items-center justify-center rounded-lg border border-primary px-5 text-sm text-primary hover:bg-blush'
