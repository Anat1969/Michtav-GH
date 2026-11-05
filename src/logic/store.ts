// מקור אחד לכל המכתבים: במכשיר (localStorage) ובשרת (Supabase, רק אחרי כניסה).
// בשרת: מדיניות RLS לא מחזירה את התוכן לפני יום הפתיחה, גם לא לבעלים. לפני כן מגיעים רק מטא־נתונים (michtav_sealed).
import { useEffect, useState } from 'react'
import type { Answers, Distill, Letter, SealedMeta } from './types'
import { supabase } from './supabase'
import { sampleLetter } from '../content/sample'

const KEY = 'michtav.letters.v1'

function readLocal(): Letter[] {
  try { const x = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(x) ? x : [] } catch { return [] }
}
function writeLocal(xs: Letter[]) {
  try { localStorage.setItem(KEY, JSON.stringify(xs)) } catch { /* מצב פרטי: נשאר בזיכרון */ }
}

interface State { local: Letter[]; cloud: Letter[]; sealed: SealedMeta[]; cloudError: string | null; loadingCloud: boolean }
let state: State = { local: readLocal(), cloud: [], sealed: [], cloudError: null, loadingCloud: false }
const subs = new Set<(s: State) => void>()
const emit = () => subs.forEach((f) => f(state))
const set = (p: Partial<State>) => { state = { ...state, ...p }; emit() }

export function useLetters() {
  const [s, setS] = useState(state)
  useEffect(() => { subs.add(setS); setS(state); return () => { subs.delete(setS) } }, [])
  return s
}

type Row = { id: string; created_at: string; open_at: string; letter: Omit<Letter, 'id' | 'createdAt' | 'openAt' | 'storage'>; answers: (Answers & { distill?: Distill }) | null }
const fromRow = (r: Row): Letter => {
  const { distill, ...answers } = r.answers ?? ({} as Answers & { distill?: Distill })
  return { ...r.letter, id: r.id, createdAt: r.created_at, openAt: r.open_at, storage: 'cloud', answers: r.answers ? (answers as Answers) : undefined, distill }
}

export async function loadCloud(signedIn: boolean) {
  if (!signedIn) { set({ cloud: [], sealed: [], cloudError: null }); return }
  set({ loadingCloud: true })
  try {
    const [open, sealed] = await Promise.all([
      supabase.from('michtav_letters').select('id,created_at,open_at,letter,answers').order('open_at'),
      supabase.rpc('michtav_sealed'),
    ])
    if (open.error) throw open.error
    if (sealed.error) throw sealed.error
    const meta = (sealed.data as { id: string; created_at: string; open_at: string; visions: number; fears: number }[] ?? [])
      .map((m) => ({ id: m.id, createdAt: m.created_at, openAt: m.open_at, visions: m.visions, fears: m.fears, storage: 'cloud' as const }))
    set({ cloud: (open.data as Row[]).map(fromRow), sealed: meta, cloudError: null, loadingCloud: false })
  } catch (e) {
    set({ cloudError: 'השרת לא זמין כרגע. המכתבים במכשיר זמינים כרגיל.', loadingCloud: false })
    console.warn(e)
  }
}

export async function saveLetter(l: Letter) {
  if (l.storage === 'cloud') {
    const { id, createdAt, openAt, storage: _s, answers: _a, distill: _d, ...letter } = l
    const { error } = await supabase.from('michtav_letters').insert({ id, created_at: createdAt, open_at: openAt, letter })
    if (error) throw error
    set({ sealed: [...state.sealed, { id, createdAt, openAt, visions: l.visions.length, fears: l.fears.length, storage: 'cloud' }] })
    return
  }
  const xs = [...state.local.filter((x) => x.id !== l.id), l]
  writeLocal(xs)
  set({ local: xs })
}

export async function saveAnswers(l: Letter, answers: Answers, distill?: Distill) {
  const next: Letter = { ...l, answers, distill: distill ?? l.distill }
  if (l.sample) { sampleState = next; emit(); return next }
  if (l.storage === 'cloud') {
    const { error } = await supabase.from('michtav_letters').update({ answers: { ...answers, distill: next.distill } }).eq('id', l.id)
    if (error) throw error
    set({ cloud: state.cloud.map((x) => (x.id === l.id ? next : x)) })
    return next
  }
  const xs = state.local.map((x) => (x.id === l.id ? next : x))
  writeLocal(xs)
  set({ local: xs })
  return next
}

export async function removeLetter(id: string, storage: 'local' | 'cloud') {
  if (storage === 'cloud') {
    const { error } = await supabase.from('michtav_letters').delete().eq('id', id)
    if (error) throw error
    set({ cloud: state.cloud.filter((x) => x.id !== id), sealed: state.sealed.filter((x) => x.id !== id) })
    return
  }
  const xs = state.local.filter((x) => x.id !== id)
  writeLocal(xs)
  set({ local: xs })
}

export function importLetters(json: string) {
  const parsed = JSON.parse(json)
  const xs: Letter[] = (Array.isArray(parsed) ? parsed : [parsed]).filter((x) => x && x.id && x.openAt && Array.isArray(x.visions))
  if (!xs.length) throw new Error('לא נמצא מכתב בקובץ')
  const merged = [...state.local.filter((a) => !xs.some((b) => b.id === a.id)), ...xs.map((x) => ({ ...x, storage: 'local' as const }))]
  writeLocal(merged)
  set({ local: merged })
  return xs.length
}

// מכתב לדוגמה: נחתם לפני שנה ונפתח היום. התשובות שלו נשמרות רק בזיכרון.
let sampleState: Letter = sampleLetter()
export const getSample = () => sampleState
export function resetSample() { sampleState = sampleLetter(); emit() }

export function findLetter(id: string): Letter | SealedMeta | null {
  if (id === 'sample') return sampleState
  return state.local.find((x) => x.id === id) ?? state.cloud.find((x) => x.id === id) ?? state.sealed.find((x) => x.id === id) ?? null
}

// שינוי בלשונית אחרת מתעדכן כאן.
if (typeof window !== 'undefined') window.addEventListener('storage', (e) => { if (e.key === KEY) set({ local: readLocal() }) })
