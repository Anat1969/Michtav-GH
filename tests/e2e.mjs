// בדיקות Playwright מול vite preview. ai-menu.js נטען מעותק מקומי, ו-Supabase מדומה.
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
import { spawn } from 'node:child_process'
import { readFileSync, mkdirSync } from 'node:fs'

const BASE = 'http://localhost:4173/'
const SHOTS = 'tests/shots'
mkdirSync(SHOTS, { recursive: true })
const menuJs = readFileSync('tests/fixtures/ai-menu.js', 'utf8')
let fails = 0
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'} ${m}`); if (!c) fails++ }

const server = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], { stdio: 'pipe' })
await new Promise((r) => { server.stdout.on('data', (d) => { if (String(d).includes('4173')) r() }); setTimeout(r, 6000) })

const browser = await chromium.launch()
const aiCalls = []
async function newPage(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'he-IL', ...opts })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => { console.log('PAGEERROR', e.message); fails++ })
  await page.route('**/ai-menu.js', (r) => r.fulfill({ body: menuJs, contentType: 'application/javascript' }))
  await page.route('**/*.supabase.co/**', (r) => {
    const u = r.request().url()
    if (u.includes('/functions/v1/michtav-ai')) {
      const body = JSON.parse(r.request().postData() || '{}')
      aiCalls.push(body)
      if (body.mode === 'questions') return r.fulfill({ json: { questions: ['שאלה אישית ראשונה מה-AI?', 'שאלה שנייה?', 'שאלה שלישית?'], engine: 'gemini' } })
      return r.fulfill({ json: { insight: '**הפחד הגזים** ברוב השנה.', detail: 'שני פחדים מתוך **3** לא התממשו, והסולם עלה ב-**2** שלבים.', engine: 'gemini' } })
    }
    if (u.includes('/auth/v1/')) return r.fulfill({ status: 200, json: {} })
    return r.fulfill({ status: 200, json: [] })
  })
  return { ctx, page }
}

async function noHScroll(page) { return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1) }
async function scrollRatio(page) { return page.evaluate(() => document.documentElement.scrollHeight / window.innerHeight) }

// 1. בית
{
  const { ctx, page } = await newPage()
  await page.goto(BASE)
  await page.waitForSelector('.ring svg')
  ok(await page.locator('ai-menu .logo').isVisible(), 'A&I logo button in the top bar')
  ok(!(await page.locator('header >> text=העתקת קישור').first().isVisible().catch(() => false)), 'no loose development buttons in the bar')
  ok((await page.getAttribute('html', 'dir')) === 'rtl', 'html dir=rtl')
  ok((await page.locator('h1').textContent()).includes('91%'), 'home insight line with the key number')
  ok((await page.locator('.ring-center .big').textContent()).trim() === '365' || (await page.locator('.ring-center .big').textContent()).trim() === '366', 'ring shows days until opening')
  await page.locator('.ring path[tabindex]').nth(2).hover()
  ok((await page.locator('.ring-cap').textContent()).includes('ימים עד'), 'ring responds to hover with month')
  ok(await page.locator('.cmap-card').count() === 4, 'content map has 4 cards')
  ok(await scrollRatio(page) < 1.35, `home fits the screen (ratio ${(await scrollRatio(page)).toFixed(2)})`)
  await page.waitForTimeout(1300)
  await page.screenshot({ path: `${SHOTS}/home-1440.png` })
  const cdp = await ctx.newCDPSession(page)
  const inst = await cdp.send('Page.getInstallabilityErrors')
  ok(inst.installabilityErrors.length === 0, `installable (${JSON.stringify(inst.installabilityErrors)})`)
  // ניווט: שם האפליקציה מחזיר לבית, וכל קישור בסרגל עובד
  for (const [label, sel] of [['כתיבה', '.stepper'], ['המכתבים שלי', '.lgrid'], ['יום הפתיחה', '.kpis'], ['השיטה', '.method-table']]) {
    await page.click(`.nav >> text=${label}`)
    await page.waitForSelector(sel)
    ok(true, `nav: ${label}`)
  }
  await page.click('.brand')
  await page.waitForSelector('.ring')
  ok(true, 'brand links home')
  await ctx.close()
}

