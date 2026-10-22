import { useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import api from './axiosCalls/axios.js'

function ServiceStatus({ health }) {
  return (
    <aside className={`service-card service-card--${health.state}`} aria-live="polite">
      <span className="service-indicator" aria-hidden="true" />
      <div>
        <p className="service-title">Café service</p>
        <p className="service-message">{health.message}</p>
      </div>
    </aside>
  )
}

function AuthForm({ mode, onLogin, onRegister, initialError }) {
  const isRegistration = mode === 'register'
  const isKitchenLogin = mode === 'kitchen'
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState(initialError || '')
  const [submitting, setSubmitting] = useState(false)
  const title = isRegistration ? 'Create your student account' : isKitchenLogin ? 'Kitchen staff login' : 'Welcome back'

  useEffect(() => {
    setError(initialError || '')
  }, [initialError])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      if (isRegistration) {
        await onRegister(form)
      } else {
        await onLogin(form.email, form.password, isKitchenLogin ? 'kitchen' : 'student')
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Sign-in failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="auth-card" aria-labelledby="auth-title">
      <p className="eyebrow">{isKitchenLogin ? 'STAFF ACCESS' : 'CAMPUS CAFÉ'}</p>
      <h1 className="auth-title" id="auth-title">{title}</h1>
      <p className="auth-copy">
        {isRegistration
          ? 'Register with your Scaler student email to get started.'
          : isKitchenLogin
            ? 'Sign in with the private kitchen account.'
            : 'Sign in to your Woah Cafe account.'}
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        {isRegistration && (
          <label>
            Full name
            <input
              autoComplete="name"
              maxLength={100}
              name="name"
              onChange={updateField}
              required
              value={form.name}
            />
          </label>
        )}
        <label>
          Email address
          <input
            autoComplete="username"
            name="email"
            onChange={updateField}
            placeholder={isKitchenLogin ? 'Kitchen account email' : 'you@sst.scaler.com'}
            required
            type="email"
            value={form.email}
          />
        </label>
        {isRegistration && (
          <label>
            Phone number
            <input
              autoComplete="tel"
              maxLength={30}
              name="phone"
              onChange={updateField}
              required
              type="tel"
              value={form.phone}
            />
          </label>
        )}
        <label>
          Password
          <input
            autoComplete={isRegistration ? 'new-password' : 'current-password'}
            minLength={isRegistration ? 8 : undefined}
            name="password"
            onChange={updateField}
            required
            type="password"
            value={form.password}
          />
        </label>
        {isRegistration && (
          <p className="form-hint">Use an email address ending in @sst.scaler.com. Passwords must be at least 8 characters.</p>
        )}

        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" disabled={submitting} type="submit">
          {submitting ? 'Please wait…' : isRegistration ? 'Create account' : 'Sign in'}
        </button>
      </form>

      <div className="auth-links">
        {isRegistration ? (
          <p>Already registered? <Link to="/login">Sign in</Link></p>
        ) : isKitchenLogin ? (
          <p><Link to="/login">Student sign in</Link></p>
        ) : (
          <>
            <p>New to Woah Cafe? <Link to="/register">Create a student account</Link></p>
            <p><Link to="/kitchen/login">Kitchen staff sign in</Link></p>
          </>
        )}
      </div>
    </section>
  )
}

function HomePage({ user, health, onLogout, loggingOut, logoutError }) {
  return (
    <section className="welcome" aria-labelledby="welcome-title">
      <p className="eyebrow">{user ? user.role === 'kitchen' ? 'KITCHEN STAFF' : 'YOUR CAMPUS CAFÉ' : 'YOUR CAMPUS CAFÉ'}</p>
      <h1 id="welcome-title">
        {user ? `Welcome, ${user.name}.` : 'Good food, right around the corner.'}
      </h1>
      <p className="welcome-copy">
        {user
          ? user.role === 'kitchen'
            ? 'You are signed in with your kitchen staff account.'
            : 'Your student account is ready. You are signed in to Woah Cafe.'
          : 'A simpler way to order from the café and keep track of your pickup.'}
      </p>

      {user ? (
        <div className="account-card">
          <div>
            <p className="account-label">SIGNED IN AS</p>
            <p className="account-name">{user.name}</p>
            <p className="account-detail">{user.email}</p>
            {user.phone && <p className="account-detail">{user.phone}</p>}
          </div>
          <span className="role-badge">{user.role === 'kitchen' ? 'Kitchen staff' : 'Student'}</span>
          {logoutError && <p className="form-error" role="alert">{logoutError}</p>}
          <button className="secondary-button" disabled={loggingOut} onClick={onLogout} type="button">
            {loggingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      ) : (
        <div className="welcome-actions">
          <Link className="primary-button button-link" to="/login">Sign in</Link>
          <Link className="secondary-button button-link" to="/register">Create student account</Link>
        </div>
      )}

      <ServiceStatus health={health} />
    </section>
  )
}

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [sessionError, setSessionError] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const [health, setHealth] = useState({
    state: 'loading',
    message: 'Checking the café service…',
  })

  useEffect(() => {
    const controller = new AbortController()
    let retryTimeout

    async function checkHealth() {
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

  useEffect(() => {
    const controller = new AbortController()

    api.get('/api/auth/me', { signal: controller.signal })
      .then(({ data }) => {
        setUser(data.user)
        setSessionError('')
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        setUser(null)
        if (error.response?.status !== 401) {
          setSessionError(error.response?.data?.message || 'Could not check your sign-in status.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setSessionLoading(false)
      })

    return () => controller.abort()
  }, [])

  async function handleLogin(email, password, expectedRole) {
    const { data } = await api.post('/api/auth/login', { email, password })
    if (data.user.role !== expectedRole) {
      try {
        await api.post('/api/auth/logout')
      } catch {
        setUser(data.user)
        setLogoutError('This account does not have the requested access. Sign out from your account page to clear this session.')
        navigate('/')
        return
      }
      throw new Error(expectedRole === 'kitchen'
        ? 'This account does not have kitchen staff access.'
        : 'Use the kitchen staff sign-in page for this account.')
    }
    setUser(data.user)
    setSessionError('')
    navigate('/')
  }

  async function handleRegister(form) {
    const { data } = await api.post('/api/auth/register', form)
    setUser(data.user)
    setSessionError('')
    navigate('/')
  }

  async function handleLogout() {
    setLoggingOut(true)
    setLogoutError('')
    try {
      await api.post('/api/auth/logout')
      setUser(null)
      navigate('/login')
    } catch (error) {
      setLogoutError(error.response?.data?.message || 'Could not sign out. Please try again.')
    } finally {
      setLoggingOut(false)
    }
  }

  const isAuthRoute = ['/login', '/register', '/kitchen/login'].includes(location.pathname)

  return (
    <main className="page-shell">
      <header className="topbar">
        <Link className="brand" to="/" aria-label="Woah Cafe home">
          <span className="brand-mark" aria-hidden="true">W</span>
          <span>woah cafe</span>
        </Link>
        <span className="campus-label">MADE FOR CAMPUS</span>
      </header>

      {sessionLoading ? (
        <section className="welcome" aria-live="polite">
          <p className="eyebrow">YOUR CAMPUS CAFÉ</p>
          <p className="welcome-copy">Checking your sign-in status…</p>
        </section>
      ) : (
        <>
          {sessionError && <p className="session-error" role="alert">{sessionError}</p>}
          <Routes>
            <Route
              path="/"
              element={(
                <HomePage
                  health={health}
                  loggingOut={loggingOut}
                  logoutError={logoutError}
                  onLogout={handleLogout}
                  user={user}
                />
              )}
            />
            <Route
              path="/login"
              element={user ? <Navigate to="/" replace /> : (
                <AuthForm initialError={sessionError} mode="login" onLogin={handleLogin} />
              )}
            />
            <Route
              path="/register"
              element={user ? <Navigate to="/" replace /> : (
                <AuthForm initialError={sessionError} mode="register" onRegister={handleRegister} />
              )}
            />
            <Route
              path="/kitchen/login"
              element={user ? <Navigate to="/" replace /> : (
                <AuthForm initialError={sessionError} mode="kitchen" onLogin={handleLogin} />
              )}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </>
      )}

      {!isAuthRoute && <footer className="footer">Good things are brewing.</footer>}
    </main>
  )
}
