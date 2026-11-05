import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

let current: Session | null = null
const subs = new Set<(s: Session | null) => void>()
let started = false
function start() {
  if (started) return
  started = true
  supabase.auth.getSession().then(({ data }) => { current = data.session; subs.forEach((f) => f(current)) }).catch(() => {})
  supabase.auth.onAuthStateChange((_e, s) => { current = s; subs.forEach((f) => f(current)) })
}

export function useSession() {
  const [s, set] = useState<Session | null>(current)
  useEffect(() => { start(); subs.add(set); set(current); return () => { subs.delete(set) } }, [])
  return s
}

export function signInGoogle() {
  const redirectTo = window.location.origin + window.location.pathname + window.location.hash
  return supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
}
export const signOut = () => supabase.auth.signOut()
