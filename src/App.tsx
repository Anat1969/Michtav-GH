import { useEffect } from 'react'
import { TopBar } from './components/TopBar'
import { useRoute } from './logic/route'
import { useSession } from './logic/auth'
import { loadCloud } from './logic/store'
import { Home } from './pages/Home'
import { Write } from './pages/Write'
import { Letters } from './pages/Letters'
import { Open } from './pages/Open'
import { Method } from './pages/Method'

const TITLES: Record<string, string> = { home: 'מכתב לעצמי בעוד שנה', write: 'כתיבה', letters: 'המכתבים שלי', open: 'יום הפתיחה', method: 'השיטה' }

export function App() {
  const route = useRoute()
  const session = useSession()
  useEffect(() => { loadCloud(!!session) }, [session?.user.id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { document.title = route.name === 'home' ? TITLES.home : `${TITLES[route.name]} · מכתב לעצמי` }, [route.name])
  return (
    <>
      <TopBar route={route} />
      {route.name === 'home' && <Home />}
      {route.name === 'write' && <Write />}
      {route.name === 'letters' && <Letters />}
      {route.name === 'open' && route.id && <Open id={route.id} key={route.id} />}
      {route.name === 'method' && <Method />}
    </>
  )
}
