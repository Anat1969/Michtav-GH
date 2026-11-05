import { motion, useReducedMotion } from 'framer-motion'
import type { Scored, Comparison } from '../logic/score'
import { COIN_BRIER, WORRY_BENCHMARK } from '../logic/score'

const clamp = (x: number, a = 0, b = 100) => Math.max(a, Math.min(b, x))

/** כיול: עיגול חלול הוא ההסתברות שנתת. ריבוע מלא הוא מה שקרה. הקו ביניהם הוא הטעות. */
export function Calibration({ rows }: { rows: Scored[] }) {
  const reduce = useReducedMotion()
  return (
    <div className="cal" role="img" aria-label="תרשים כיול: הערכה מול תוצאה לכל משפט">
      <div className="cal-axis" aria-hidden="true"><span>0%</span><span>50%</span><span>100%</span></div>
      {rows.map((r, i) => {
        const p = r.item.p
        const o = r.o * 100
        const lo = Math.min(p, o), hi = Math.max(p, o)
        const c = r.kind === 'vision' ? 'var(--sprout)' : 'var(--wax)'
        return (
          <div className="cal-row" key={r.item.id}>
            <span className="cal-label"><span className={`dot ${r.kind === 'vision' ? 'sprout' : 'wax'}`} /> {r.item.text}</span>
            <div className="cal-track">
              <span className="cal-mid" />
              <motion.span className="cal-err" style={{ left: `${lo}%`, width: `${hi - lo}%`, background: c }}
                initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.2 + i * 0.08, duration: 0.5 }} />
              <span className="cal-p" style={{ left: `${p}%`, borderColor: c }} title={`הערכת ${p}%`} />
              <span className="cal-o" style={{ left: `${o}%`, background: c }} title={`קרה: ${o}%`} />
            </div>
            <span className="cal-gap num">{p - o > 0 ? '+' : ''}{Math.round(p - o)}</span>
          </div>
        )
      })}
      <div className="legend">
        <span><span className="lg-p" /> מה שהערכת</span>
        <span><span className="lg-o" /> מה שקרה (חלקית = 50%)</span>
        <span><span className="dot sprout" /> חזון</span>
        <span><span className="dot wax" /> פחד</span>
        <span className="note">המספר: הפער בנקודות</span>
      </div>
    </div>
  )
}

/** שלושה פסים על סקאלה אחת: מה שנתת לפחד, מה שקרה, ומה שקרה במחקר. */
export function FearBench({ c }: { c: Comparison }) {
  const bars = [
    { k: 'נתת לפחדים', v: c.fearPredicted, color: 'var(--wax)', soft: true },
    { k: 'התממשו אצלך', v: c.fearRealized, color: 'var(--wax)', soft: false },
    { k: 'במחקר (2020)', v: WORRY_BENCHMARK, color: 'var(--lead)', soft: false },
  ]
  return (
    <div className="bench" role="img" aria-label="הפחד מול המציאות ומול המחקר">
      {bars.map((b) => (
        <div className="bench-row" key={b.k}>
          <span className="bench-k">{b.k}</span>
          <span className="bench-track"><span style={{ width: `${clamp(b.v)}%`, background: b.color, opacity: b.soft ? 0.35 : 1 }} /></span>
          <span className="num bench-v">{Math.round(b.v)}%</span>
        </div>
      ))}
    </div>
  )
}

/** ברייר על סקאלה: 0 מושלם, 0.25 הטלת מטבע. */
export function BrierScale({ b }: { b: number | null }) {
  const max = 0.5
  const x = b === null ? null : (clamp(b, 0, max) / max) * 100
  return (
    <div className="bscale" role="img" aria-label={`ציון ברייר ${b?.toFixed(2) ?? 'לא חושב'}`}>
      <div className="bscale-track">
        <span className="bscale-good" style={{ width: `${(COIN_BRIER / max) * 100}%` }} />
        <span className="bscale-coin" style={{ left: `${(COIN_BRIER / max) * 100}%` }}><i>מטבע 0.25</i></span>
        {x !== null && <span className="bscale-you" style={{ left: `${x}%` }}><i>{b!.toFixed(2)}</i></span>}
      </div>
      <div className="bscale-ends"><span>0 מושלם</span><span>0.5</span></div>
    </div>
  )
}

/** לפני ואחרי: סדרה קטנה לכל תחום, באותה סקאלה של 0 עד 10. */
export function Slopes({ c }: { c: Comparison }) {
  const items = [{ key: 'ladder', label: 'הסולם', before: c.ladderBefore, after: c.ladderAfter }, ...c.areaDeltas]
  const y = (v: number) => 54 - v * 5
  return (
    <div className="slopes">
      {items.map((it) => {
        const d = it.after - it.before
        const col = d > 0 ? 'var(--sprout)' : d < 0 ? 'var(--wax)' : 'var(--lead)'
        return (
          <figure className="slope" key={it.key}>
            <svg viewBox="0 0 80 60" style={{ direction: 'ltr' }} role="img" aria-label={`${it.label}: ${it.before} אז, ${it.after} היום`}>
              <line x1="10" x2="70" y1="54" y2="54" style={{ stroke: 'var(--rule)' }} />
              <line x1="10" x2="70" y1="29" y2="29" style={{ stroke: 'var(--rule-soft)' }} />
              <line x1="16" x2="64" y1={y(it.before)} y2={y(it.after)} style={{ stroke: col }} strokeWidth="2.5" />
              <circle cx="16" cy={y(it.before)} r="4" style={{ fill: '#fff', stroke: 'var(--lead)' }} strokeWidth="2" />
              <circle cx="64" cy={y(it.after)} r="4.5" style={{ fill: col }} />
            </svg>
            <figcaption><b>{it.label}</b> <span className="num">{it.before}→{it.after}</span></figcaption>
          </figure>
        )
      })}
    </div>
  )
}
