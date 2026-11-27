// Keeps return-proof videos in the browser's IndexedDB (localStorage is far too small for video).
// TRIAL MODE: the video stays on the device that recorded it. For real use across devices,
// swap these two functions for uploads to hosted storage (e.g. Supabase Storage).
const DB = 'aadhya-media'
const STORE = 'videos'

function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1)
    r.onupgradeneeded = () => r.result.createObjectStore(STORE)
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  })
}

export async function saveVideo(key: string, blob: Blob): Promise<void> {
  const db = await open()
  await new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(blob, key)
    tx.oncomplete = () => res()
    tx.onerror = () => rej(tx.error)
  })
}

export async function getVideo(key: string): Promise<Blob | undefined> {
  const db = await open()
  return new Promise((res, rej) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key)
    req.onsuccess = () => res(req.result as Blob | undefined)
    req.onerror = () => rej(req.error)
  })
}
