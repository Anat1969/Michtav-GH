import { motion, useReducedMotion } from 'framer-motion'
import { YearRing, type RingMark } from '../components/YearRing'
import { Rich } from '../components/Rich'
import { useLetters, getSample } from '../logic/store'
import { compare } from '../logic/score'
import { addYear, daysUntil, fmt, isDue } from '../logic/dates'

export function Home() {
  const reduce = useReducedMotion()
  const { local, sealed, cloud } = useLetters()
  const all = [
    ...local.map((l) => ({ id: l.id, createdAt: l.createdAt, openAt: l.openAt })),
    ...sealed.map((l) => ({ id: l.id, createdAt: l.createdAt, openAt: l.openAt })),
    ...cloud.map((l) => ({ id: l.id, createdAt: l.createdAt, openAt: l.openAt })),
  ]
  const waiting = all.filter((l) => !isDue(l.openAt)).sort((a, b) => a.openAt.localeCompare(b.openAt))
  const next = waiting[0]
  const now = new Date()
  const start = next ? next.createdAt : now.toISOString()
  const end = next ? next.openAt : addYear(now).toISOString()
  const marks: RingMark[] = next
    ? waiting.filter((l) => new Date(l.openAt) <= new Date(end)).map((l) => ({ id: l.id, at: l.openAt, label: `נפתח ב-${fmt(l.openAt)}`, kind: 'sealed' }))
    : [{ id: 'new', at: end, label: `מכתב שנכתב היום נפתח ב-${fmt(end)}`, kind: 'sample' }]
  const days = next ? daysUntil(next.openAt) : daysUntil(end)
  const due = all.filter((l) => isDue(l.openAt)).length

  const map = [
    { href: '#/write', title: 'כתיבה', line: 'ארבע שאלות. חזון, פחד, היום, ומילה לעצמך.', n: '4', unit: 'שאלות' },
    { href: '#/letters', title: 'המכתבים שלי', line: waiting.length ? `הבא נפתח ב-${fmt(waiting[0].openAt)}.` : 'עוד אין מכתב חתום.', n: String(all.length), unit: 'מכתבים' },
    { href: '#/open/sample', title: 'יום הפתיחה', line: 'מכתב לדוגמה שנפתח היום, עם כל ההשוואות.', n: (compare(getSample()).brier ?? 0).toFixed(2), unit: 'ציון ברייר' },
    { href: '#/method', title: 'השיטה', line: 'על מה הכלי נשען, ואיך הוא מודד את עצמו.', n: '5', unit: 'מקורות' },
  ]

  return (
    <main className="page">
      <div className="wrap home">
        <section className="home-text">
          <p className="eyebrow">מכתב לעצמי בעוד שנה</p>
          <h1 className="h1"><mark>91%</mark> מהדאגות לא מתממשות. בעוד שנה נבדוק את שלך.</h1>
          <p className="lead">כותבים חזון ופחד, ולכל אחד נותנים הסתברות.<br />המכתב נחתם, ונפתח בעוד שנה עם שאלות השוואה וציון כיול.</p>
          <div className="home-cta">
            <a className="btn primary" href="#/write">לכתוב מכתב</a>
            <a className="btn" href="#/open/sample">יום פתיחה לדוגמה</a>
            {due > 0 && <a className="btn wax" href="#/letters">{due} מכתבים מחכים לפתיחה</a>}
          </div>
          <div className="psi">
            <div className="psi-box problem"><span className="label">בעיה</span><Rich insight="**הזיכרון מתקן** את עצמו בדיעבד." detail="אחרי שנה כבר לא זוכרים כמה פחדנו, ולכן לא לומדים שהפחד **הגזים**." /></div>
            <div className="psi-box solution"><span className="label">פתרון</span><Rich insight="**הסתברות** לכל חזון ולכל פחד." detail="המכתב נחתם עם המספרים, ונפתח בעוד **365** ימים עם **שאלות השוואה**." /></div>
            <div className="psi-box insight"><span className="label">תובנה</span><Rich insight="**ציון ברייר** מודד כמה צדקת." detail="**0** הוא כיול מושלם. ניחוש של **50%** על הכול מקבל **0.25**." /></div>
          </div>
        </section>

        <section className="home-ring" aria-label="טבעת השנה">
          <YearRing start={start} end={end} marks={marks} big={String(days)} caption={next ? `ימים עד שהמכתב הבא נפתח` : 'ימים עד שמכתב שנכתב היום נפתח'} />
          <div className="legend ring-legend">
            <span><span className="dot lead" /> זמן שעבר</span>
            <span><span className="dot ink" style={{ width: 2, height: 12 }} /> היום</span>
            <span><span className="dot wax" /> חותם: יום פתיחה</span>
            <span className="note">ריחוף על חודש: כמה ימים עד אליו</span>
          </div>
          <div data-aoa-demo="large" />
        </section>

        <nav className="cmap" aria-label="מפת התוכן">
          {map.map((m, i) => (
            <motion.a key={m.href} href={m.href} className="cmap-card press" initial={reduce ? false : { y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 + i * 0.06 }}>
              <span className="cmap-n"><span className="num">{m.n}</span> <span className="label">{m.unit}</span></span>
              <span className="h3">{m.title}</span>
              <span className="note">{m.line}</span>
            </motion.a>
          ))}
        </nav>
        <p className="src home-src">השראה: קפסולת הזמן של ווסטינגהאוס (Westinghouse Time Capsule), היריד העולמי בניו יורק (New York World's Fair), 1939. המחקר: LaFreniere &amp; Newman, Behavior Therapy, 2020.</p>
      </div>
    </main>
  )
}
