import { motion, useReducedMotion } from 'framer-motion'
import type { Areas, Item } from '../logic/types'
import { AREAS } from '../logic/types'
import { fmt } from '../logic/dates'

export interface Draft { createdAt: string; openAt: string; visions: Item[]; fears: Item[]; ladder: number; areas: Areas; note: string }

function Row({ item, kind }: { item: Item; kind: 'sprout' | 'wax' }) {
  return (
    <li className="lp-row">
      <span className="lp-text">{item.text}</span>
      <span className="lp-p" aria-label={`הסתברות ${item.p}%`}>
        <span className="lp-bar"><span style={{ width: `${item.p}%`, background: `var(--${kind})` }} /></span>
        <span className="num">{item.p}%</span>
      </span>
    </li>
  )
}

/** המכתב החי: נבנה שורה אחרי שורה בזמן הכתיבה, ונקפל אל המעטפה בחתימה. */
export function LetterPaper({ d, step, sealed = false }: { d: Draft; step: number; sealed?: boolean }) {
  const reduce = useReducedMotion()
  const v = d.visions.filter((x) => x.text.trim())
  const f = d.fears.filter((x) => x.text.trim())
  return (
    <div className="lp-stage">
      <motion.article className="lp cotton" aria-label="המכתב"
        animate={sealed && !reduce ? { scaleY: 0.05, scaleX: 0.3, y: -120, opacity: 0 } : { scaleY: 1, scaleX: 1, y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.6, 0, 0.3, 1] }} style={{ transformOrigin: 'top center' }}>
        <header className="lp-head">
          <span className="label">נכתב ב-{fmt(d.createdAt)}</span>
          <span className="label">נפתח ב-<b className="num">{fmt(d.openAt)}</b></span>
        </header>
        <p className="lp-salute">לעצמי, בראשון לחודש.</p>
        <section className={`lp-sec ${step === 0 ? 'on' : ''}`}>
          <h3 className="lp-h"><span className="dot sprout" /> מה יהיה נכון</h3>
          {v.length ? <ul>{v.map((x) => <Row key={x.id} item={x} kind="sprout" />)}</ul> : <p className="lp-empty">עוד לא נכתב.</p>}
        </section>
        <section className={`lp-sec ${step === 1 ? 'on' : ''}`}>
          <h3 className="lp-h"><span className="dot wax" /> ממה חששתי</h3>
          {f.length ? <ul>{f.map((x) => <Row key={x.id} item={x} kind="wax" />)}</ul> : <p className="lp-empty">עוד לא נכתב.</p>}
        </section>
        <section className={`lp-sec ${step === 2 ? 'on' : ''}`}>
          <h3 className="lp-h"><span className="dot ink" /> איפה עמדתי</h3>
          <div className="lp-ladder">
            <span className="num lp-ladder-n">{d.ladder}</span><span className="note">מתוך 10 בסולם</span>
            <span className="lp-areas">{AREAS.map((a) => <span key={a.key}>{a.label} <b className="num">{d.areas[a.key]}</b></span>)}</span>
          </div>
        </section>
        <section className={`lp-sec ${step === 3 ? 'on' : ''}`}>
          <h3 className="lp-h"><span className="dot lead" /> מילה לעצמי</h3>
          {d.note.trim() ? <p className="lp-note">{d.note}</p> : <p className="lp-empty">עוד לא נכתב.</p>}
        </section>
      </motion.article>
    </div>
  )
}
