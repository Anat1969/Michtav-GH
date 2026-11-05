import { useEffect, useRef, useState } from 'react'
import { Rich } from '../components/Rich'
import { useLetters, removeLetter, importLetters, getSample } from '../logic/store'
import { daysUntil, fmt, isDue } from '../logic/dates'
import { download, icsFor } from '../logic/ics'
import { signInGoogle, useSession } from '../logic/auth'
import type { Letter, SealedMeta } from '../logic/types'
import { compare } from '../logic/score'

type Card = { id: string; createdAt: string; openAt: string; storage: 'local' | 'cloud'; visions: number; fears: number; opened: boolean; letter?: Letter; sample?: boolean }

const urlFor = (id: string) => `${location.origin}${location.pathname}#/open/${id}`

export function Letters() {
  const session = useSession()
  const { local, cloud, sealed, cloudError, loadingCloud } = useLetters()
  const [msg, setMsg] = useState<string | null>(null)
  const file = useRef<HTMLInputElement>(null)
  useEffect(() => { if (!msg) return; const t = setTimeout(() => setMsg(null), 4500); return () => clearTimeout(t) }, [msg])

  const toCard = (l: Letter): Card => ({ id: l.id, createdAt: l.createdAt, openAt: l.openAt, storage: l.storage, visions: l.visions.length, fears: l.fears.length, opened: !!l.answers, letter: l, sample: l.sample })
  const meta = (m: SealedMeta): Card => ({ id: m.id, createdAt: m.createdAt, openAt: m.openAt, storage: 'cloud', visions: m.visions, fears: m.fears, opened: false })
  const cards = [...local.map(toCard), ...cloud.map(toCard), ...sealed.map(meta)].sort((a, b) => a.openAt.localeCompare(b.openAt))
  const waiting = cards.filter((c) => !isDue(c.openAt))
  const ready = cards.filter((c) => isDue(c.openAt) && !c.opened)
  const sample = toCard(getSample())
  // מגמת הכיול מחודש לחודש: ציון ברייר לכל מכתב שנפתח ונענה.
  const trend = [...local, ...cloud].filter((l) => l.answers).sort((a, b) => a.openAt.localeCompare(b.openAt))
    .map((l) => ({ at: l.openAt, b: compare(l).brier })).filter((x): x is { at: string; b: number } => x.b !== null)

  const head = ready.length
    ? { insight: `**${ready.length} מכתבים** מחכים לפתיחה.`, detail: 'הראשון לחודש הגיע. החותם נשבר, ו**שאלות ההשוואה** מחכות.' }
    : waiting.length
      ? { insight: `**${waiting.length} חתומים**. הבא בעוד ${daysUntil(waiting[0].openAt)} ימים.`, detail: `נפתח ב-**${fmt(waiting[0].openAt)}**. תזכורת ליומן שומרת שלא יישכח.` }
      : cards.some((c) => c.opened)
        ? { insight: `**${cards.filter((c) => c.opened).length} מכתבים** נפתחו. אין מכתב חתום.`, detail: 'הראשון לחודש הבא מחכה ל**מכתב חדש**.' }
        : { insight: 'עוד אין **מכתב חתום**.', detail: 'ארבע שאלות, ושתיקה עד **הראשון לחודש**. אפשר להתחיל במכתב לדוגמה.' }

  async function del(c: Card) {
    if (!confirm(c.opened || isDue(c.openAt) ? 'למחוק את המכתב?' : 'המכתב עוד חתום. למחוק אותו בלי לקרוא?')) return
    try { await removeLetter(c.id, c.storage); setMsg('המכתב נמחק.') } catch { setMsg('המחיקה נכשלה.') }
  }
  function backup() {
    download(`michtav-backup-${fmt(new Date().toISOString())}.json`, JSON.stringify(local, null, 2), 'application/json')
    setMsg('הגיבוי ירד. הוא כולל את תוכן המכתבים, ושווה לשמור אותו במקום פרטי.')
  }
  async function onImport(f: File | undefined) {
    if (!f) return
    try { const n = importLetters(await f.text()); setMsg(`נטענו ${n} מכתבים מהגיבוי.`) } catch (e) { setMsg((e as Error).message || 'הקובץ לא נקרא.') }
  }

  const render = (c: Card) => {
    const due = isDue(c.openAt)
    const days = daysUntil(c.openAt)
    const total = Math.max(1, (new Date(c.openAt).getTime() - new Date(c.createdAt).getTime()) / 86_400_000)
    const pct = Math.min(100, Math.round(((total - days) / total) * 100))
    return (
      <article key={c.id} className={`lcard ${due ? 'due' : ''}`} data-testid="letter-card">
        <div className="lcard-top">
          <span className={`tag ${c.sample ? '' : c.storage === 'cloud' ? 'sprout' : ''}`}>{c.sample ? 'דוגמה' : c.storage === 'cloud' ? 'חותם בשרת' : 'חותם במכשיר'}</span>
          <span className="label">נכתב {fmt(c.createdAt)}</span>
        </div>
        <div className="lcard-n">
          {due ? <span className="big" style={{ color: 'var(--sprout)' }}>{c.opened ? 'נפתח' : 'היום'}</span> : <><span className="big">{days}</span><span className="note">ימים עד {fmt(c.openAt)}</span></>}
        </div>
        <span className="lbar" aria-label={`עברו ${pct}% מהזמן עד הפתיחה`}><span style={{ width: `${pct}%` }} /></span>
        <p className="note"><span className="dot sprout" /> {c.visions} חזון · <span className="dot wax" /> {c.fears} פחד</p>
        <div className="row">
          <a className={`btn small ${due ? 'primary' : ''}`} href={`#/open/${c.id}`}>{due ? (c.opened ? 'להשוואה' : 'לשבור את החותם') : 'לראות את המעטפה'}</a>
          {!due && <button className="btn small" onClick={() => download(`michtav-${fmt(c.openAt)}.ics`, icsFor(c.id, c.openAt, urlFor(c.id)), 'text/calendar')}>תזכורת ליומן</button>}
          {!c.sample && <button className="btn small ghost" onClick={() => del(c)}>מחיקה</button>}
        </div>
      </article>
    )
  }

  return (
    <main className="page with-actions">
      <div className="wrap letters">
        <header className="letters-head">
          <p className="eyebrow">המכתבים שלי</p>
          <Rich insight={head.insight} detail={head.detail} className="big-rich" />
          {trend.length >= 2 && <Trend pts={trend} />}
          {cloudError && <p className="note" style={{ color: 'var(--wax)' }}>{cloudError}</p>}
          {loadingCloud && <p className="note">טוען מהשרת...</p>}
          {!session && <p className="note">מכתבים בשרת מופיעים אחרי כניסה עם Google, מכפתור הלוגו.</p>}
        </header>
        <div className="lgrid">
          {cards.map(render)}
          {render(sample)}
          <a className="lcard lnew press" href="#/write"><span className="big">+</span><span className="h3">מכתב חדש</span><span className="note">ארבע שאלות, כעשר דקות.</span></a>
        </div>
      </div>
      {msg && <div className="toast" role="status" onClick={() => setMsg(null)}>{msg}</div>}
      <div className="actions" role="toolbar" aria-label="פעולות">
        <div className="actions-inner">
          <a className="btn primary" href="#/write">מכתב חדש</a>
          <span className="grow">גיבוי שומר את המכתבים שבמכשיר מפני ניקוי הדפדפן.</span>
          <button className="btn" disabled={!local.length} onClick={backup}>גיבוי לקובץ</button>
          <button className="btn" onClick={() => file.current?.click()}>טעינת גיבוי</button>
          {!session && <button className="btn ghost opt" onClick={() => signInGoogle()}>כניסה</button>}
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => onImport(e.target.files?.[0])} />
        </div>
      </div>
    </main>
  )
}

