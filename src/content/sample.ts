import type { Letter } from '../logic/types'
import { DAY } from '../logic/dates'

/** מכתב לדוגמה, כדי לראות את יום הפתיחה בלי לחכות שנה. */
export function sampleLetter(): Letter {
  const now = Date.now()
  const created = new Date(now - 366 * DAY)
  return {
    id: 'sample',
    sample: true,
    createdAt: created.toISOString(),
    openAt: new Date(now - DAY).toISOString(),
    storage: 'local',
    visions: [
      { id: 'v1', text: 'אסיים את התואר ואגיש את עבודת הגמר', p: 80 },
      { id: 'v2', text: 'אעבור לדירה עם מרפסת ואור', p: 50 },
      { id: 'v3', text: 'ארוץ עשרה קילומטרים בלי לעצור', p: 30 },
    ],
    fears: [
      { id: 'f1', text: 'לא אמצא עבודה בתחום אחרי הלימודים', p: 70 },
      { id: 'f2', text: 'החברות הקרובה שלנו תתרחק', p: 40 },
      { id: 'f3', text: 'אשחק אותה בטוח ולא אנסה משהו חדש', p: 60 },
    ],
    ladder: 5,
    areas: { work: 4, relations: 7, health: 5, meaning: 5 },
    note: 'תזכור/י שהשנה הזו נבנתה מצעדים קטנים. גם יום רע הוא יום של למידה.',
    questions: [
      'כתבת "אסיים את התואר ואגיש את עבודת הגמר" ונתת לזה 80%. מה קידם את זה, ומה עצר?',
      'ל"ארוץ עשרה קילומטרים בלי לעצור" נתת רק 30%. האם הזהירות עזרה או הגבילה?',
      'פחדת ש"לא אמצא עבודה בתחום אחרי הלימודים". מה הדאגה גבתה ממך בשנה הזו, גם אם זה לא קרה?',
      'איזה פחד נעלם בלי שהרגשת, ואיזה פחד חדש תפס את מקומו?',
      'מה היית רוצה להגיד לעצמך של לפני שנה, במשפט אחד?',
    ],
    qSource: 'local',
    answers: {
      outcomes: { v1: 'yes', v2: 'partial', v3: 'yes', f1: 'no', f2: 'no', f3: 'partial' },
      ladder: 7,
      areas: { work: 6, relations: 7, health: 7, meaning: 6 },
      replies: [
        'הקבוצה שלמדנו איתה כל שבוע. בלי זה הייתי דוחה עוד חצי שנה.',
        'הזהירות הגבילה. רצתי עשרה בחודש השביעי.',
        'חודשיים של שינה רעה, ובסוף ההצעה הגיעה מחברה מהלימודים.',
        'הפחד מהחברות נעלם. במקומו פחד מעומס בעבודה החדשה.',
        'תנסה/י לפני שאת/ה בטוח/ה. הביטחון מגיע אחרי.',
      ],
      openedAt: new Date(now).toISOString(),
    },
  }
}
