import type { Letter } from '../logic/types'

/** מכתב לדוגמה: נכתב בראשון לחודש הקודם, ונפתח בראשון לחודש הזה. */
export function sampleLetter(): Letter {
  const now = new Date()
  const open = new Date(now.getFullYear(), now.getMonth(), 1)
  if (open.getTime() > now.getTime() - 1) open.setMonth(open.getMonth() - 1)
  const created = new Date(open.getFullYear(), open.getMonth() - 1, 1, 21, 30)
  return {
    id: 'sample',
    sample: true,
    createdAt: created.toISOString(),
    openAt: open.toISOString(),
    storage: 'local',
    visions: [
      { id: 'v1', text: 'אגיש למנחה את הפרק הראשון של עבודת הגמר', p: 80 },
      { id: 'v2', text: 'אסדר בבית פינת עבודה עם אור', p: 50 },
      { id: 'v3', text: 'ארוץ חמישה קילומטרים בלי לעצור', p: 30 },
    ],
    fears: [
      { id: 'f1', text: 'לא אעמוד בדדליין של המנחה', p: 70 },
      { id: 'f2', text: 'אריב עם אחותי על הטיפול באמא', p: 40 },
      { id: 'f3', text: 'אדחה שוב את הבדיקה אצל הרופא', p: 60 },
    ],
    ladder: 5,
    areas: { work: 4, relations: 7, health: 5, meaning: 5 },
    note: 'החודש נבנה מצעדים קטנים. גם יום רע הוא יום של למידה.',
    questions: [
      'כתבת "אגיש למנחה את הפרק הראשון של עבודת הגמר" ונתת לזה 80%. מה קידם את זה, ומה עצר?',
      'ל"ארוץ חמישה קילומטרים בלי לעצור" נתת רק 30%. האם הזהירות עזרה או הגבילה?',
      'פחדת ש"לא אעמוד בדדליין של המנחה". מה הדאגה גבתה ממך החודש, גם אם זה לא קרה?',
      'איזה פחד נעלם בלי שהרגשת, ואיזה פחד חדש תפס את מקומו?',
      'מה היית רוצה להגיד לעצמך של לפני חודש, במשפט אחד?',
    ],
    qSource: 'local',
    answers: {
      outcomes: { v1: 'yes', v2: 'partial', v3: 'yes', f1: 'no', f2: 'no', f3: 'partial' },
      ladder: 7,
      areas: { work: 6, relations: 7, health: 7, meaning: 6 },
      replies: [
        'שעתיים כל בוקר לפני העבודה. בלי זה הייתי דוחה עוד חודש.',
        'הזהירות הגבילה. רצתי חמישה כבר בשבוע השלישי.',
        'שלושה לילות של שינה רעה, והפרק הוגש יומיים לפני הזמן.',
        'הפחד מהריב נעלם. במקומו פחד מהעומס בפרק השני.',
        'תנסה/י לפני שאת/ה בטוח/ה. הביטחון מגיע אחרי.',
      ],
      openedAt: now.toISOString(),
    },
  }
}
