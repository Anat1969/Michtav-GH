import { useEffect, useState } from 'react'

export type Route = { name: 'home' | 'write' | 'letters' | 'open' | 'method'; id?: string }

export function parse(hash = window.location.hash): Route {
  const [, a, b] = hash.replace(/^#/, '').split('/')
  if (a === 'write') return { name: 'write' }
  if (a === 'letters') return { name: 'letters' }
  if (a === 'method') return { name: 'method' }
  if (a === 'open' && b) return { name: 'open', id: decodeURIComponent(b) }
  return { name: 'home' }
}

export function useRoute() {
  const [r, set] = useState(parse())
  useEffect(() => {
    const on = () => { set(parse()); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return r
}

export const go = (path: string) => { window.location.hash = path }
