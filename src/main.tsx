import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './styles/base.css'

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)

// service worker רק כשהבסיס הוא השורש (לא בקישור raw.githack).
if ('serviceWorker' in navigator && import.meta.env.BASE_URL === '/' && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
}
