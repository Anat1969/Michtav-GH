// תזכורת ליומן (RFC 5545) ליום הפתיחה, כדי שהמכתב לא יישכח.
import { fmt } from './dates'

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
const day = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`

export function icsFor(id: string, openAt: string, url: string) {
  const d = new Date(openAt)
  const next = new Date(d.getTime() + 86_400_000)
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Michtav-GH//HE', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:michtav-${id}@michtav-gh`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART;VALUE=DATE:${day(d)}`,
    `DTEND;VALUE=DATE:${day(next)}`,
    'SUMMARY:המכתב לעצמי נפתח היום',
    `DESCRIPTION:המכתב שחתמת לפני שנה נפתח ב-${fmt(openAt)}. ${url}`,
    `URL:${url}`,
    'BEGIN:VALARM', 'TRIGGER:PT9H', 'ACTION:DISPLAY', 'DESCRIPTION:המכתב לעצמי נפתח היום', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
}

export function download(name: string, text: string, type: string) {
  const blob = new Blob([text], { type })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
