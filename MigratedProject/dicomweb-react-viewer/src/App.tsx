import { useEffect, useState } from 'react'
import { initCornerstone } from './lib/cornerstone'
import Shell from './components/Shell'

export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    initCornerstone()
      .then(() => setReady(true))
      .catch((err) => console.error('Cornerstone init failed:', err))
  }, [])

  if (!ready) {
    return <div data-testid="app-loading">Initialising…</div>
  }

  return <Shell />
}
