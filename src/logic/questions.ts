// שאלות ההשוואה נבנות מקומית מהמילים של הכותב/ת, בלי לשלוח את המכתב לשום מקום.
// הניסוח בעבר בגוף שני ("כתבת", "פחדת") זהה בכתיב בזכר ובנקבה.
import type { Item } from './types'

const clip = (s: string, n = 60) => (s.length > n ? s.slice(0, n - 1).trim() + '…' : s)

export function localQuestions(visions: Item[], fears: Item[], note: string): string[] {
  const q: string[] = []
  const v = visions.filter((x) => x.text.trim())
  const f = fears.filter((x) => x.text.trim())
  const topV = [...v].sort((a, b) => b.p - a.p)[0]
  const lowV = [...v].sort((a, b) => a.p - b.p)[0]
  const topF = [...f].sort((a, b) => b.p - a.p)[0]
  if (topV) q.push(`כתבת "${clip(topV.text)}" ונתת לזה ${topV.p}%. מה קידם את זה, ומה עצר?`)
  if (lowV && lowV !== topV) q.push(`ל"${clip(lowV.text)}" נתת רק ${lowV.p}%. האם הזהירות עזרה או הגבילה?`)
  if (topF) q.push(`פחדת ש"${clip(topF.text)}". מה הדאגה גבתה ממך החודש, גם אם זה לא קרה?`)
  if (f.length > 1) q.push('איזה פחד נעלם בלי שהרגשת, ואיזה פחד חדש תפס את מקומו?')
  if (note.trim()) q.push('קראת את המילה ששלחת לעצמך. מה היית מוסיף או מוחק בה היום?')
  q.push('מה היית רוצה להגיד לעצמך של לפני חודש, במשפט אחד?')
  return q.slice(0, 5)
}
