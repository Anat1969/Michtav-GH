// Michtav-GH: "מכתב לעצמי בעוד שנה". שני מצבים:
//   questions: שאלות השוואה אישיות מתוך החזון והפחדים, לשאול ביום הפתיחה.
//   distill: זיקוק ההשוואה ביום הפתיחה, לפי תקן הזיקוק.
// Gemini החינמי (GEMINI_API_KEY) קודם, Claude (ANTHROPIC_API_KEY) רק כגיבוי. פלט JSON מובנה, מגבלת קצב.
// הלקוח שולח רק אחרי הסכמה מפורשת. הפונקציה לא שומרת דבר.
// תקן: https://github.com/Anat1969/Claude-GH/blob/main/docs/ai-text-standard.md
import Anthropic from 'npm:@anthropic-ai/sdk';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 60000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 6;
}

const COMMON = `עברית טבעית, קצרה ומקצועית. בלי סימני קריאה, בלי אימוג'י, בלי מילים ריקות, בלי עצות כלליות.
פנייה בגוף שני בזמן עבר או בצורה שזהה בזכר ובנקבה ("כתבת", "פחדת", "מה השתנה"). לא להשתמש בצורות שמסגירות מגדר.
אין אבחנה, אין שם של הפרעה, אין פרשנות נפשית. מצטטים רק את מה שהכותב/ת כתב/ה. לא ממציאים עובדות, שמות או מספרים.`;

const SYS_Q = `את/ה עוזר/ת לאדם לכתוב מכתב לעצמו שייפתח בעוד שנה. הוא כתב חזון ופחדים, ולכל אחד הסתברות.
המשימה: לנסח בדיוק 4 שאלות השוואה שהוא יענה עליהן ביום הפתיחה. כל שאלה:
- עד 20 מילים, ומסתיימת בסימן שאלה.
- נשענת על משפט מסוים שכתב, ומצטטת ממנו 2 עד 5 מילים במירכאות.
- פותחת השוואה בין הציפייה לבין מה שקרה: מה קידם, מה עצר, מה הפחד עלה, מה השתנה בהגדרה של הצלחה.
- לא חוזרת על שאלה אחרת.
${COMMON}`;

const SYS_D = `את/ה מזקק/ת את יום הפתיחה של מכתב שאדם כתב לעצמו לפני שנה. קיבלת: ציון ברייר (0 מושלם, 0.25 ניחוש של 50%), ההסתברויות שנתן לחזון ולפחדים, מה התממש (1, 0.5 חלקית, 0), שינוי בסולם קנטריל (0 עד 10) ובארבעה תחומים, ותשובות לשאלות.
זקק, אל תתאר. מבנה קבוע:
1. insight: שורת תובנה עד 8 מילים, שמבטאת את הדפוס המרכזי. מסתיימת בנקודה.
2. detail: משפט הסבר אחד, עד 20 מילים, שמפרט אותו ומעגן במספר מהנתונים.
הבלטות ב-**כוכביות כפולות**: בשורת התובנה המושג המרכזי בלבד. במשפט ההסבר 2 עד 3 הבלטות, למספרים ולמושגי מפתח. לא מבליטים מילות קישור ולא משפט שלם.
מספרים תמיד בספרות. רק מספרים שמופיעים בנתונים.
${COMMON}`;

const SCHEMAS = {
  questions: {
    claude: { type: 'object', additionalProperties: false, required: ['questions'], properties: { questions: { type: 'array', items: { type: 'string' } } } },
    gemini: { type: 'OBJECT', required: ['questions'], properties: { questions: { type: 'ARRAY', items: { type: 'STRING' } } } },
  },
  distill: {
    claude: { type: 'object', additionalProperties: false, required: ['insight', 'detail'], properties: { insight: { type: 'string' }, detail: { type: 'string' } } },
    gemini: { type: 'OBJECT', required: ['insight', 'detail'], properties: { insight: { type: 'STRING' }, detail: { type: 'STRING' } } },
  },
};
type Mode = keyof typeof SCHEMAS;