// 2. כתיבה וחתימה, עם AI בהסכמה
{
  const { ctx, page } = await newPage()
  await page.goto(BASE + '#/write')
  await page.waitForSelector('.stepper')
  const inputs = page.locator('.items .field')
  await inputs.nth(0).fill('אעבוד בסטודיו משלי')
  await inputs.nth(1).fill('אלמד לנגן בפסנתר')
  await page.locator('.items input[type=range]').nth(0).fill('70')
  ok((await page.locator('.lp-row').count()) === 2, 'live letter shows vision rows as you type')
  ok((await page.locator('.lp-row .num').first().textContent()) === '70%', 'probability reaches the letter')
  await page.screenshot({ path: `${SHOTS}/write-1440.png` })
  await page.click('.actions >> text=הבא')
  await page.locator('.items .field').nth(0).fill('לא אצליח לשלם שכירות')
  await page.locator('.items input[type=range]').nth(0).fill('80')
  ok((await page.locator('.callout').textContent()).includes('8.6%'), 'fear vs research line appears while writing')
  await page.click('.actions >> text=הבא')
  await page.click('.rung >> text=6')
  ok((await page.locator('.lp-ladder-n').textContent()) === '6', 'ladder reaches the letter')
  await page.click('.actions >> text=הבא')
  await page.fill('#note', 'תזכור/י לנשום.')
  await page.click('.qprev summary')
  ok((await page.locator('.qprev li').count()) >= 3, 'local comparison questions preview')
  await page.check('.consent input')
  await page.screenshot({ path: `${SHOTS}/sign-1440.png` })
  await page.click('.actions >> text=חתימה לשנה')
  await page.waitForSelector('.sealed-done')
  ok(aiCalls.some((c) => c.mode === 'questions' && c.visions?.length === 2), 'AI questions request sent only after consent, with the letter')
  await page.waitForTimeout(1600)
  await page.screenshot({ path: `${SHOTS}/sealed-1440.png` })
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('michtav.letters.v1') || '[]'))
  ok(stored.length === 1 && stored[0].qSource === 'ai' && stored[0].questions[0].includes('AI'), 'letter saved with AI questions')
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('.actions >> text=תזכורת ליומן')])
  ok(dl.suggestedFilename().endsWith('.ics'), 'calendar reminder downloads')
  // אחרי רענון: נשמר, וחתום
  await page.goto(BASE + '#/letters')
  await page.reload()
  await page.waitForSelector('[data-testid=letter-card]')
  ok((await page.locator('[data-testid=letter-card]').count()) === 2, 'letter persists after reload (plus sample)')
  ok((await page.locator('.letters-head').textContent()).includes('חתומים'), 'letters page insight counts sealed')
  await page.screenshot({ path: `${SHOTS}/letters-1440.png` })
  await page.click('text=לראות את המעטפה')
  await page.waitForSelector('.locked')
  ok((await page.locator('.locked .big').textContent()).trim().length > 0, 'sealed letter stays locked with countdown')
  ok(!(await page.locator('text=אעבוד בסטודיו משלי').isVisible().catch(() => false)), 'sealed letter content not shown')
  await page.screenshot({ path: `${SHOTS}/locked-1440.png` })
  await ctx.close()
}

// 3. בלי הסכמה: אין קריאה ל-AI
{
  const before = aiCalls.length
  const { ctx, page } = await newPage()
  await page.goto(BASE + '#/write')
  await page.locator('.items .field').nth(0).fill('משהו')
  for (let i = 0; i < 3; i++) await page.click('.actions >> text=הבא')
  await page.click('.actions >> text=חתימה לשנה')
  await page.waitForSelector('.sealed-done')
  ok(aiCalls.length === before, 'no AI call without consent')
  await ctx.close()
}

