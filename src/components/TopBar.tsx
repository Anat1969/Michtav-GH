import { useEffect, useRef } from 'react'
import type { Route } from '../logic/route'
import { signInGoogle, signOut, useSession } from '../logic/auth'

// שיחת הפיתוח שבה נבנתה האפליקציה.
export const DEV_CHAT_URL = 'https://claude.ai/code/session_01UBnSCJJD9p8zE6W6MjaAj3'

interface MenuItem { label: string; hint?: string; pressed?: boolean; onSelect: () => unknown }
interface MenuElement extends HTMLElement { items: MenuItem[]; status: string }

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'ai-menu': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { chat?: string; research?: string }
    }
  }
}

const NAV: { name: Route['name']; href: string; label: string }[] = [
  { name: 'write', href: '#/write', label: 'כתיבה' },
  { name: 'letters', href: '#/letters', label: 'המכתבים שלי' },
  { name: 'open', href: '#/open/sample', label: 'יום הפתיחה' },
  { name: 'method', href: '#/method', label: 'השיטה' },
]

export function TopBar({ route }: { route: Route }) {
  const session = useSession()
  const ref = useRef<MenuElement>(null)

  // כניסה ויציאה נכנסות לכפתור הלוגו. העתקת קישור, שיחת הפיתוח וההתקנה מגיעות מהרכיב עצמו.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const apply = () => {
      el.items = session
        ? [{ label: 'יציאה', hint: session.user.email ?? undefined, onSelect: () => signOut() }]
        : [{ label: 'כניסה עם Google', hint: 'לחותם בשרת', onSelect: () => signInGoogle() }]
      el.status = session ? 'מחובר/ת' : ''
    }
    apply()
    customElements.whenDefined?.('ai-menu').then(apply).catch(() => {})
  }, [session])

  return (
    <header className="topbar" role="banner">
      <div className="topbar-inner">
        <a href="#/" className="brand" aria-label="מכתב לעצמי, דף הבית">
          <img src="./icon.svg" alt="" />
          <span>
            <span className="brand-name">מכתב לעצמי</span>
            <span className="brand-sub"> לראשון בחודש</span>
          </span>
        </a>
        <nav className="nav" aria-label="ניווט ראשי">
          {NAV.map((n) => (
            <a key={n.name} href={n.href} aria-current={route.name === n.name ? 'page' : undefined}>{n.label}</a>
          ))}
        </nav>
        <ai-menu ref={ref} chat={DEV_CHAT_URL} />
      </div>
    </header>
  )
}
