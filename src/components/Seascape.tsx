import { useEffect, useRef } from 'react'

/**
 * הים של החודש. כל מה שמצויר כאן הוא נתון:
 * - השמיים: הזמן שעבר מהחתימה. לילה בכתיבה, זריחה בראשון לחודש.
 * - הבקבוק: המכתב. נסחף מימין (החתימה) אל החוף משמאל (יום הפתיחה).
 * - מגדלור לכל משפט חזון. עוצמת האור היא ההסתברות. אחרי הפתיחה: דולק אם התממש.
 * - ענן לכל פחד. הכהות היא ההסתברות. אחרי הפתיחה: מתפזר אם לא קרה, יורד גשם אם קרה.
 * - שחפים ודגים: חיים בים. בלחיצה על המים נפתח גל.
 */
export interface SeaVision { p: number; o?: number | null }
export interface SeaFear { p: number; o?: number | null }
export interface SeaBottle { id: string; progress: number; label: string; due?: boolean }

interface Props {
  progress: number
  visions?: SeaVision[]
  fears?: SeaFear[]
  bottles?: SeaBottle[]
  onBottle?: (id: string) => void
  throwKey?: number
  ashore?: boolean
  revealKey?: number
  className?: string
  label: string
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x))
const hex = (h: string) => h.startsWith('rgb') ? (h.match(/\d+/g) ?? ['0', '0', '0']).slice(0, 3).map(Number) : [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
const mix = (a: string, b: string, t: number) => { const x = hex(a), y = hex(b); return `rgb(${Math.round(lerp(x[0], y[0], t))},${Math.round(lerp(x[1], y[1], t))},${Math.round(lerp(x[2], y[2], t))})` }

// מפתחות השמיים לאורך החודש: לילה, לפני שחר, שחר, זריחה.
const SKY = [
  { at: 0, top: '#0b1630', bot: '#24305c', sea: '#0d1b38' },
  { at: 0.55, top: '#16224a', bot: '#4b4f86', sea: '#16264a' },
  { at: 0.85, top: '#3c4f8f', bot: '#e79a7c', sea: '#2a3d6a' },
  { at: 1, top: '#7fb0e0', bot: '#ffd29a', sea: '#3a6491' },
]
function skyAt(p: number) {
  for (let i = 0; i < SKY.length - 1; i++) {
    const a = SKY[i], b = SKY[i + 1]
    if (p <= b.at) { const t = (p - a.at) / (b.at - a.at); return { top: mix(a.top, b.top, t), bot: mix(a.bot, b.bot, t), sea: mix(a.sea, b.sea, t), night: 1 - clamp((p - 0.5) / 0.45) } }
  }
  const l = SKY[SKY.length - 1]
  return { top: l.top, bot: l.bot, sea: l.sea, night: 0 }
}

// רנדום קבוע, כדי שהכוכבים והעננים לא יקפצו בכל ציור.
function rng(seed: number) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 } }

