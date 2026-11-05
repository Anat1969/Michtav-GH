export type Outcome = 'yes' | 'partial' | 'no'
export interface Item { id: string; text: string; p: number } // p: הסתברות 0 עד 100
export const AREAS = [
  { key: 'work', label: 'עבודה ועשייה' },
  { key: 'relations', label: 'קשרים' },
  { key: 'health', label: 'גוף ואנרגיה' },
  { key: 'meaning', label: 'משמעות' },
] as const
export type AreaKey = (typeof AREAS)[number]['key']
export type Areas = Record<AreaKey, number>

export interface Answers {
  outcomes: Record<string, Outcome>
  ladder: number
  areas: Areas
  replies: string[]
  openedAt: string
}

export interface Distill { insight: string; detail: string; engine?: string }

export interface Letter {
  id: string
  createdAt: string
  openAt: string
  visions: Item[]
  fears: Item[]
  ladder: number
  areas: Areas
  note: string
  questions: string[]
  qSource: 'local' | 'ai'
  storage: 'local' | 'cloud'
  sample?: boolean
  answers?: Answers
  distill?: Distill
}

/** מכתב בשרת שעוד לא נפתח: רק מטא־נתונים, בלי התוכן. */
export interface SealedMeta {
  id: string
  createdAt: string
  openAt: string
  visions: number
  fears: number
  storage: 'cloud'
}
