// AI באפליקציה: פונקציית Edge אחת (michtav-ai). Gemini החינמי קודם, Claude רק כגיבוי.
// מופעל רק בהסכמה מפורשת, כי המכתב הוא מידע אישי ובמסלול החינמי Google רשאית להשתמש בתוכן.
import { SUPABASE_KEY, SUPABASE_URL } from './supabase'
import type { Distill, Item } from './types'

async function call<T>(body: unknown): Promise<T> {
  const r = await fetch(`${SUPABASE_URL}/functions/v1/michtav-ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    body: JSON.stringify(body),
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j.error || `שגיאה ${r.status}`)
  return j as T
}

export function aiQuestions(visions: Item[], fears: Item[], note: string) {
  return call<{ questions: string[]; engine: string }>({ mode: 'questions', visions, fears, note })
}

export function aiDistill(payload: unknown) {
  return call<Distill>({ mode: 'distill', payload })
}
