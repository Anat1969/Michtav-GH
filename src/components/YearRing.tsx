import { motion, useReducedMotion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { DAY, MONTHS, fmt } from '../logic/dates'

export interface RingMark { id: string; at: string; label: string; kind: 'sealed' | 'due' | 'sample' }

const C = 200
const R = 150
const pt = (deg: number, r = R) => {
  const a = (deg * Math.PI) / 180
  return [C + r * Math.sin(a), C - r * Math.cos(a)] as const
}
function arc(a0: number, a1: number, r = R) {
  const [x0, y0] = pt(a0, r)
  const [x1, y1] = pt(Math.min(a1, a0 + 359.99), r)
  const large = a1 - a0 > 180 ? 1 : 0
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`
}

/** טבעת שנה: 365 ימים כמו טבעת בגזע עץ. החותם יושב בתאריך הפתיחה, והעופרת מראה כמה זמן כבר עבר. */
export function YearRing({ start, end, now = Date.now(), marks = [], big, caption }: { start: string; end: string; now?: number; marks?: RingMark[]; big: string; caption: string }) {
  const reduce = useReducedMotion()
  const t0 = new Date(start).getTime()
  const t1 = new Date(end).getTime()
  const span = t1 - t0
  const ang = (t: number) => Math.max(0, Math.min(360, ((t - t0) / span) * 360))
  const [hover, setHover] = useState<number | null>(null)

  const months = useMemo(() => {
    const out: { i: number; name: string; a0: number; a1: number; days: number }[] = []
    const d = new Date(t0)
    d.setDate(1); d.setHours(0, 0, 0, 0)
    for (let k = 0; k < 14; k++) {
      const s = Math.max(d.getTime(), t0)
      const nx = new Date(d); nx.setMonth(nx.getMonth() + 1)
      const e = Math.min(nx.getTime(), t1)
      if (e > s) out.push({ i: d.getMonth(), name: MONTHS[d.getMonth()], a0: ang(s), a1: ang(e), days: Math.round((s - now) / DAY) })
      if (nx.getTime() >= t1) break
      d.setMonth(d.getMonth() + 1)
    }
    return out
  }, [t0, t1, now])

  const elapsed = ang(now)
  const hm = hover !== null ? months[hover] : null

  return (
    <figure className="ring" aria-label={`טבעת שנה מ-${fmt(start)} עד ${fmt(end)}`}>
      <svg viewBox="0 0 400 400" style={{ direction: 'ltr' }} role="img">
        <title>{`טבעת השנה: ${caption}`}</title>
        {/* טבעות פנימיות כמו בגזע: שכבות של זמן */}
        {[0.42, 0.56, 0.7].map((k) => <circle key={k} cx={C} cy={C} r={R * k} style={{ fill: 'none', stroke: 'var(--rule-soft)' }} strokeWidth={1} />)}
        <circle cx={C} cy={C} r={R} style={{ fill: 'none', stroke: 'var(--rule-soft)' }} strokeWidth={22} />
        {months.map((m, i) => (
          <path key={i} d={arc(m.a0 + 0.6, m.a1 - 0.6)} strokeWidth={22}
            style={{ fill: 'none', stroke: hover === i ? 'var(--ink)' : 'var(--cotton)', cursor: 'pointer', transition: 'stroke .15s' }}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}
            tabIndex={0} aria-label={`${m.name}, ${m.days > 0 ? `בעוד ${m.days} ימים` : 'עבר'}`} />
        ))}
        {elapsed > 0.5 && (
          <motion.path d={arc(0, elapsed)} strokeWidth={6} style={{ fill: 'none', stroke: 'var(--lead)' }}
            initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: 'easeOut' }} />
        )}
        {months.map((m, i) => {
          if (m.a1 - m.a0 < 12) return null
          const [x, y] = pt((m.a0 + m.a1) / 2, R + 30)
          return <text key={`l${i}`} x={x} y={y + 4} textAnchor="middle" style={{ fill: hover === i ? 'var(--ink)' : 'var(--ink-3)', fontSize: 11.5, fontFamily: 'var(--sans)', direction: 'rtl' }}>{m.name}</text>
        })}
        {/* היום */}
        {(() => { const [x, y] = pt(elapsed, R - 20); const [x2, y2] = pt(elapsed, R + 14); return <line x1={x} y1={y} x2={x2} y2={y2} style={{ stroke: 'var(--ink)' }} strokeWidth={2} /> })()}
        {/* חותמות */}
        {marks.map((m, i) => {
          const [x, y] = pt(ang(new Date(m.at).getTime()) || 359.5)
          return (
            <motion.g key={m.id} initial={reduce ? false : { scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.9 + i * 0.12, type: 'spring', stiffness: 260, damping: 18 }} style={{ transformOrigin: `${x}px ${y}px` }}>
              <circle cx={x} cy={y} r={13} style={{ fill: m.kind === 'sealed' ? 'var(--wax)' : 'var(--sprout)' }} />
              <circle cx={x} cy={y} r={5} style={{ fill: 'none', stroke: '#fff' }} strokeWidth={2} />
              <title>{m.label}</title>
            </motion.g>
          )
        })}
      </svg>
      <div className="ring-center" aria-live="polite">
        {hm ? (
          <>
            <span className="big">{hm.days > 0 ? hm.days : 0}</span>
            <span className="ring-cap">ימים עד <b>{hm.name}</b></span>
          </>
        ) : (
          <>
            <span className="big">{big}</span>
            <span className="ring-cap">{caption}</span>
          </>
        )}
      </div>
    </figure>
  )
}
