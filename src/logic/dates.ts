export const DAY = 86_400_000
export function addYear(d: Date) { const x = new Date(d); x.setFullYear(x.getFullYear() + 1); return x }
export function daysUntil(iso: string, now = Date.now()) { return Math.max(0, Math.ceil((new Date(iso).getTime() - now) / DAY)) }
export function isDue(iso: string, now = Date.now()) { return new Date(iso).getTime() <= now }
export function fmt(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`
}
export const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']
export function uid() { return (crypto as Crypto & { randomUUID?: () => string }).randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}` }
