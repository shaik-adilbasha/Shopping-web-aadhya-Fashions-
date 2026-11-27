// Outfit styles the owner can pick from when generating AI style ideas for a cloth.
export type StyleDef = { id: string; label: string; hint: string; desc: string; who?: 'girl'; framing?: 'waist-up' }

export const MAX_STYLES_PER_RUN = 6

export const STYLES: StyleDef[] = [
  { id: 'saree', label: 'Saree', hint: 'Nivi drape + blouse', desc: 'a traditional Indian saree draped in the Nivi style with neat pleats and the pallu over the left shoulder, with a matching blouse' },
  { id: 'lehenga', label: 'Lehenga', hint: 'Skirt, blouse, dupatta', desc: 'a lehenga choli set with a flared skirt, a fitted blouse and a dupatta' },
  { id: 'umbrella-cut', label: 'Umbrella cut', hint: 'Flared A-line dress', desc: 'an umbrella-cut dress with a fitted bodice and a full circular A-line skirt that spreads out like an umbrella' },
  { id: 'fish-cut', label: 'Fish cut', hint: 'Fitted, tail flare', desc: 'a fish-cut (mermaid-style) dress that is fitted closely from the waist to the knee and then flares out like a fish tail at the hem' },
  { id: 'anarkali', label: 'Anarkali', hint: 'Long flared suit', desc: 'a long Anarkali suit with a fitted bodice and a very flared floor-length skirt, with a dupatta' },
  { id: 'half-saree', label: 'Half saree', hint: 'Langa voni', desc: 'a South Indian half saree (langa voni): a long flared skirt, a blouse and a half-saree draped over the shoulder' },
  { id: 'salwar', label: 'Punjabi / salwar suit', hint: 'Kurta, salwar, dupatta', desc: 'a Punjabi salwar suit: a knee-length kurta with a salwar or palazzo pants and a dupatta' },
  { id: 'gown', label: 'Gown', hint: 'Party / reception', desc: 'an elegant floor-length party gown' },
  { id: 'crop-top', label: 'Skirt + crop top', hint: 'Fusion', desc: 'a fusion outfit: a long flared skirt with a matching crop top' },
  { id: 'kurti-pants', label: 'Kurti with pants', hint: 'Everyday', desc: 'a straight-cut kurti worn with pants' },
  { id: 'co-ord', label: 'Co-ord set', hint: 'Top + trousers', desc: 'a stylish co-ord set with a matching top and trousers' },
  { id: 'indo-western', label: 'Indo-western jacket set', hint: 'Jacket style', desc: 'an indo-western outfit with a long jacket-style top over a skirt or pants' },
  { id: 'pattu-pavada', label: 'Pattu pavada', hint: 'For girls', desc: 'a traditional pattu pavada (langa) set with a blouse and dupatta', who: 'girl' },
  { id: 'bridal-lehenga', label: 'Bridal lehenga', hint: 'Heavy bridal look', desc: 'a rich bridal lehenga with a heavily styled blouse and a net dupatta' },
  { id: 'bridal-saree', label: 'Bridal saree', hint: 'Rich pallu', desc: 'a bridal saree draped elegantly with a rich pallu and matching blouse' },
  { id: 'blouse', label: 'Blouse design', hint: 'Boat neck, maggam', desc: 'a blouse made from this fabric with a boat neck and fine maggam-style embroidery detailing', framing: 'waist-up' },
]

export const FABRICS = ['Silk', 'Cotton', 'Georgette', 'Net', 'Velvet', 'Chiffon']

export function buildStylePrompt(id: string, fabric?: string): string | null {
  const s = STYLES.find((x) => x.id === id)
  if (!s) return null
  const model = s.who === 'girl' ? 'an AI-generated young Indian girl model' : 'an AI-generated Indian woman model'
  const shot = s.framing === 'waist-up' ? 'waist-up' : 'full-length'
  const f = FABRICS.includes(fabric ?? '') ? ` The fabric is ${fabric!.toLowerCase()}, so the drape and fall should suit ${fabric!.toLowerCase()}.` : ''
  return (
    `Using the fabric shown in the reference image as the exact material, create a photorealistic ${shot} fashion photograph of ${model} wearing ${s.desc}, stitched entirely from this fabric. ` +
    `Match the fabric's colour, print, weave, texture and any border or zari pattern as closely as possible.${f} ` +
    `Standing pose, plain soft studio background, natural lighting. Do not show any text, logos or watermarks. The model must be a fictional person, not a real or famous person.`
  )
}
