// צליל הים: רעש לבן מסונן שעולה ויורד כמו גלים, וצליל שפריץ כשהבקבוק נוחת. נוצר בדפדפן, בלי קבצים.
// כבוי כברירת מחדל. ההעדפה נשמרת במכשיר.
import { useEffect, useState } from 'react'

const KEY = 'michtav.sound'
let ctx: AudioContext | null = null
let master: GainNode | null = null
let on = false
const subs = new Set<(v: boolean) => void>()

function noiseBuffer(c: AudioContext, sec = 4) {
  const b = c.createBuffer(1, c.sampleRate * sec, c.sampleRate)
  const d = b.getChannelData(0)
  let last = 0
  for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5 }
  return b
}

function start() {
  if (ctx) { ctx.resume(); master!.gain.setTargetAtTime(0.5, ctx.currentTime, 0.6); return }
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  if (!AC) return
  ctx = new AC()
  master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination)
  const src = ctx.createBufferSource(); src.buffer = noiseBuffer(ctx); src.loop = true
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520
  const swell = ctx.createGain(); swell.gain.value = 0.35
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.11
  const depth = ctx.createGain(); depth.gain.value = 0.3
  lfo.connect(depth).connect(swell.gain)
  const lfo2 = ctx.createOscillator(); lfo2.frequency.value = 0.07
  const fdepth = ctx.createGain(); fdepth.gain.value = 260
  lfo2.connect(fdepth).connect(lp.frequency)
  src.connect(lp).connect(swell).connect(master)
  src.start(); lfo.start(); lfo2.start()
  master.gain.setTargetAtTime(0.5, ctx.currentTime, 0.8)
}

export function splash() {
  if (!on || !ctx || !master) return
  const t = ctx.currentTime
  const src = ctx.createBufferSource(); src.buffer = noiseBuffer(ctx, 1)
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(1800, t); bp.frequency.exponentialRampToValueAtTime(300, t + 0.6)
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(1.2, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8)
  src.connect(bp).connect(g).connect(master); src.start(t); src.stop(t + 0.9)
}

export function setSound(v: boolean) {
  on = v
  try { localStorage.setItem(KEY, v ? '1' : '0') } catch { /* */ }
  if (v) start()
  else if (ctx && master) master.gain.setTargetAtTime(0, ctx.currentTime, 0.3)
  subs.forEach((f) => f(v))
}

export function useSound() {
  const [v, set] = useState(on)
  useEffect(() => { subs.add(set); return () => { subs.delete(set) } }, [])
  return v
}

/** כפתור צליל מרובע. ההעדפה נשמרת, אבל הצליל מתחיל רק אחרי לחיצה ראשונה בדף (מדיניות הדפדפן). */
export function wantSound() { try { return localStorage.getItem(KEY) === '1' } catch { return false } }
