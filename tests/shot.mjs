import { createRequire } from 'node:module'
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
const { chromium } = createRequire(import.meta.url)('playwright')
const menuJs = readFileSync('tests/fixtures/ai-menu.js', 'utf8')
const srv = spawn('node_modules/.bin/vite', ['preview', '--port', '4174', '--strictPort'], { stdio: 'pipe' })
await new Promise((r) => { srv.stdout.on('data', (d) => String(d).includes('4174') && r()); setTimeout(r, 6000) })
const b = await chromium.launch()
const [, , ...routes] = process.argv
for (const spec of routes) {
  const [path, w, h, setup] = spec.split('|')
  const ctx = await b.newContext({ viewport: { width: +w, height: +h } })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message))
  await page.route('**/ai-menu.js', (r) => r.fulfill({ body: menuJs, contentType: 'application/javascript' }))
  await page.route('**/*.supabase.co/**', (r) => r.fulfill({ json: [] }))
  await page.goto('http://localhost:4174/')
  if (setup) await page.evaluate(setup)
  await page.goto('http://localhost:4174/' + path); await page.reload()
  await page.waitForTimeout(2600)
  const name = (path.replace(/[#/]/g, '') || 'home') + '-' + w
  await page.screenshot({ path: `tests/shots/v2-${name}.png` })
  console.log('shot', name)
  await ctx.close()
}
await b.close(); srv.kill()
