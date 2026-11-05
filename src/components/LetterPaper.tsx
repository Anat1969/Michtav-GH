import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
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
        animate={sealed && !reduce ? { scaleY: 0.32, y: 40, opacity: 0.0 } : { scaleY: 1, y: 0, opacity: 1 }}
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
      <AnimatePresence>
        {sealed && (
          <motion.div className="envelope" initial={reduce ? false : { y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: reduce ? 0 : 0.6, duration: 0.5 }}>
            <svg viewBox="0 0 320 200" style={{ direction: 'ltr' }} aria-hidden="true">
              <rect x="4" y="4" width="312" height="192" style={{ fill: 'var(--cotton)', stroke: 'var(--ink)' }} strokeWidth="2" />
              <path d="M4 4 L160 120 L316 4" style={{ fill: 'none', stroke: 'var(--ink)' }} strokeWidth="2" />
              <motion.g initial={reduce ? false : { scale: 2.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: reduce ? 0 : 1.1, type: 'spring', stiffness: 320, damping: 16 }} style={{ transformOrigin: '160px 120px' }}>
                <circle cx="160" cy="120" r="30" style={{ fill: 'var(--wax)' }} />
                <circle cx="160" cy="120" r="12" style={{ fill: 'none', stroke: 'var(--cotton)' }} strokeWidth="4" />
              </motion.g>
            </svg>
            <p className="envelope-cap">חתום עד <b className="num">{fmt(d.openAt)}</b></p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
