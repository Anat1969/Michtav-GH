import { useEffect, useMemo, useState } from 'react'
import { LetterPaper, type Draft } from '../components/LetterPaper'
import { Seascape } from '../components/Seascape'
import { SoundToggle } from '../components/SoundToggle'
import { splash } from '../logic/sound'
import { Rich } from '../components/Rich'
import { AREAS, type Item, type Letter } from '../logic/types'
import { nextFirst, fmt, uid } from '../logic/dates'
import { liveFearLine } from '../logic/score'
import { localQuestions } from '../logic/questions'
import { saveLetter, useLetters } from '../logic/store'
import { aiQuestions } from '../logic/ai'
import { signInGoogle, useSession } from '../logic/auth'
import { download, icsFor } from '../logic/ics'

const DRAFT_KEY = 'michtav.draft.v1'
const blank = (): Item => ({ id: uid(), text: '', p: 50 })
function initial(): Draft {
  try { const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); if (d?.visions) return { ...d, createdAt: new Date().toISOString(), openAt: nextFirst(new Date()).toISOString() } } catch { /* */ }
  const now = new Date()
  return { createdAt: now.toISOString(), openAt: nextFirst(now).toISOString(), visions: [blank(), blank(), blank()], fears: [blank(), blank(), blank()], ladder: 5, areas: { work: 5, relations: 5, health: 5, meaning: 5 }, note: '' }
}

const STEPS = [
  { short: 'חזון', q: 'מה יהיה נכון בחיים שלך בראשון לחודש הבא?', hint: 'כל משפט מדליק מגדלור. ככל שהוא סביר יותר, האור חזק יותר.' },
  { short: 'פחד', q: 'ממה יש לך חשש לחודש הקרוב?', hint: 'כל פחד הוא ענן. ככל שהוא סביר יותר, הענן כהה יותר.' },
  { short: 'היום', q: 'איפה הסולם שלך עומד היום?', hint: '10 הם החיים הטובים ביותר האפשריים עבורך. 0 הגרועים ביותר.' },
  { short: 'חתימה', q: 'מה להגיד לעצמך בראשון לחודש?', hint: 'הבקבוק יגיע לחוף ב-' },
]

