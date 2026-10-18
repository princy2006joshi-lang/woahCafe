import { useEffect, useState } from 'react'
import api from './axiosCalls/axios.js'

export default function App() {
  const [health, setHealth] = useState({
    state: 'loading',
    message: 'Checking the café service…',
  })

  useEffect(() => {
    const controller = new AbortController()
    let retryTimeout

    const checkHealth = async () => {
      try {
        const { data } = await api.get('/api/health', { signal: controller.signal })
        if (data.status !== 'ok' && data.status !== 'degraded') {
          throw new Error('The API returned an unexpected health response.')
        }

        const connected = data.status === 'ok' && data.database === 'connected'
        setHealth({
          state: connected ? 'connected' : 'disconnected',
          message: connected
            ? 'Café service and database are ready.'
            : 'Café service is running; the database is not connected.',
        })

        if (!connected) retryTimeout = setTimeout(checkHealth, 5000)
      } catch (error) {
        if (controller.signal.aborted) return
        setHealth({
          state: 'error',
          message: error.response?.data?.message || error.message,
        })

        retryTimeout = setTimeout(checkHealth, 5000)
      }
    }

    checkHealth()

    return () => {
      controller.abort()
      clearTimeout(retryTimeout)
    }
  }, [])

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Woah Cafe home">
          <span className="brand-mark" aria-hidden="true">W</span>
          <span>woah cafe</span>
        </a>
        <span className="campus-label">MADE FOR CAMPUS</span>
      </header>

      <section className="welcome" aria-labelledby="welcome-title">
        <p className="eyebrow">YOUR CAMPUS CAFÉ</p>
        <h1 id="welcome-title">Good food, right around the corner.</h1>
        <p className="welcome-copy">
          A simpler way to order from the café and keep track of your pickup.
        </p>

        <aside className={`service-card service-card--${health.state}`} aria-live="polite">
          <span className="service-indicator" aria-hidden="true" />
          <div>
            <p className="service-title">Café service</p>
            <p className="service-message">{health.message}</p>
          </div>
        </aside>
      </section>

      <footer className="footer">Good things are brewing.</footer>
    </main>
  )
}
