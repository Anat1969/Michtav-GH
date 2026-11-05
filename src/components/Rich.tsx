import { Fragment } from 'react'

/** `**מילה**` מוצג כמרקר צהוב, לפי תקן הזיקוק. */
export function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((p, i) => (p.startsWith('**') && p.endsWith('**') ? <mark key={i}>{p.slice(2, -2)}</mark> : <Fragment key={i}>{p}</Fragment>))}
    </>
  )
}

/** שורת תובנה גדולה, ומתחתיה משפט הסבר. אחרי כל פסיק: שורה חדשה. */
export function Rich({ insight, detail, className = '' }: { insight: string; detail?: string; className?: string }) {
  const lines = detail ? detail.split(/(?<=[,.])\s+/).filter(Boolean) : []
  return (
    <div className={`rich ${className}`}>
      <p className="rich-insight"><Inline text={insight} /></p>
      {lines.length > 0 && (
        <p className="rich-detail">
          {lines.map((l, i) => <span className="ln" key={i}><Inline text={l} /></span>)}
        </p>
      )}
    </div>
  )
}
