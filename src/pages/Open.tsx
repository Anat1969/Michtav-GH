import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Rich } from '../components/Rich'
import { Calibration, FearBench, BrierScale, Slopes } from '../components/Charts'
import { findLetter, saveAnswers, resetSample, useLetters } from '../logic/store'
import { AREAS, type Answers, type Letter, type Outcome, type SealedMeta } from '../logic/types'
import { daysUntil, fmt, isDue } from '../logic/dates'
import { compare, scored, brierInsight, fearInsight, visionInsight, ladderInsight, OUTCOME_LABEL } from '../logic/score'
import { download, icsFor } from '../logic/ics'
import { aiDistill } from '../logic/ai'

const isLetter = (x: Letter | SealedMeta): x is Letter => 'visions' in x && Array.isArray((x as Letter).visions)

function Locked({ x }: { x: Letter | SealedMeta }) {
  const reduce = useReducedMotion()
  const days = daysUntil(x.openAt)
  return (
    <div className="locked">
      <motion.svg viewBox="0 0 320 200" className="locked-env" style={{ direction: 'ltr' }} aria-hidden="true" initial={reduce ? false : { y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <rect x="4" y="4" width="312" height="192" style={{ fill: 'var(--cotton)', stroke: 'var(--ink)' }} strokeWidth="2" />
        <path d="M4 4 L160 120 L316 4" style={{ fill: 'none', stroke: 'var(--ink)' }} strokeWidth="2" />
        <circle cx="160" cy="120" r="30" style={{ fill: 'var(--wax)' }} />
        <circle cx="160" cy="120" r="12" style={{ fill: 'none', stroke: 'var(--cotton)' }} strokeWidth="4" />
      </motion.svg>
      <div className="locked-text">
        <p className="eyebrow">המכתב חתום</p>
        <p><span className="big">{days}</span> <span className="lead">ימים עד שהחותם נשבר</span></p>
        <Rich insight={`נפתח ב-**${fmt(x.openAt)}**.`} detail={x.storage === 'cloud' ? 'השרת לא מחזיר את התוכן לפני יום הפתיחה, **גם לא לך**. זה החותם.' : 'החותם במכשיר הזה. התוכן מחכה, ו**השאלות** איתו.'} />
        <div className="row">
          <button className="btn primary" onClick={() => download(`michtav-${fmt(x.openAt)}.ics`, icsFor(x.id, x.openAt, location.href), 'text/calendar')}>תזכורת ליומן</button>
          <a className="btn" href="#/open/sample">לראות יום פתיחה לדוגמה</a>
        </div>
      </div>
    </div>
  )
}

function Read({ l }: { l: Letter }) {
  return (
    <article className="read lp cotton">
      <header className="lp-head"><span className="label">נכתב ב-{fmt(l.createdAt)}</span><span className="label">נפתח ב-{fmt(l.openAt)}</span></header>
      <p className="lp-salute">לעצמי, בעוד שנה.</p>
      <div className="read-cols">
        <section><h3 className="lp-h"><span className="dot sprout" /> מה יהיה נכון</h3><ul>{l.visions.map((v) => <li key={v.id} className="lp-row"><span className="lp-text">{v.text}</span><span className="num">{v.p}%</span></li>)}</ul></section>
        <section><h3 className="lp-h"><span className="dot wax" /> ממה חששתי</h3><ul>{l.fears.map((v) => <li key={v.id} className="lp-row"><span className="lp-text">{v.text}</span><span className="num">{v.p}%</span></li>)}</ul></section>
      </div>
      <section><h3 className="lp-h"><span className="dot ink" /> איפה עמדתי</h3><p><b className="num lp-ladder-n">{l.ladder}</b> <span className="note">מתוך 10.</span> {AREAS.map((a) => <span key={a.key} className="note"> {a.label} <b className="num">{l.areas[a.key]}</b> </span>)}</p></section>
      {l.note && <section><h3 className="lp-h"><span className="dot lead" /> מילה לעצמי</h3><p className="lp-note">{l.note}</p></section>}
    </article>
  )
}

function AnswerForm({ l, onDone }: { l: Letter; onDone: (a: Answers) => void }) {
  const [a, setA] = useState<Answers>(() => l.answers ?? { outcomes: {}, ladder: l.ladder, areas: { ...l.areas }, replies: l.questions.map(() => ''), openedAt: new Date().toISOString() })
  const items = [...l.visions.map((x) => ({ ...x, kind: 'sprout' as const })), ...l.fears.map((x) => ({ ...x, kind: 'wax' as const }))]
  const missing = items.filter((x) => !a.outcomes[x.id]).length
  const set = (id: string, o: Outcome) => setA({ ...a, outcomes: { ...a.outcomes, [id]: o } })
  return (
    <div className="answer">
      <section className="card">
        <h2 className="h3">מה התממש?</h2>
        <div className="ans-list">
          {items.map((x) => (
            <div className="ans" key={x.id}>
              <span className="ans-t"><span className={`dot ${x.kind}`} /> {x.text} <span className="note num">({x.p}%)</span></span>
              <span className="row" role="radiogroup" aria-label={x.text}>
                {(['yes', 'partial', 'no'] as Outcome[]).map((o) => <button key={o} role="radio" aria-checked={a.outcomes[x.id] === o} className={`chip ${x.kind}`} aria-pressed={a.outcomes[x.id] === o} onClick={() => set(x.id, o)}>{OUTCOME_LABEL[o]}</button>)}
              </span>
            </div>
          ))}
        </div>
      </section>
      <section className="card">
        <h2 className="h3">איפה הסולם היום? <span className="note">לפני שנה: {l.ladder}</span></h2>
        <div className="row ladder-row">{Array.from({ length: 11 }, (_, n) => <button key={n} className="chip" aria-pressed={a.ladder === n} onClick={() => setA({ ...a, ladder: n })}><span className="num">{n}</span></button>)}</div>
        <div className="areas">
          {AREAS.map((ar) => (
            <label key={ar.key} className="area">
              <span>{ar.label} <span className="note">({l.areas[ar.key]})</span></span>
              <input type="range" min={0} max={10} value={a.areas[ar.key]} className="range ink" onChange={(e) => setA({ ...a, areas: { ...a.areas, [ar.key]: Number(e.target.value) } })} />
              <span className="num">{a.areas[ar.key]}</span>
            </label>
          ))}
        </div>
      </section>
      <section className="card qs">
        <h2 className="h3">השאלות שחיכו לך {l.qSource === 'ai' && <span className="tag">נוסחו ב-AI</span>}</h2>
        {l.questions.map((q, i) => (
          <label key={i} className="qa"><span>{q}</span>
            <textarea className="field" rows={2} value={a.replies[i] ?? ''} onChange={(e) => { const r = [...a.replies]; r[i] = e.target.value; setA({ ...a, replies: r }) }} />
          </label>
        ))}
      </section>
      <div className="row"><button className="btn primary" disabled={missing > 0} onClick={() => onDone({ ...a, openedAt: new Date().toISOString() })}>{missing ? `נשארו ${missing} משפטים לסמן` : 'להשוואה'}</button></div>
    </div>
  )
}

function Compare({ l, onDistill, distilling }: { l: Letter; onDistill: () => void; distilling: boolean }) {
  const c = useMemo(() => compare(l), [l])
  const rows = useMemo(() => scored(l), [l])
  const bi = brierInsight(c.brier)
  const fi = fearInsight(c)
  const vi = visionInsight(c)
  const li = ladderInsight(c)
  const fearCount = l.fears.length
  const fearYes = l.fears.filter((f) => l.answers?.outcomes[f.id] === 'yes').length
  const kpis = [
    { n: c.brier === null ? '–' : c.brier.toFixed(2), k: 'ציון ברייר', s: 'כיול: 0 מושלם, 0.25 מטבע' },
    { n: `${fearYes}/${fearCount}`, k: 'פחדים שהתממשו במלואם', s: `ממוצע עם חלקיים: ${Math.round(c.fearRealized)}%` },
    { n: `${Math.round(c.visionRealized)}%`, k: 'מהחזון התממש', s: `הערכת ${Math.round(c.visionPredicted)}%` },
    { n: `${c.ladderAfter - c.ladderBefore >= 0 ? '+' : ''}${c.ladderAfter - c.ladderBefore}`, k: 'שינוי בסולם', s: `${c.ladderBefore} לפני שנה, ${c.ladderAfter} היום` },
  ]
  return (
    <div className="compare">
      <div className="kpis">
        {kpis.map((k) => <div className="kpi" key={k.k}><span className="big">{k.n}</span><span className="h3">{k.k}</span><span className="note">{k.s}</span></div>)}
      </div>
      <div className="cmp-grid">
        <section className="card cmp-main">
          <Rich insight={`**${rows.filter((r) => Math.abs(r.item.p - r.o * 100) <= 25).length} מתוך ${rows.length}** הערכות פגעו בטווח 25 נקודות.`} detail={`${vi.insight.replace(/\*\*/g, '')} ${vi.detail}`} />
          <Calibration rows={rows} />
        </section>
        <aside className="cmp-side">
          {fi && <section className="card"><FearBench c={c} /><Rich insight={fi.insight} detail={fi.detail} /></section>}
          <section className="card"><BrierScale b={c.brier} /><Rich insight={bi.insight} detail={bi.detail} /></section>
          <section className="card"><Slopes c={c} /><Rich insight={li.insight} detail={li.detail} /></section>
        </aside>
      </div>
      <section className="card replies">
        <div className="replies-head">
          <h2 className="h3">מה ענית לעצמך</h2>
          {l.distill ? null : <button className="btn small" disabled={distilling} onClick={onDistill}>{distilling ? 'מזקק...' : 'זיקוק ב-AI'}</button>}
        </div>
        {l.distill && <div className="callout insight-box"><Rich insight={l.distill.insight} detail={l.distill.detail} /><span className="note">זיקוק AI ({l.distill.engine ?? 'Gemini'}). כדאי לבדוק מול התשובות.</span></div>}
        <ol className="qa-list">{l.questions.map((q, i) => <li key={i}><span className="note">{q}</span><p>{l.answers?.replies[i] || <span className="note">לא נענה.</span>}</p></li>)}</ol>
      </section>
    </div>
  )
}

export function Open({ id }: { id: string }) {
  useLetters() // רענון כשהמאגר משתנה
  const found = findLetter(id)
  const [tab, setTab] = useState<'read' | 'answer' | 'compare'>('read')
  const [msg, setMsg] = useState<string | null>(null)
  const [distilling, setDistilling] = useState(false)
  useEffect(() => { if (found && isLetter(found)) setTab(found.answers ? 'compare' : 'read') }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!msg) return; const t = setTimeout(() => setMsg(null), 4500); return () => clearTimeout(t) }, [msg])

  if (!found) return <main className="page"><div className="wrap"><Rich insight="**המכתב לא נמצא** במכשיר הזה." detail="מכתב בשרת מופיע אחרי כניסה. מכתב ממכשיר אחר נטען מקובץ גיבוי." /><p><a className="btn" href="#/letters">למכתבים שלי</a></p></div></main>
  if (!isDue(found.openAt) || !isLetter(found)) return <main className="page"><div className="wrap"><Locked x={found} /></div></main>

  const l = found
  async function done(a: Answers) {
    try { await saveAnswers(l, a); setTab('compare') } catch { setMsg('השמירה נכשלה. נסו שוב.') }
  }
  async function distill() {
    if (!confirm('התשובות והציונים יישלחו ל-Gemini החינמי של Google, שרשאית להשתמש בתוכן. להמשיך?')) return
    setDistilling(true)
    try {
      const c = compare(l)
      const r = await aiDistill({ brier: c.brier, fearPredicted: c.fearPredicted, fearRealized: c.fearRealized, visionPredicted: c.visionPredicted, visionRealized: c.visionRealized, ladder: [c.ladderBefore, c.ladderAfter], areas: c.areaDeltas, items: scored(l).map((r) => ({ kind: r.kind, text: r.item.text, p: r.item.p, o: r.o })), qa: l.questions.map((q, i) => ({ q, a: l.answers?.replies[i] ?? '' })) })
      await saveAnswers(l, l.answers!, r)
    } catch (e) { setMsg(`הזיקוק לא זמין: ${(e as Error).message}`) }
    setDistilling(false)
  }

  const tabs = [
    { k: 'read' as const, label: 'קריאה', on: true },
    { k: 'answer' as const, label: 'תשובות', on: true },
    { k: 'compare' as const, label: 'השוואה', on: !!l.answers },
  ]
  return (
    <main className="page with-actions">
      <div className="wrap open">
        <header className="open-head">
          <p className="eyebrow">{l.sample ? 'מכתב לדוגמה' : 'יום הפתיחה'} · נכתב ב-{fmt(l.createdAt)}</p>
          <h1 className="h2">{tab === 'read' ? 'החותם נשבר. זה מה שכתבת לפני שנה.' : tab === 'answer' ? 'מה מזה קרה? סמנו כל משפט.' : 'כמה צדקת, ובמה הפחד הגזים.'}</h1>
          <div className="row" role="tablist">
            {tabs.map((t, i) => <button key={t.k} role="tab" aria-selected={tab === t.k} className="chip" aria-pressed={tab === t.k} disabled={!t.on} onClick={() => setTab(t.k)}><span className="num">{i + 1}</span> {t.label}</button>)}
          </div>
        </header>
        {tab === 'read' && <Read l={l} />}
        {tab === 'answer' && <AnswerForm l={l} onDone={done} />}
        {tab === 'compare' && l.answers && <Compare l={l} onDistill={distill} distilling={distilling} />}
      </div>
      {msg && <div className="toast" role="status" onClick={() => setMsg(null)}>{msg}</div>}
      <div className="actions" role="toolbar" aria-label="פעולות">
        <div className="actions-inner">
          {tab === 'read' && <button className="btn primary" onClick={() => setTab('answer')}>לענות על השאלות</button>}
          {tab === 'answer' && <button className="btn ghost" onClick={() => setTab('read')}>חזרה למכתב</button>}
          {tab === 'compare' && <a className="btn primary" href="#/write">לכתוב את המכתב הבא</a>}
          <span className="grow">{l.sample ? 'התשובות בדוגמה נשמרות רק עד רענון.' : 'התשובות נשמרות עם המכתב.'}</span>
          {tab === 'compare' && <button className="btn" onClick={() => setTab('answer')}>עריכת התשובות</button>}
          {l.sample && <button className="btn ghost opt" onClick={() => { resetSample(); setTab('compare') }}>איפוס הדוגמה</button>}
        </div>
      </div>
    </main>
  )
}