const GEMINI_MODELS = [...new Set([Deno.env.get('GEMINI_MODEL') ?? 'gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'])];

async function viaGemini(key: string, mode: Mode, system: string, user: string) {
  let last: unknown;
  for (const model of GEMINI_MODELS) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMAS[mode].gemini, temperature: 0.4 },
        }),
        signal: AbortSignal.timeout(25000),
      });
      if (!r.ok) throw Object.assign(new Error(`Gemini ${model} ${r.status}`), { status: r.status });
      const j = await r.json();
      const text = j?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
      return JSON.parse(text);
    } catch (err) {
      last = err;
      const st = (err as { status?: number }).status;
      if (st === 400 || st === 401 || st === 403) break;
    }
  }
  throw last;
}

async function viaClaude(key: string, mode: Mode, system: string, user: string) {
  const client = new Anthropic({ apiKey: key });
  const response = await client.beta.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 2000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system,
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMAS[mode].claude } },
    messages: [{ role: 'user', content: user }],
  } as never);
  if (response.stop_reason === 'refusal') throw new Error('הבקשה נדחתה');
  const text = response.content.filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('');
  return JSON.parse(text);
}

const clip = (s: unknown, n: number) => String(s ?? '').slice(0, n);
type It = { text?: string; p?: number };
const items = (xs: unknown) => (Array.isArray(xs) ? xs : []).slice(0, 3).map((x: It) => `- "${clip(x?.text, 140)}" (${Math.max(0, Math.min(100, Number(x?.p) || 0))}%)`).join('\n');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'POST בלבד' }, 405);
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anon';
  if (limited(ip)) return json({ error: 'יותר מדי בקשות. נסו שוב בעוד דקה.' }, 429);

  let body: { mode?: string; visions?: unknown; fears?: unknown; note?: unknown; payload?: unknown };
  try { body = await req.json(); } catch { return json({ error: 'גוף הבקשה אינו JSON' }, 400); }
  const mode = body.mode === 'distill' ? 'distill' : body.mode === 'questions' ? 'questions' : null;
  if (!mode) return json({ error: 'מצב לא מוכר' }, 400);

  let system: string, user: string;
  if (mode === 'questions') {
    const v = items(body.visions), f = items(body.fears);
    if (!v && !f) return json({ error: 'אין חזון או פחד לניסוח' }, 400);
    system = SYS_Q;
    user = `החזון (מה יהיה נכון בעוד שנה, והסתברות):\n${v || '(ריק)'}\n\nהפחדים (והסתברות):\n${f || '(ריק)'}\n\nמילה לעצמי: "${clip(body.note, 400)}"`;
  } else {
    system = SYS_D;
    user = `נתוני יום הפתיחה (JSON):\n${clip(JSON.stringify(body.payload ?? {}), 8000)}`;
  }

  const gk = Deno.env.get('GEMINI_API_KEY');
  const ak = Deno.env.get('ANTHROPIC_API_KEY');
  const errors: string[] = [];
  const clean = (r: Record<string, unknown>) => mode === 'questions'
    ? { questions: (Array.isArray(r.questions) ? r.questions : []).map((q) => clip(q, 200)).filter(Boolean).slice(0, 4) }
    : { insight: clip(r.insight, 120), detail: clip(r.detail, 260) };
  if (gk) {
    try { return json({ ...clean(await viaGemini(gk, mode, system, user)), engine: 'gemini' }); } catch (e) { errors.push(String((e as Error).message ?? e)); }
  }
  if (ak) {
    try { return json({ ...clean(await viaClaude(ak, mode, system, user)), engine: 'claude' }); } catch (e) { errors.push(String((e as Error).message ?? e)); }
  }
  return json({ error: `אין מנוע זמין כרגע (${errors.join('; ') || 'חסר מפתח'})` }, 503);
});
