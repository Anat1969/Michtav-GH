import { Rich } from '../components/Rich'

const SOURCES = [
  { who: 'לורה קינג', en: 'Laura A. King', year: 2001, work: 'The health benefits of writing about life goals, Personality and Social Psychology Bulletin', take: 'תרגיל "העצמי הטוב ביותר האפשרי": כתיבה על עתיד שבו המטרות התממשו.', where: 'שלב החזון' },
  { who: 'הדלי קנטריל', en: 'Hadley Cantril', year: 1965, work: 'The Pattern of Human Concerns', take: 'סולם של 0 עד 10 לחיים הטובים והגרועים ביותר האפשריים. מדד הרווחה של גאלופ (Gallup).', where: 'שלב היום וההשוואה' },
  { who: 'לוקאס לה־פרנייר ומישל ניומן', en: 'Lucas S. LaFreniere & Michelle G. Newman', year: 2020, work: "Exposing worry's deceit, Behavior Therapy 51(3)", take: '91.4% מהדאגות של משתתפים עם חרדה כללית לא התממשו.', where: 'קו ההשוואה לפחד' },
  { who: 'גלן ברייר', en: 'Glenn W. Brier', year: 1950, work: 'Verification of forecasts expressed in terms of probability, Monthly Weather Review', take: 'ציון כיול להסתברויות. כך הכלי מודד כמה הוא, ואת/ה, צודקים.', where: 'ציון הכיול' },
  { who: 'האל הרשפילד', en: 'Hal E. Hershfield', year: 2011, work: 'Future self-continuity, Annals of the New York Academy of Sciences', take: 'ככל שהעצמי העתידי מרגיש קרוב, ההחלטות של היום טובות יותר.', where: 'המכתב עצמו' },
]

export function Method() {
  return (
    <main className="page">
      <div className="wrap method">
        <section className="method-lead">
          <p className="eyebrow">השיטה</p>
          <h1 className="h1">הכלי לא מנחש בשבילך. <mark>הוא מודד</mark> את הניחוש שלך.</h1>
          <blockquote className="quote">
            <p>"את החיים אפשר להבין רק לאחור, אבל צריך לחיות אותם קדימה."</p>
            <cite>סרן קירקגור (Søren Kierkegaard), יומנים, 1843</cite>
          </blockquote>
          <div className="psi">
            <div className="psi-box problem"><span className="label">מה הכלי מודד</span><Rich insight="**כיול**, לא הצלחה." detail="ציון נמוך לא אומר שהשנה הייתה רעה. הוא אומר שההסתברויות שנתת **רחוקות** ממה שקרה." /></div>
            <div className="psi-box solution"><span className="label">איך הוא מודד את עצמו</span><Rich insight="**ברייר** מול הטלת מטבע." detail="**0** מושלם, **0.25** הוא 50% על הכול. ציון מעל 0.25 אומר שניחוש עיוור היה טוב יותר." /></div>
            <div className="psi-box insight"><span className="label">מגבלות</span><Rich insight="**שישה משפטים** הם מדגם קטן." detail="הציון רועש במכתב אחד. אחרי **שלושה** מכתבים מתחילים לראות דפוס. הכלי לא מאבחן." /></div>
          </div>
          <p className="haiku">חותם של שעווה<br />שנה שלמה שותקת<br />הדיו עוד זוכר</p>
        </section>
        <section className="method-table" aria-label="המקורות">
          <table>
            <thead><tr><th>מקור</th><th>מה לקחנו</th><th>איפה בכלי</th></tr></thead>
            <tbody>
              {SOURCES.map((s) => (
                <tr key={s.en}>
                  <td><b>{s.who}</b><br /><span className="note">{s.en}, {s.year}</span><br /><span className="src">{s.work}</span></td>
                  <td>{s.take}</td>
                  <td><span className="tag">{s.where}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="card formula">
            <p className="label">הנוסחה</p>
            <p className="num" style={{ direction: 'ltr', textAlign: 'right' }}>Brier = (1/N) · Σ (p − o)²</p>
            <p className="note">p: ההסתברות שנתת (0 עד 1). o: מה שקרה. התממש = 1, חלקית = 0.5, לא = 0.</p>
            <p className="note">פרטיות: בלי הסכמה, שום דבר לא יוצא מהמכשיר. החותם בשרת נשען על מדיניות RLS ב-Supabase, שלא מחזירה את התוכן לפני יום הפתיחה.</p>
          </div>
        </section>
      </div>
    </main>
  )
}
