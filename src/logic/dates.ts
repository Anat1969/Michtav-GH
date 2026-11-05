export const DAY = 86_400_000
/** יום הפתיחה: הראשון לחודש הבא, בחצות. מכתב שנכתב פחות מ-7 ימים לפני כן נפתח בראשון שאחריו. */
export const MIN_DAYS = 7
export function nextFirst(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth() + 1, 1)
  if (x.getTime() - d.getTime() < MIN_DAYS * 86_400_000) x.setMonth(x.getMonth() + 1)
  return x
}
export function daysUntil(iso: string, now = Date.now()) { return Math.max(0, Math.ceil((new Date(iso).getTime() - now) / DAY)) }
export function isDue(iso: string, now = Date.now()) { return new Date(iso).getTime() <= now }
export function fmt(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`
}
export const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']
export function uid() { return (crypto as Crypto & { randomUUID?: () => string }).randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}` }
