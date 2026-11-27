/** Shrinks a photo/screenshot so it fits in browser storage. */
export async function compressImage(file: File, max = 900, quality = 0.78): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new window.Image()
      i.onload = () => res(i)
      i.onerror = rej
      i.src = url
    })
    const r = Math.min(1, max / Math.max(img.width, img.height))
    const c = document.createElement('canvas')
    c.width = Math.round(img.width * r)
    c.height = Math.round(img.height * r)
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
    return c.toDataURL('image/jpeg', quality)
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Shrinks an image given as a data URL or URL (used for AI results and existing product photos). */
export async function compressDataUrl(src: string, max = 900, quality = 0.8): Promise<string> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new window.Image()
    i.onload = () => res(i)
    i.onerror = rej
    i.src = src
  })
  const r = Math.min(1, max / Math.max(img.width, img.height))
  const c = document.createElement('canvas')
  c.width = Math.round(img.width * r)
  c.height = Math.round(img.height * r)
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
  return c.toDataURL('image/jpeg', quality)
}