function ItemsEditor({ items, onChange, kind, placeholder }: { items: Item[]; onChange: (x: Item[]) => void; kind: 'sprout' | 'wax'; placeholder: string[] }) {
  return (
    <div className="items">
      {items.map((it, i) => (
        <div className="item" key={it.id}>
          <label className="sr" htmlFor={`t-${it.id}`}>משפט {i + 1}</label>
          <input id={`t-${it.id}`} className="field" value={it.text} maxLength={140} placeholder={placeholder[i]}
            onChange={(e) => onChange(items.map((x) => (x.id === it.id ? { ...x, text: e.target.value } : x)))} />
          <div className="prob">
            <span className="label">כמה סביר</span>
            <input type="range" min={0} max={100} step={5} value={it.p} aria-label={`הסתברות למשפט ${i + 1}`} className={`range ${kind}`}
              onChange={(e) => onChange(items.map((x) => (x.id === it.id ? { ...x, p: Number(e.target.value) } : x)))} />
            <span className="num prob-n">{it.p}%</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export function Write() {
  const session = useSession()
  const { cloudError } = useLetters()
  const cloudOk = !!session && !cloudError
  const [d, setD] = useState<Draft>(initial)
  const [step, setStep] = useState(0)
  const [storage, setStorage] = useState<'local' | 'cloud'>('local')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [sealed, setSealed] = useState<Letter | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => { if (!sealed) try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)) } catch { /* */ } }, [d, sealed])
  useEffect(() => { if (!cloudOk && storage === 'cloud') setStorage('local') }, [cloudOk, storage])
  useEffect(() => { if (!msg) return; const t = setTimeout(() => setMsg(null), 4500); return () => clearTimeout(t) }, [msg])

  const filled = d.visions.some((x) => x.text.trim()) || d.fears.some((x) => x.text.trim())
  const fearLine = liveFearLine(d.fears)
  const preview = useMemo(() => localQuestions(d.visions, d.fears, d.note), [d])

  async function seal() {
    if (!filled) { setMsg('צריך לפחות משפט חזון או פחד אחד.'); setStep(0); return }
    setBusy(true)
    const visions = d.visions.filter((x) => x.text.trim()).map((x) => ({ ...x, text: x.text.trim() }))
    const fears = d.fears.filter((x) => x.text.trim()).map((x) => ({ ...x, text: x.text.trim() }))
    let questions = localQuestions(visions, fears, d.note)
    let qSource: Letter['qSource'] = 'local'
    if (consent) {
      try {
        const r = await aiQuestions(visions, fears, d.note)
        if (Array.isArray(r.questions) && r.questions.length) { questions = [...r.questions.slice(0, 4), questions[questions.length - 1]]; qSource = 'ai' }
      } catch { setMsg('ה-AI לא זמין כרגע. השאלות נבנו מהמילים שלך.') }
    }
    const letter: Letter = { id: uid(), createdAt: new Date().toISOString(), openAt: d.openAt, visions, fears, ladder: d.ladder, areas: d.areas, note: d.note.trim(), questions, qSource, storage }
    try {
      await saveLetter(letter)
      setSealed(letter)
      setTimeout(splash, 1600)
      try { localStorage.removeItem(DRAFT_KEY) } catch { /* */ }
    } catch {
      setMsg('השמירה בשרת נכשלה. אפשר לחתום במכשיר.')
    }
    setBusy(false)
  }

  const reminder = () => sealed && download(`michtav-${fmt(sealed.openAt)}.ics`, icsFor(sealed.id, sealed.openAt, `${location.origin}${location.pathname}#/open/${sealed.id}`), 'text/calendar')

  return (
    <main className="page with-actions">
      <div className="wrap write">
        <section className="write-form" aria-live="polite">
          {sealed ? (
            <div className="sealed-done">
              <p className="eyebrow">הבקבוק בים</p>
              <h1 className="h2">יגיע לחוף ב-<mark className="num">{fmt(sealed.openAt)}</mark>.</h1>
              <Rich insight={`**${sealed.questions.length} שאלות השוואה** מחכות בפנים.`} detail={sealed.storage === 'cloud' ? 'בשרת. **אף אחד** לא קורא אותו לפני הראשון, גם לא את/ה.' : 'במכשיר הזה. **תזכורת ליומן** תזכיר בכל ראשון לחודש.'} />
              <div className="home-cta">
                <button className="btn primary" onClick={reminder}>תזכורת ליומן</button>
                <a className="btn" href="#/letters">למכתבים שלי</a>
              </div>
              <ol className="tl" aria-label="מה קורה עכשיו">
                <li className="now"><span className="label">היום, {fmt(sealed.createdAt)}</span><b>הבקבוק נזרק</b><span className="note">{sealed.visions.length} חזון, {sealed.fears.length} פחד, סולם {sealed.ladder}.</span></li>
                <li><span className="label">במהלך החודש</span><b>נסחף</b><span className="note">בלי קריאה ובלי עריכה.</span></li>
                <li className="end"><span className="label">{fmt(sealed.openAt)}</span><b>נפלט לחוף</b><span className="note">עננים מתפזרים, מגדלורים נדלקים.</span></li>
              </ol>
            </div>
          ) : (
            <>
              <ol className="stepper" aria-label="שלבי הכתיבה">
                {STEPS.map((s, i) => (
                  <li key={s.short}><button className="chip" aria-pressed={step === i} onClick={() => setStep(i)}><span className="num">{i + 1}</span> {s.short}</button></li>
                ))}
              </ol>
              <h1 className="h2 q">{STEPS[step].q}</h1>
              <p className="note">{STEPS[step].hint}{step === 3 && <b className="num">{fmt(d.openAt)}</b>}{step === 3 && '.'}</p>

              {step === 0 && <ItemsEditor kind="sprout" items={d.visions} onChange={(visions) => setD({ ...d, visions })} placeholder={['למשל: עובד/ת בעבודה שאני גאה בה', 'למשל: רץ/ה עשרה קילומטרים', 'למשל: קרוב/ה יותר לאחותי']} />}
              {step === 1 && (
                <>
                  <ItemsEditor kind="wax" items={d.fears} onChange={(fears) => setD({ ...d, fears })} placeholder={['למשל: לא אצליח לעזוב את העבודה', 'למשל: הבריאות של אבא תידרדר', 'למשל: אוותר שוב על החלום']} />
                  {fearLine && <div className="callout"><Rich insight={fearLine.insight} detail={fearLine.detail} /></div>}
                </>
              )}
              {step === 2 && (
                <div className="today">
                  <div className="ladder" role="radiogroup" aria-label="סולם קנטריל">
                    {Array.from({ length: 11 }, (_, n) => 10 - n).map((n) => (
                      <button key={n} role="radio" aria-checked={d.ladder === n} className="chip rung" aria-pressed={d.ladder === n} onClick={() => setD({ ...d, ladder: n })}><span className="num">{n}</span></button>
                    ))}
                  </div>
                  <div className="areas">
                    <p className="label">ובכל תחום, מ-0 עד 10</p>
                    {AREAS.map((a) => (
                      <label key={a.key} className="area">
                        <span>{a.label}</span>
                        <input type="range" min={0} max={10} value={d.areas[a.key]} className="range ink" onChange={(e) => setD({ ...d, areas: { ...d.areas, [a.key]: Number(e.target.value) } })} />
                        <span className="num">{d.areas[a.key]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {step === 3 && (
                <div className="sign">
                  <label className="sr" htmlFor="note">מילה לעצמי</label>
                  <textarea id="note" className="field" rows={4} maxLength={1200} value={d.note} placeholder="מה חשוב שתזכור/י ביום שתפתח/י את זה?" onChange={(e) => setD({ ...d, note: e.target.value })} />
                  <div className="sign-opts">
                    <p className="label">איפה החותם</p>
                    <div className="row">
                      <button className="chip" aria-pressed={storage === 'local'} onClick={() => setStorage('local')}>במכשיר הזה</button>
                      <button className="chip" aria-pressed={storage === 'cloud'} disabled={!!session && !cloudOk} onClick={() => (cloudOk ? setStorage('cloud') : signInGoogle())}>{!session ? 'בשרת: כניסה עם Google' : cloudOk ? 'בשרת, נעול עד יום הפתיחה' : 'החותם בשרת לא זמין כרגע'}</button>
                    </div>
                    <p className="note">{storage === 'cloud' ? 'השרת לא מחזיר את התוכן לפני יום הפתיחה, גם לא לך. נגיש מכל מכשיר.' : 'נשמר רק בדפדפן הזה. החותם הוא של הממשק: הקובץ עצמו לא מוצפן.'}</p>
                    <label className="consent">
                      <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                      <span>לנסח את השאלות בעזרת AI. <span className="note">המכתב יישלח ל-Gemini החינמי של Google, שרשאית להשתמש בתוכן. בלי סימון, השאלות נבנות מהמילים שלך במכשיר.</span></span>
                    </label>
                  </div>
                  <details className="qprev">
                    <summary>השאלות שיחכו לך בפנים ({preview.length})</summary>
                    <ol>{preview.map((q, i) => <li key={i}>{q}</li>)}</ol>
                  </details>
                </div>
              )}
            </>
          )}
        </section>
        <section className="write-paper" aria-label="תצוגת המכתב">
          <div className="write-sea">
            <Seascape progress={sealed ? 0.02 : 0} throwKey={sealed ? 1 : undefined}
              visions={d.visions.filter((x) => x.text.trim()).map((x) => ({ p: x.p }))}
              fears={d.fears.filter((x) => x.text.trim()).map((x) => ({ p: x.p }))}
              bottles={sealed ? undefined : []}
              label="הים של המכתב: מגדלור לכל חזון, ענן לכל פחד" />
            <SoundToggle className="sea-sound" />
            {!sealed && <span className="write-sea-cap"><b className="num">{d.visions.filter((x) => x.text.trim()).length}</b> מגדלורים · <b className="num">{d.fears.filter((x) => x.text.trim()).length}</b> עננים</span>}
          </div>
          <LetterPaper d={d} step={step} sealed={!!sealed} />
        </section>
      </div>
      {msg && <div className="toast" role="status" onClick={() => setMsg(null)}>{msg}</div>}
      <div className="actions" role="toolbar" aria-label="פעולות">
        <div className="actions-inner">
          {sealed ? (
            <>
              <button className="btn primary" onClick={reminder}>תזכורת ליומן</button>
              <span className="grow">החותם נשבר ב-{fmt(sealed.openAt)}.</span>
              <a className="btn" href="#/letters">המכתבים שלי</a>
            </>
          ) : (
            <>
              {step < 3
                ? <button className="btn primary" onClick={() => setStep(step + 1)}>הבא: {STEPS[step + 1].short}</button>
                : <button className="btn wax" disabled={busy} onClick={seal}>{busy ? 'חותם...' : 'חתימה עד הראשון לחודש'}</button>}
              <span className="grow">שלב <b className="num">{step + 1}</b> מתוך 4. הטיוטה נשמרת אוטומטית.</span>
              <button className="btn ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>הקודם</button>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
