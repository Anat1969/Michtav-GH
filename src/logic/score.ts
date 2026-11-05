// חישובי ההשוואה ביום הפתיחה.
// ציון ברייר (Glenn W. Brier, 1950): ממוצע ריבוע ההפרש בין ההסתברות שנתת לתוצאה בפועל.
// 0 הוא כיול מושלם. 0.25 הוא מה שמקבל מי שעונה 50% על הכול. תוצאה "חלקית" נספרת כ-0.5.
import type { Item, Letter, Outcome } from './types'
import { AREAS } from './types'

export const OUTCOME_VALUE: Record<Outcome, number> = { yes: 1, partial: 0.5, no: 0 }
export const OUTCOME_LABEL: Record<Outcome, string> = { yes: 'התממש', partial: 'חלקית', no: 'לא התממש' }
/** LaFreniere & Newman, Behavior Therapy 51(3), 2020: 91.4% מהדאגות לא התממשו. */
export const WORRY_BENCHMARK = 8.6
export const COIN_BRIER = 0.25

export interface Scored { item: Item; kind: 'vision' | 'fear'; o: number }

export function scored(l: Letter): Scored[] {
  const out = l.answers?.outcomes ?? {}
  const rows: Scored[] = []
  for (const item of l.visions) if (out[item.id]) rows.push({ item, kind: 'vision', o: OUTCOME_VALUE[out[item.id]] })
  for (const item of l.fears) if (out[item.id]) rows.push({ item, kind: 'fear', o: OUTCOME_VALUE[out[item.id]] })
  return rows
}

export function brier(rows: Scored[]) {
  if (!rows.length) return null
  return rows.reduce((s, r) => s + (r.item.p / 100 - r.o) ** 2, 0) / rows.length
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)

export interface Comparison {
  brier: number | null
  brierVision: number | null
  brierFear: number | null
  fearPredicted: number // ממוצע ההסתברות שניתנה לפחדים
  fearRealized: number // אחוז הפחדים שהתממשו (חלקית = חצי)
  visionPredicted: number
  visionRealized: number
  fearBias: number // נקודות אחוז: חיובי = הפחד הגזים
  visionBias: number // חיובי = אופטימיות יתר
  ladderBefore: number
  ladderAfter: number
  areaDeltas: { key: string; label: string; before: number; after: number }[]
  n: number
}

export function compare(l: Letter): Comparison {
  const rows = scored(l)
  const v = rows.filter((r) => r.kind === 'vision')
  const f = rows.filter((r) => r.kind === 'fear')
  const fearPredicted = mean(f.map((r) => r.item.p))
  const fearRealized = mean(f.map((r) => r.o * 100))
  const visionPredicted = mean(v.map((r) => r.item.p))
  const visionRealized = mean(v.map((r) => r.o * 100))
  return {
    brier: brier(rows),
    brierVision: brier(v),
    brierFear: brier(f),
    fearPredicted, fearRealized, visionPredicted, visionRealized,
    fearBias: f.length ? fearPredicted - fearRealized : 0,
    visionBias: v.length ? visionPredicted - visionRealized : 0,
    ladderBefore: l.ladder,
    ladderAfter: l.answers?.ladder ?? l.ladder,
    areaDeltas: AREAS.map((a) => ({ key: a.key, label: a.label, before: l.areas[a.key], after: l.answers?.areas[a.key] ?? l.areas[a.key] })),
    n: rows.length,
  }
}

const r0 = (x: number) => Math.round(x)
const r2 = (x: number) => x.toFixed(2)

/** שורת תובנה מחושבת, לפי תקן הזיקוק: עד 8 מילים, והסבר עד 20. */
export function brierInsight(b: number | null) {
  if (b === null) return { insight: 'אין עדיין **תוצאות** לחישוב.', detail: 'מסמנים לכל משפט אם **התממש**, ואז מופיע הציון.' }
  if (b <= 0.1) return { insight: `**כיול חד**: ${r2(b)}.`, detail: `ההסתברויות שנתת קרובות למציאות. ניחוש של **50%** על הכול היה מקבל **0.25**.` }
  if (b < COIN_BRIER) return { insight: `**טוב מהטלת מטבע**: ${r2(b)}.`, detail: `הכיוון נכון, אבל יש **פער**. ניחוש של **50%** על הכול היה מקבל **0.25**.` }
  return { insight: `**פחות מהטלת מטבע**: ${r2(b)}.`, detail: `ההסתברויות שנתת רחוקות מהתוצאה. **50%** על הכול היה מקבל **0.25**, ציון טוב יותר.` }
}

export function fearInsight(c: Comparison) {
  if (!c.n) return null
  const gap = r0(c.fearBias)
  if (gap > 10) return { insight: `**הפחד הגזים** ב-${gap} נקודות.`, detail: `נתת לפחדים **${r0(c.fearPredicted)}%** בממוצע. בפועל התממשו **${r0(c.fearRealized)}%**. במחקר: **${WORRY_BENCHMARK}%**.` }
  if (gap < -10) return { insight: `**הפחד הקל ראש** ב-${-gap} נקודות.`, detail: `נתת לפחדים **${r0(c.fearPredicted)}%**, והתממשו **${r0(c.fearRealized)}%**. כאן החשש היה מוצדק.` }
  return { insight: `**הפחד היה מדויק**.`, detail: `נתת **${r0(c.fearPredicted)}%**, והתממשו **${r0(c.fearRealized)}%**. הפער קטן מ-**10** נקודות.` }
}

export function visionInsight(c: Comparison) {
  const gap = r0(c.visionBias)
  if (gap > 10) return { insight: `**החזון רץ מהר** מהשנה.`, detail: `קיווית ל-**${r0(c.visionPredicted)}%**, והתממשו **${r0(c.visionRealized)}%**. פער של **${gap}** נקודות.` }
  if (gap < -10) return { insight: `**הגשמת יותר** ממה שהערכת.`, detail: `נתת לחזון **${r0(c.visionPredicted)}%**, והתממשו **${r0(c.visionRealized)}%**. הצניעות עלתה **${-gap}** נקודות.` }
  return { insight: `**החזון כויל היטב**.`, detail: `הערכת **${r0(c.visionPredicted)}%**, והתממשו **${r0(c.visionRealized)}%**.` }
}

export function ladderInsight(c: Comparison) {
  const d = c.ladderAfter - c.ladderBefore
  const best = [...c.areaDeltas].sort((a, b) => (b.after - b.before) - (a.after - a.before))[0]
  const worst = [...c.areaDeltas].sort((a, b) => (a.after - a.before) - (b.after - b.before))[0]
  const head = d > 0 ? `**הסולם עלה** ${d} שלבים.` : d < 0 ? `**הסולם ירד** ${-d} שלבים.` : '**הסולם נשאר** במקום.'
  return { insight: head, detail: `הצמיחה הגדולה: **${best.label}** (${best.after - best.before >= 0 ? '+' : ''}${best.after - best.before}). הירידה הגדולה: **${worst.label}** (${worst.after - worst.before}).` }
}

/** בזמן הכתיבה: שורה אחת מול המחקר. */
export function liveFearLine(fears: Item[]) {
  const xs = fears.filter((f) => f.text.trim())
  if (!xs.length) return null
  const m = r0(mean(xs.map((f) => f.p)))
  return { insight: `**הפחד שלך: ${m}%**.`, detail: `במחקר של לה־פרנייר וניומן (2020) התממשו רק **${WORRY_BENCHMARK}%** מהדאגות. בעוד שנה נבדוק את שלך.` }
}