function Trend({ pts }: { pts: { at: string; b: number }[] }) {
  const w = 260, h = 64, max = 0.5
  const x = (i: number) => w - 8 - (i * (w - 16)) / Math.max(1, pts.length - 1) // הזמן זורם מימין לשמאל
  const y = (b: number) => 8 + (Math.min(b, max) / max) * (h - 16)
  const first = pts[0].b, last = pts[pts.length - 1].b
  const d = last - first
  const insight = d < -0.02 ? `**הכיול השתפר** ב-${Math.abs(d).toFixed(2)}.` : d > 0.02 ? `**הכיול נחלש** ב-${d.toFixed(2)}.` : '**הכיול יציב**.'
  return (
    <div className="trend card" data-testid="trend">
      <svg viewBox={`0 0 ${w} ${h}`} style={{ direction: 'ltr' }} role="img" aria-label={`ציון ברייר לאורך ${pts.length} חודשים`}>
        <line x1="8" x2={w - 8} y1={y(0.25)} y2={y(0.25)} style={{ stroke: 'var(--lead)' }} strokeDasharray="3 3" />
        <polyline points={pts.map((p, i) => `${x(i)},${y(p.b)}`).join(' ')} style={{ fill: 'none', stroke: 'var(--ink)' }} strokeWidth="2" />
        {pts.map((p, i) => <circle key={p.at} cx={x(i)} cy={y(p.b)} r="3.5" style={{ fill: p.b < 0.25 ? 'var(--sprout)' : 'var(--wax)' }} />)}
      </svg>
      <Rich insight={insight} detail={`**${pts.length}** חודשים. למעלה טוב יותר, והחודש האחרון משמאל. הקו המקווקו הוא הטלת מטבע, **0.25**.`} />
    </div>
  )
}