// 4. יום פתיחה: מכתב מקומי שהגיע זמנו, תשובות והשוואה
{
  const { ctx, page } = await newPage()
  await page.goto(BASE)
  await page.evaluate(() => {
    const now = Date.now(), D = 86400000
    localStorage.setItem('michtav.letters.v1', JSON.stringify([{ id: 'due1', createdAt: new Date(now - 366 * D).toISOString(), openAt: new Date(now - D).toISOString(), storage: 'local', visions: [{ id: 'a', text: 'חזון א', p: 90 }], fears: [{ id: 'b', text: 'פחד ב', p: 80 }, { id: 'c', text: 'פחד ג', p: 60 }], ladder: 4, areas: { work: 4, relations: 5, health: 5, meaning: 4 }, note: 'שלום', questions: ['ש1?', 'ש2?'], qSource: 'local' }]))
  })
  await page.goto(BASE + '#/open/due1')
  await page.reload()
  await page.waitForSelector('.read')
  ok((await page.locator('.read').textContent()).includes('חזון א'), 'due letter opens and shows content')
  await page.click('.actions >> text=לענות על השאלות')
  await page.waitForSelector('.answer')
  ok(await page.locator('.answer .btn.primary').isDisabled(), 'compare blocked until every line is marked')
  const groups = page.locator('.ans [role=radiogroup]')
  await groups.nth(0).locator('text=התממש').first().click()
  await groups.nth(1).locator('text=לא התממש').click()
  await groups.nth(2).locator('text=חלקית').click()
  await page.locator('.ladder-row .chip >> text=7').click()
  await page.locator('.qa textarea').nth(0).fill('תשובה ראשונה')
  await page.click('.answer .btn.primary')
  await page.waitForSelector('.kpis')
  // ברייר: (0.9-1)^2=.01, (0.8-0)^2=.64, (0.6-0.5)^2=.01 → 0.22
  ok((await page.locator('.kpi .big').first().textContent()) === '0.22', 'Brier score computed correctly (0.22)')
  ok((await page.locator('.kpi .big').nth(3).textContent()) === '+3', 'ladder delta +3')
  ok((await page.locator('.cmp-side').textContent()).includes('הפחד הגזים'), 'computed fear insight under chart')
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('michtav.letters.v1'))[0].answers)
  ok(saved && saved.outcomes.b === 'no' && saved.replies[0] === 'תשובה ראשונה', 'answers saved with the letter')
  page.once('dialog', (d) => d.accept())
  await page.click('text=זיקוק ב-AI')
  await page.waitForSelector('.insight-box')
  ok(aiCalls.some((c) => c.mode === 'distill' && c.payload?.brier > 0.2), 'distill request sends computed scores')
  await ctx.close()
}

// 5. דוגמה, נייד, הפחתת תנועה
{
  const { ctx, page } = await newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(BASE + '#/open/sample')
  await page.waitForSelector('.kpis')
  await page.waitForTimeout(900)
  ok((await page.locator('.kpi .big').first().textContent()) === '0.20', 'sample Brier = 0.20 (1.19 / 6)')
  await page.screenshot({ path: `${SHOTS}/compare-1440.png` })
  await page.goto(BASE + '#/method')
  await page.waitForSelector('.method-table')
  await page.screenshot({ path: `${SHOTS}/method-1440.png` })
  await ctx.close()
}
for (const [name, path] of [['home', ''], ['write', '#/write'], ['letters', '#/letters'], ['compare', '#/open/sample'], ['method', '#/method']]) {
  const { ctx, page } = await newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, reducedMotion: 'reduce' })
  await page.goto(BASE + path)
  await page.waitForTimeout(500)
  ok(await noHScroll(page), `mobile ${name}: no horizontal scroll`)
  await page.screenshot({ path: `${SHOTS}/${name}-390.png` })
  await ctx.close()
}

await browser.close()
server.kill()
console.log(fails ? `\n${fails} FAILED` : '\nALL GREEN')
process.exit(fails ? 1 : 0)
