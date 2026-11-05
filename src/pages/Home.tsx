import { motion, useReducedMotion } from 'framer-motion'
import { Seascape, type SeaBottle } from '../components/Seascape'
import { useLetters, getSample } from '../logic/store'
import { compare } from '../logic/score'
import { nextFirst, daysUntil, fmt, isDue } from '../logic/dates'
import { go } from '../logic/route'

/** כמה מהחודש כבר עבר: הזמן שהשמיים מראים. */
export function monthProgress(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime()
  return (now.getTime() - start) / (end - start)
}

export function Home() {
  const reduce = useReducedMotion()
  const { local, sealed, cloud } = useLetters()
  const all = [
    ...local.map((l) => ({ id: l.id, createdAt: l.createdAt, openAt: l.openAt, v: l.visions, f: l.fears })),
    ...cloud.map((l) => ({ id: l.id, createdAt: l.createdAt, openAt: l.openAt, v: l.visions, f: l.fears })),
    ...sealed.map((l) => ({ id: l.id, createdAt: l.createdAt, openAt: l.openAt, v: Array.from({ length: l.visions }, () => ({ p: 50 })), f: Array.from({ length: l.fears }, () => ({ p: 50 })) })),
  ]
  const waiting = all.filter((l) => !isDue(l.openAt)).sort((a, b) => a.openAt.localeCompare(b.openAt))
  const due = all.filter((l) => isDue(l.openAt)).length
  const next = waiting[0]
  const nowMs = Date.now()
  const prog = (l: { createdAt: string; openAt: string }) => (nowMs - new Date(l.createdAt).getTime()) / (new Date(l.openAt).getTime() - new Date(l.createdAt).getTime())
  const days = next ? daysUntil(next.openAt) : daysUntil(nextFirst(new Date()).toISOString())
  const bottles: SeaBottle[] = waiting.map((l) => ({ id: l.id, progress: prog(l), label: `נפתח ב-${fmt(l.openAt)}` }))

  const tiles = [
    { href: '#/write', k: 'כתיבה', n: '4', u: 'שאלות' },
    { href: '#/letters', k: 'הבקבוקים שלי', n: String(all.length), u: 'מכתבים' },
    { href: '#/open/sample', k: 'יום פתיחה לדוגמה', n: (compare(getSample()).brier ?? 0).toFixed(2), u: 'ציון ברייר' },
    { href: '#/method', k: 'השיטה', n: '5', u: 'מקורות' },
  ]

  return (
    <main className="page flush">
      <section className="hero" aria-label="הים של החודש">
        <Seascape progress={next ? prog(next) : monthProgress()} visions={(next?.v ?? getSample().visions).map((x) => ({ p: x.p }))} fears={(next?.f ?? getSample().fears).map((x) => ({ p: x.p }))}
          bottles={bottles.length ? bottles : undefined} onBottle={(id) => go(`/open/${id}`)}
          label={`ים בלילה עם מגדלורים ועננים. ${days} ימים עד הראשון לחודש.`} />
        <motion.div className="hero-ov" initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
          <p className="hero-days"><span className="big">{days}</span><span>ימים עד שהבקבוק<br />מגיע לחוף</span></p>
          <h1 className="hero-h"><mark>91%</mark> מהדאגות לא מתממשות.</h1>
          <p className="hero-lead">משליכים מכתב לים. בראשון לחודש הוא חוזר, ומראה כמה צדקת.</p>
          <div className="home-cta">
            <a className="btn sun" href="#/write">להשליך בקבוק לים</a>
            <a className="btn glass" href="#/open/sample">לראות בקבוק שחזר</a>
            {due > 0 && <a className="btn wax" href="#/letters">{due} בקבוקים על החוף</a>}
          </div>
        </motion.div>
        <div className="hero-legend" aria-label="מקרא">
          <span><i className="lg-light" /> מגדלור: חזון</span>
          <span><i className="lg-cloud" /> ענן: פחד</span>
          <span><i className="lg-sky" /> שמיים: הזמן עד הראשון</span>
          <span><i className="lg-bottle" /> בקבוק: המכתב</span>
        </div>
      </section>
      <div className="wrap">
        <nav className="cmap" aria-label="מפת התוכן">
          {tiles.map((m, i) => (
            <motion.a key={m.href} href={m.href} className="cmap-card" initial={reduce ? false : { y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 + i * 0.07 }}>
              <span className="cmap-n"><span className="num">{m.n}</span> <span className="label">{m.u}</span></span>
              <span className="h3">{m.k}</span>
            </motion.a>
          ))}
        </nav>
        <p className="src home-src">השראה: קפסולת הזמן של ווסטינגהאוס (Westinghouse Time Capsule), 1939. המחקר: LaFreniere &amp; Newman, 2020.</p>
      </div>
    </main>
  )
}