export function Seascape({ progress, visions = [], fears = [], bottles, onBottle, throwKey, ashore, revealKey, className = '', label }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const state = useRef({ progress, visions, fears, bottles, throwKey, ashore, revealKey, throwAt: 0, revealAt: 0, ripples: [] as { x: number; y: number; t: number }[], mx: 0.5, hits: [] as { id: string; x: number; y: number }[] })

  useEffect(() => {
    const s = state.current
    if (throwKey && throwKey !== s.throwKey) s.throwAt = performance.now()
    if (revealKey && revealKey !== s.revealKey) s.revealAt = performance.now()
    Object.assign(s, { progress, visions, fears, bottles, throwKey, ashore, revealKey })
  }, [progress, visions, fears, bottles, throwKey, ashore, revealKey])

  useEffect(() => {
    const cv = ref.current!
    const ctx = cv.getContext('2d')!
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0, W = 0, H = 0
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const resize = () => {
      const r = cv.getBoundingClientRect()
      W = Math.max(1, r.width); H = Math.max(1, r.height)
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (reduce) draw(performance.now())
    }
    const ro = new ResizeObserver(resize)
    ro.observe(cv)

    const R = rng(7)
    const stars = Array.from({ length: 140 }, () => ({ x: R(), y: R() * 0.62, r: R() * 1.3 + 0.3, ph: R() * 6.28 }))
    const cloudSeed = Array.from({ length: 6 }, (_, i) => ({ x: 0.18 + i * 0.16 + R() * 0.05, y: 0.12 + R() * 0.16, s: 0.8 + R() * 0.5, v: 4 + R() * 6 }))
    const gulls = Array.from({ length: 4 }, (_, i) => ({ x: R(), y: 0.12 + R() * 0.25, v: 18 + R() * 16, ph: R() * 6, s: 0.7 + R() * 0.6, d: i % 2 ? 1 : -1 }))
    let fish = { t: -1, x: 0.5 }
    const start = performance.now()

    function horizon() { return H * (W < 600 ? 0.72 : 0.64) }
    function waveY(x: number, t: number, layer: number) {
      const k = 0.012 / (layer + 1), sp = 0.6 + layer * 0.5, amp = 3 + layer * 3.5
      return horizon() + layer * (H * 0.09) + Math.sin(x * k + t * sp) * amp + Math.sin(x * k * 2.3 - t * sp * 0.7) * amp * 0.4
    }

    function cloud(cx: number, cy: number, sc: number, dark: number, alpha: number) {
      ctx.save()
      ctx.globalAlpha = alpha
      const g = ctx.createLinearGradient(0, cy - 30 * sc, 0, cy + 24 * sc)
      g.addColorStop(0, mix('#f4f1ec', '#5d6577', dark))
      g.addColorStop(1, mix('#d9d6e3', '#2b3040', dark))
      ctx.fillStyle = g
      ctx.beginPath()
      for (const [dx, dy, r] of [[-38, 6, 22], [-14, -8, 30], [16, -2, 26], [40, 8, 18], [0, 12, 26]] as const) ctx.moveTo(cx + dx * sc + r * sc, cy + dy * sc), ctx.arc(cx + dx * sc, cy + dy * sc, r * sc, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    function lighthouse(x: number, base: number, h: number, power: number, t: number) {
      // מגדל בפסים, עם פנס שאורו לפי ההסתברות.
      ctx.save()
      const w = h * 0.16
      ctx.fillStyle = '#f4efe6'
      ctx.beginPath(); ctx.moveTo(x - w, base); ctx.lineTo(x - w * 0.6, base - h); ctx.lineTo(x + w * 0.6, base - h); ctx.lineTo(x + w, base); ctx.closePath(); ctx.fill()
      ctx.fillStyle = '#a8322d'
      for (let i = 1; i < 4; i += 2) { const y0 = base - (h * i) / 4, y1 = base - (h * (i + 1)) / 4, f0 = lerp(w, w * 0.6, i / 4), f1 = lerp(w, w * 0.6, (i + 1) / 4); ctx.beginPath(); ctx.moveTo(x - f0, y0); ctx.lineTo(x - f1, y1); ctx.lineTo(x + f1, y1); ctx.lineTo(x + f0, y0); ctx.closePath(); ctx.fill() }
      ctx.fillStyle = '#1d2433'; ctx.fillRect(x - w * 0.75, base - h - h * 0.16, w * 1.5, h * 0.16)
      const lampY = base - h - h * 0.08
      if (power > 0.02) {
        const ang = t * 0.9 + x
        const len = Math.min(W, 900) * (0.35 + power * 0.5)
        for (const side of [0, Math.PI]) {
          const a = ang + side
          const gr = ctx.createRadialGradient(x, lampY, 0, x, lampY, len)
          gr.addColorStop(0, `rgba(255,226,150,${0.34 * power})`); gr.addColorStop(1, 'rgba(255,226,150,0)')
          ctx.fillStyle = gr
          ctx.beginPath(); ctx.moveTo(x, lampY); ctx.arc(x, lampY, len, a - 0.09, a + 0.09); ctx.closePath(); ctx.fill()
        }
        const halo = ctx.createRadialGradient(x, lampY, 0, x, lampY, 26 * (0.4 + power))
        halo.addColorStop(0, `rgba(255,236,180,${0.9 * power + 0.1})`); halo.addColorStop(1, 'rgba(255,236,180,0)')
        ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x, lampY, 26 * (0.4 + power), 0, Math.PI * 2); ctx.fill()
      }
      ctx.restore()
    }

    function bottle(x: number, y: number, rot: number, sc: number, glow: number) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc)
      if (glow > 0) { const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 40); g.addColorStop(0, `rgba(255,230,160,${glow})`); g.addColorStop(1, 'rgba(255,230,160,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 40, 0, 7); ctx.fill() }
      ctx.fillStyle = 'rgba(160,210,200,0.55)'; ctx.strokeStyle = 'rgba(230,250,245,0.9)'; ctx.lineWidth = 1.4
      ctx.beginPath(); ctx.roundRect(-20, -8, 32, 16, 6); ctx.fill(); ctx.stroke()
      ctx.beginPath(); ctx.rect(12, -4, 9, 8); ctx.fill(); ctx.stroke()
      ctx.fillStyle = '#8a5a35'; ctx.fillRect(20, -3.5, 5, 7)
      ctx.fillStyle = '#f2e9d6'; ctx.fillRect(-15, -4.5, 22, 9)
      ctx.fillStyle = '#a8322d'; ctx.beginPath(); ctx.arc(-4, 0, 3, 0, 7); ctx.fill()
      ctx.restore()
    }

    function draw(now: number) {
      const s = state.current
      const t = reduce ? 4 : (now - start) / 1000
      const p = clamp(s.progress)
      const sky = skyAt(p)
      const hz = horizon()
      // שמיים
      const g = ctx.createLinearGradient(0, 0, 0, hz)
      g.addColorStop(0, sky.top); g.addColorStop(1, sky.bot)
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, hz + 2)
      // כוכבים: נעלמים לקראת הזריחה
      if (sky.night > 0.02) for (const st of stars) { ctx.globalAlpha = sky.night * (0.45 + 0.55 * Math.sin(t * 1.5 + st.ph) ** 2); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(st.x * W, st.y * hz, st.r, 0, 7); ctx.fill() }
      ctx.globalAlpha = 1
      // ירח בלילה, שמש עולה בראשון לחודש
      const sunX = W * 0.22, sunY = lerp(hz + 40, hz * 0.45, clamp((p - 0.7) / 0.3))
      if (p > 0.7) { const sg = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 120); sg.addColorStop(0, 'rgba(255,220,150,0.95)'); sg.addColorStop(0.25, 'rgba(255,190,120,0.6)'); sg.addColorStop(1, 'rgba(255,190,120,0)'); ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sunX, sunY, 120, 0, 7); ctx.fill(); ctx.fillStyle = '#ffe2a8'; ctx.beginPath(); ctx.arc(sunX, sunY, 26, 0, 7); ctx.fill() }
      if (sky.night > 0.2) { const mx = W * (W < 600 ? 0.18 : 0.5), my = hz * 0.16; ctx.globalAlpha = sky.night; ctx.fillStyle = '#f3efe2'; ctx.beginPath(); ctx.arc(mx, my, 18, 0, 7); ctx.fill(); ctx.fillStyle = sky.top; ctx.beginPath(); ctx.arc(mx + 7, my - 4, 16, 0, 7); ctx.fill(); ctx.globalAlpha = 1 }

      // עננים: פחד אחד לכל ענן
      const reveal = s.revealAt ? clamp((now - s.revealAt) / 2600) : (s.fears?.some((f) => f.o !== undefined && f.o !== null) ? 1 : 0)
      ;(s.fears ?? []).forEach((f, i) => {
        const c = cloudSeed[i % cloudSeed.length]
        const cx = ((c.x * W + t * c.v) % (W + 160)) - 80
        const cy = (W < 600 ? 0.5 + c.y * 0.6 : c.y) * hz + 10
        const pr = clamp(f.p / 100)
        const o = f.o ?? null
        let dark = 0.25 + pr * 0.75, alpha = 0.55 + pr * 0.4, sc = c.s * (0.8 + pr * 0.6) * (W < 600 ? 0.5 : 1)
        if (o !== null) { const k = reveal; dark = lerp(dark, o * 0.95, k); alpha = lerp(alpha, o === 0 ? 0.08 : 0.5 + o * 0.45, k); sc *= lerp(1, o === 0 ? 0.6 : 1, k) }
        cloud(cx, cy, sc, dark, alpha)
        if (o !== null && o > 0 && reveal > 0.5) { ctx.strokeStyle = `rgba(190,205,230,${0.5 * o})`; ctx.lineWidth = 1; for (let k = 0; k < 14 * o; k++) { const rx = cx - 40 * sc + ((k * 37) % (80 * sc)), ry = cy + 20 * sc + ((t * 160 + k * 23) % 60); ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 3, ry + 8); ctx.stroke() } }
      })

      // אי: משמאל, החוף של יום הפתיחה. גבעה, ומתחתיה רצועת חול שנכנסת למים.
      const shoreW = Math.min(W * 0.28, 360)
      const day = clamp((p - 0.6) / 0.4)
      // גבעה אחת שכל המגדלורים עומדים עליה
      const hillW = shoreW * (W < 600 ? 1.1 : 1.25)
      const hillY = (x: number) => hz + 26 - Math.max(0, Math.sin(Math.PI * clamp(x / hillW))) ** 0.8 * Math.min(W < 600 ? 56 : 110, H * 0.17)
      ctx.fillStyle = mix(mix('#141a2e', '#3f5a4a', day), sky.sea, 0.15)
      ctx.beginPath(); ctx.moveTo(-10, H)
      for (let x = -10; x <= hillW + 10; x += 6) ctx.lineTo(x, hillY(x))
      ctx.lineTo(hillW + 10, H); ctx.closePath(); ctx.fill()
      const vs = s.visions ?? [{ p: 60 }]
      vs.forEach((v, i) => {
        const x = hillW * (0.26 + i * 0.2), base = hillY(x) + 4, h = Math.min(H * 0.2, W < 600 ? 62 : 110) * (1 - i * 0.14)
        let power = clamp(v.p / 100) * 0.8 + 0.1
        if (v.o !== undefined && v.o !== null) power = lerp(power, v.o === 0 ? 0 : v.o, reveal)
        lighthouse(x, base, h, power, t)
      })

      // ים בשכבות, לכל הרוחב
      for (let layer = 0; layer < 3; layer++) {
        ctx.fillStyle = mix(sky.sea, '#000000', layer * 0.16)
        ctx.beginPath(); ctx.moveTo(0, H)
        for (let x = 0; x <= W + 10; x += 8) ctx.lineTo(x, waveY(x, t, layer))
        ctx.lineTo(W, H); ctx.closePath(); ctx.fill()
        ctx.strokeStyle = `rgba(255,255,255,${0.07 + layer * 0.05})`; ctx.lineWidth = 1
        ctx.beginPath(); for (let x = 0; x <= W; x += 8) { const y = waveY(x, t, layer); x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y) } ctx.stroke()
      }
      const sand = ctx.createLinearGradient(0, hz, 0, H)
      sand.addColorStop(0, mix('#3a3a4a', '#e8d2a4', day)); sand.addColorStop(1, mix('#22263a', '#c9ad7c', day))
      ctx.fillStyle = sand
      ctx.beginPath(); ctx.moveTo(-10, H * 0.86)
      ctx.bezierCurveTo(shoreW * 0.4, hz + H * 0.12, shoreW * 0.9, hz + H * 0.14, shoreW * 1.45, H)
      ctx.lineTo(-10, H); ctx.closePath(); ctx.fill()
      // קצף על קו החוף
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5
      ctx.beginPath(); for (let k = 0; k <= 30; k++) { const u = k / 30; const x = lerp(-10, shoreW * 1.45, u); const y = lerp(H * 0.86, H, u ** 1.6) - (1 - u) * (H * 0.06) * Math.sin(u * Math.PI) + Math.sin(t * 2 + u * 9) * 1.5; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y) } ctx.stroke()
      // שביל אור על המים, מהשמש או מהירח
      const pathX = p > 0.7 ? sunX : W * 0.5
      ctx.globalAlpha = 0.25; for (let k = 0; k < 10; k++) { const y = hz + 8 + k * 9; ctx.fillStyle = '#ffe6b5'; ctx.fillRect(pathX - 30 + Math.sin(t * 2 + k) * 8, y, 60 - k * 4, 2) } ctx.globalAlpha = 1

      // בקבוקים
      s.hits = []
      const list = s.bottles ?? [{ id: 'me', progress: p, label: '' }]
      for (const b of list) {
        const bp = clamp(b.progress)
        let x = lerp(W - 60, shoreW * 1.3, bp), y = waveY(x, t, 1) - 6, rot = Math.sin(t * 1.6 + x) * 0.18, sc = W < 600 ? 1.1 : 1.5
        if (s.ashore || b.due) { x = shoreW * 0.75; y = hz + H * 0.17; rot = -0.35 }
        if (s.throwAt && list.length === 1) {
          const k = clamp((now - s.throwAt) / 1600)
          if (k < 1) { const x0 = W * 0.9, y0 = H * 0.95; x = lerp(x0, x, k); y = lerp(y0, y, k) - Math.sin(k * Math.PI) * H * 0.45; rot = k * 8; sc *= lerp(1.8, 1, k) }
          else if (k >= 1 && now - s.throwAt < 1700) s.ripples.push({ x, y: y + 6, t: now })
        }
        bottle(x, y, rot, sc, b.due || s.ashore ? 0.6 + 0.3 * Math.sin(t * 3) : 0)
        s.hits.push({ id: b.id, x, y })
      }
      // אדוות
      s.ripples = s.ripples.filter((r) => now - r.t < 1400)
      for (const r of s.ripples) { const k = (now - r.t) / 1400; ctx.strokeStyle = `rgba(255,255,255,${0.6 * (1 - k)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(r.x, r.y, 10 + k * 60, 3 + k * 14, 0, 0, 7); ctx.stroke() }

      // שחפים
      for (const gl of gulls) {
        const gx = ((gl.x * W + gl.d * t * gl.v) % (W + 80) + W + 80) % (W + 80) - 40
        const gy = gl.y * hz + Math.sin(t + gl.ph) * 6
        const f = Math.sin(t * 7 + gl.ph) * 5 * gl.s
        ctx.strokeStyle = p > 0.75 ? 'rgba(30,36,51,0.8)' : 'rgba(240,240,250,0.8)'; ctx.lineWidth = 1.6
        ctx.beginPath(); ctx.moveTo(gx - 9 * gl.s, gy - f); ctx.quadraticCurveTo(gx - 4 * gl.s, gy - 4 * gl.s, gx, gy); ctx.quadraticCurveTo(gx + 4 * gl.s, gy - 4 * gl.s, gx + 9 * gl.s, gy - f); ctx.stroke()
      }
      // דג קופץ מדי פעם
      if (!reduce) {
        if (fish.t < 0 && Math.random() < 0.004) fish = { t: now, x: shoreW + 60 + Math.random() * (W - shoreW - 120) }
        if (fish.t > 0) { const k = (now - fish.t) / 900; if (k > 1) { s.ripples.push({ x: fish.x + 40, y: waveY(fish.x + 40, t, 1), t: now }); fish.t = -1 } else { const fx = fish.x + k * 40, fy = waveY(fish.x, t, 1) - Math.sin(k * Math.PI) * 46; ctx.save(); ctx.translate(fx, fy); ctx.rotate(lerp(-0.9, 0.9, k)); ctx.fillStyle = '#c9d6e3'; ctx.beginPath(); ctx.ellipse(0, 0, 10, 4, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(-15, -5); ctx.lineTo(-15, 5); ctx.fill(); ctx.restore() } }
      }
    }

    const loop = (now: number) => { draw(now); raf = requestAnimationFrame(loop) }
    resize()
    if (!reduce) raf = requestAnimationFrame(loop)
    else draw(performance.now())

    const onClick = (e: MouseEvent) => {
      const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top
      const s = state.current
      const hit = s.hits.find((h) => Math.hypot(h.x - x, h.y - y) < 34)
      if (hit && onBottle) { onBottle(hit.id); return }
      if (y > horizon()) s.ripples.push({ x, y, t: performance.now() })
    }
    cv.addEventListener('click', onClick)
    return () => { cancelAnimationFrame(raf); ro.disconnect(); cv.removeEventListener('click', onClick) }
  }, [onBottle])

  return <canvas ref={ref} className={`sea ${className}`} role="img" aria-label={label} data-testid="sea" />
}
