// תזכורת ליומן (RFC 5545): בראשון של כל חודש, לפתוח את המכתב ולכתוב את הבא. UID קבוע, כך שייבוא חוזר מעדכן את אותו אירוע.
import { fmt } from './dates'

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
const day = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`

export function icsFor(_id: string, openAt: string, url: string) {
  const d = new Date(openAt)
  const next = new Date(d.getTime() + 86_400_000)
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Michtav-GH//HE', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:michtav-monthly@michtav-gh',
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART;VALUE=DATE:${day(d)}`,
    `DTEND;VALUE=DATE:${day(next)}`,
    'RRULE:FREQ=MONTHLY;BYMONTHDAY=1',
    'SUMMARY:הראשון לחודש: לפתוח את המכתב ולכתוב את הבא',
    `DESCRIPTION:המכתב הבא נפתח ב-${fmt(openAt)}, ואחריו בכל ראשון לחודש. ${url}`,
    `URL:${url}`,
    'BEGIN:VALARM', 'TRIGGER:PT9H', 'ACTION:DISPLAY', 'DESCRIPTION:הראשון לחודש: מכתב לעצמי', 'END:VALARM',
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
