import { useEffect, useRef, useState } from 'react'
import { Rich } from '../components/Rich'
import { useLetters, removeLetter, importLetters, getSample } from '../logic/store'
import { daysUntil, fmt, isDue } from '../logic/dates'
import { download, icsFor } from '../logic/ics'
import { signInGoogle, useSession } from '../logic/auth'
import type { Letter, SealedMeta } from '../logic/types'

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

  const head = ready.length
    ? { insight: `**${ready.length} מכתבים** מחכים לפתיחה.`, detail: 'השנה עברה. החותם נשבר, ו**שאלות ההשוואה** מחכות.' }
    : waiting.length
      ? { insight: `**${waiting.length} חתומים**. הבא בעוד ${daysUntil(waiting[0].openAt)} ימים.`, detail: `נפתח ב-**${fmt(waiting[0].openAt)}**. תזכורת ליומן שומרת שלא יישכח.` }
      : { insight: 'עוד אין **מכתב חתום**.', detail: 'ארבע שאלות, ו**365** ימים של שתיקה. אפשר להתחיל במכתב לדוגמה.' }

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
        <span className="lbar" aria-label={`עברו ${pct}% מהשנה`}><span style={{ width: `${pct}%` }} /></span>
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
