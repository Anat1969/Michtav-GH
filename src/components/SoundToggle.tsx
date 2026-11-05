import { useEffect } from 'react'
import { setSound, useSound, wantSound } from '../logic/sound'

export function SoundToggle({ className = '' }: { className?: string }) {
  const on = useSound()
  useEffect(() => {
    if (!wantSound() || on) return
    const go = () => setSound(true)
    window.addEventListener('pointerdown', go, { once: true })
    return () => window.removeEventListener('pointerdown', go)
  }, [on])
  return (
    <button className={`btn small glass sound ${className}`} aria-pressed={on} onClick={(e) => { e.stopPropagation(); setSound(!on) }} data-testid="sound">
      {on ? 'צליל הים: פועל' : 'צליל הים'}
    </button>
  )
}
