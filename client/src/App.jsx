import { useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import api from './axiosCalls/axios.js'
import { clearSavedCart, loadSavedCart, saveCart } from './cartStorage.js'

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

function MenuItemEditor({ initialItem, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    name: initialItem?.name || '',
    description: initialItem?.description || '',
    price: initialItem?.price ?? '',
    category: initialItem?.category || '',
    imageUrl: initialItem?.imageUrl || '',
    available: initialItem?.available ?? true,
  })

  function updateField(event) {
    const { name, value, type, checked } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  function submit(event) {
    event.preventDefault()
    onSave({
      ...form,
      price: Number(form.price),
    })
  }

  return (
    <form className="menu-editor" onSubmit={submit}>
      <div className="menu-editor-heading">
        <h2>{initialItem ? 'Edit menu item' : 'Add a menu item'}</h2>
        {initialItem && (
          <button className="text-button" onClick={onCancel} type="button">Cancel</button>
        )}
      </div>
      <div className="menu-editor-grid">
        <label>
          Item name
          <input autoComplete="off" maxLength={100} name="name" onChange={updateField} required value={form.name} />
        </label>
        <label>
          Category
          <input autoComplete="off" maxLength={60} name="category" onChange={updateField} required value={form.category} />
        </label>
        <label>
          Price
          <input
            min="0.01"
            name="price"
            onChange={updateField}
            required
            step="0.01"
            type="number"
            value={form.price}
          />
        </label>
        <label className="menu-editor-wide">
          Description
          <textarea maxLength={500} name="description" onChange={updateField} rows="3" value={form.description} />
        </label>
        <label className="menu-editor-wide">
          Image URL <span className="optional-label">Optional</span>
          <input
            autoComplete="url"
            maxLength={2048}
            name="imageUrl"
            onChange={updateField}
            placeholder="https://example.com/item.jpg"
            type="url"
            value={form.imageUrl}
          />
        </label>
        <label className="availability-check">
          <input checked={form.available} name="available" onChange={updateField} type="checkbox" />
          Available to students
        </label>
      </div>
      <button className="primary-button" disabled={saving} type="submit">
        {saving ? 'Saving…' : initialItem ? 'Save changes' : 'Add item'}
      </button>
    </form>
  )
}

function MenuItemImage({ item }) {
  const [failed, setFailed] = useState(false)

  if (!item.imageUrl || failed) {
    return (
      <div className="menu-item-image menu-item-image--empty" aria-hidden="true">
        <span>woah café</span>
      </div>
    )
  }

  return (
    <img
      className="menu-item-image"
      src={item.imageUrl}
      alt={item.name}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}

function MenuPage({ mode, cart, onAddToCart, onUpdateCartQuantity }) {
  const isKitchen = mode === 'kitchen'
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editingId, setEditingId] = useState('')
  const [saving, setSaving] = useState(false)
  const [pendingId, setPendingId] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const endpoint = isKitchen ? '/api/kitchen/menu' : '/api/menu'

    api.get(endpoint, { signal: controller.signal })
      .then(({ data }) => {
        setItems(data.items)
        setError('')
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setError(requestError.response?.data?.message || 'Could not load menu items.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [isKitchen])

  async function saveItem(fields) {
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const editingItem = items.find((item) => item._id === editingId)
      const response = editingItem
        ? await api.patch(`/api/kitchen/menu/${editingId}`, fields)
        : await api.post('/api/kitchen/menu', fields)
      const savedItem = response.data.item

      setItems((current) => editingItem
        ? current.map((item) => item._id === savedItem._id ? savedItem : item)
        : [...current, savedItem].sort((first, second) => (
          first.category.localeCompare(second.category) || first.name.localeCompare(second.name)
        )))
      setEditingId('')
      setNotice(editingItem ? 'Menu item updated.' : 'Menu item added.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save this menu item.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleAvailability(item) {
    setPendingId(item._id)
    setError('')
    setNotice('')
    try {
      const { data } = await api.patch(`/api/kitchen/menu/${item._id}`, { available: !item.available })
      setItems((current) => current.map((entry) => entry._id === item._id ? data.item : entry))
      setNotice(`${item.name} is now ${data.item.available ? 'available' : 'unavailable'}.`)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update availability.')
    } finally {
      setPendingId('')
    }
  }

  async function deleteItem(item) {
    if (!window.confirm(`Remove "${item.name}" from the menu? Existing orders will not be affected.`)) return

    setPendingId(item._id)
    setError('')
    setNotice('')
    try {
      await api.delete(`/api/kitchen/menu/${item._id}`)
      setItems((current) => current.filter((entry) => entry._id !== item._id))
      if (editingId === item._id) setEditingId('')
      setNotice(`${item.name} was removed from the menu.`)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not remove this menu item.')
    } finally {
      setPendingId('')
    }
  }

  return (
    <section className="menu-page">
      <div className="menu-page-heading">
        <div>
          <p className="eyebrow">{isKitchen ? 'MENU MANAGEMENT' : 'MADE FRESH ON CAMPUS'}</p>
          <h1 className="menu-page-title">{isKitchen ? 'Menu availability' : 'Today’s menu'}</h1>
          <p className="menu-page-copy">
            {isKitchen
              ? 'Add items, update details and control what students can order.'
              : 'Browse the items currently available at your campus café.'}
          </p>
        </div>
        <Link className="secondary-button" to="/">Back to home</Link>
      </div>

      {isKitchen && (
        <MenuItemEditor
          key={editingId || 'new'}
          initialItem={items.find((item) => item._id === editingId)}
          onCancel={() => setEditingId('')}
          onSave={saveItem}
          saving={saving}
        />
      )}

      {error && <p className="form-error menu-feedback" role="alert">{error}</p>}
      {notice && <p className="menu-notice menu-feedback" role="status">{notice}</p>}
      {loading ? (
        <p className="menu-empty" aria-live="polite">Loading menu…</p>
      ) : items.length === 0 ? (
        <p className="menu-empty">
          {isKitchen ? 'No menu items yet. Add an item using the form above.' : 'There are no available menu items right now.'}
        </p>
      ) : (
        <div className="menu-grid">
          {items.map((item) => (
            <article className={`menu-item${item.available ? '' : ' menu-item--unavailable'}`} key={item._id}>
              <MenuItemImage item={item} />
              <div className="menu-item-content">
                <div className="menu-item-title-row">
                  <div>
                    <p className="menu-item-category">{item.category}</p>
                    <h2>{item.name}</h2>
                  </div>
                  <p className="menu-item-price">₹{Number(item.price).toFixed(2)}</p>
                </div>
                {item.description && <p className="menu-item-description">{item.description}</p>}
                {!isKitchen && (
                  cart[item._id] ? (
                    <div className="menu-cart-control">
                      <span className="menu-cart-label">In your cart</span>
                      <div className="quantity-control" aria-label={`Cart quantity for ${item.name}`}>
                        <button
                          aria-label={`Remove one ${item.name}`}
                          onClick={() => onUpdateCartQuantity(item._id, cart[item._id].quantity - 1)}
                          type="button"
                        >−</button>
                        <span aria-live="polite">{cart[item._id].quantity}</span>
                        <button
                          aria-label={`Add one ${item.name}`}
                          disabled={cart[item._id].quantity >= 50}
                          onClick={() => onUpdateCartQuantity(item._id, cart[item._id].quantity + 1)}
                          type="button"
                        >+</button>
                      </div>
                    </div>
                  ) : (
                    <button className="primary-button menu-add-button" onClick={() => onAddToCart(item)} type="button">
                      Add to cart
                    </button>
                  )
                )}
                {isKitchen && (
                  <div className="menu-item-actions">
                    <span className={`availability-badge${item.available ? ' availability-badge--on' : ''}`}>
                      {item.available ? 'Available' : 'Unavailable'}
                    </span>
                    <button
                      className="text-button"
                      disabled={pendingId === item._id}
                      onClick={() => setEditingId(item._id)}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="text-button"
                      disabled={pendingId === item._id}
                      onClick={() => toggleAvailability(item)}
                      type="button"
                    >
                      {item.available ? 'Mark unavailable' : 'Make available'}
                    </button>
                    <button
                      className="text-button text-button--danger"
                      disabled={pendingId === item._id}
                      onClick={() => deleteItem(item)}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function CartPage({ cart, onUpdateQuantity, onRemoveItem, onClearCart }) {
  const navigate = useNavigate()
  const [paymentMethod, setPaymentMethod] = useState('counter')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const entries = Object.values(cart)
  const total = entries.reduce((sum, entry) => sum + entry.item.price * entry.quantity, 0)

  async function placeOrder(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const { data } = await api.post('/api/orders', {
        items: entries.map(({ item, quantity }) => ({ menuItemId: item._id, quantity })),
        paymentMethod,
      })
      onClearCart()
      navigate(`/orders/${encodeURIComponent(data.order.orderId)}`)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not place your order. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="menu-page">
      <div className="menu-page-heading">
        <div>
          <p className="eyebrow">READY WHEN YOU ARE</p>
          <h1 className="menu-page-title">Your cart</h1>
          <p className="menu-page-copy">Review your items and choose how you’ll pay.</p>
        </div>
        <Link className="secondary-button" to="/menu">Back to menu</Link>
      </div>

      {entries.length === 0 ? (
        <div className="menu-empty">
          Your cart is empty. <Link to="/menu">Browse the menu</Link> to add something.
        </div>
      ) : (
        <div className="checkout-layout">
          <div className="cart-items">
            {entries.map(({ item, quantity }) => (
              <article className="cart-row" key={item._id}>
                <div className="cart-item-summary">
                  <h2>{item.name}</h2>
                  <p>₹{Number(item.price).toFixed(2)} each</p>
                </div>
                <div className="quantity-control" aria-label={`Quantity for ${item.name}`}>
                  <button
                    aria-label={`Decrease ${item.name} quantity`}
                    disabled={quantity <= 1}
                    onClick={() => onUpdateQuantity(item._id, quantity - 1)}
                    type="button"
                  >−</button>
                  <span>{quantity}</span>
                  <button
                    aria-label={`Increase ${item.name} quantity`}
                    disabled={quantity >= 50}
                    onClick={() => onUpdateQuantity(item._id, quantity + 1)}
                    type="button"
                  >+</button>
                </div>
                <p className="cart-line-total">₹{(item.price * quantity).toFixed(2)}</p>
                <button className="text-button text-button--danger cart-remove" onClick={() => onRemoveItem(item._id)} type="button">
                  Remove
                </button>
              </article>
            ))}
          </div>

          <form className="checkout-card" onSubmit={placeOrder}>
            <h2>Payment</h2>
            <label className="payment-option">
              <input
                checked={paymentMethod === 'counter'}
                name="paymentMethod"
                onChange={() => setPaymentMethod('counter')}
                type="radio"
                value="counter"
              />
              <span>
                <strong>Pay at the café</strong>
                <small>Pay at the counter when you pick up your order.</small>
              </span>
            </label>
            <p className="payment-note">Online payment is not available yet.</p>
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="cart-total">
              <span>Total</span>
              <strong>₹{total.toFixed(2)}</strong>
            </div>
            <button className="primary-button" disabled={submitting} type="submit">
              {submitting ? 'Placing order…' : 'Place order'}
            </button>
          </form>
        </div>
      )}
    </section>
  )
}

function OrderConfirmationPage() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    api.get(`/api/orders/${encodeURIComponent(orderId)}`, { signal: controller.signal })
      .then(({ data }) => setOrder(data.order))
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setError(requestError.response?.data?.message || 'Could not load this order.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [orderId])

  return (
    <section className="menu-page">
      <div className="order-confirmation">
        <p className="eyebrow">ORDER CONFIRMATION</p>
        {loading ? (
          <p className="menu-empty" aria-live="polite">Loading your order…</p>
        ) : error ? (
          <p className="form-error" role="alert">{error}</p>
        ) : order && (
          <>
            <h1 className="menu-page-title">Order received.</h1>
            <p className="menu-page-copy">Keep this page handy while the café prepares your order.</p>
            <div className="order-summary-card">
              <p className="account-label">ORDER REFERENCE</p>
              <p className="order-reference">{order.orderId}</p>
              <div className="order-summary-lines">
                {order.items.map((item) => (
                  <div className="order-summary-line" key={`${item.name}-${item.menuItem}`}>
                    <span>{item.quantity} × {item.name}</span>
                    <span>₹{(item.quantity * item.priceAtOrder).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="cart-total">
                <span>Total</span>
                <strong>₹{Number(order.total).toFixed(2)}</strong>
              </div>
              <div className="payment-summary">
                <span>Payment</span>
                <span>Pay at the café · {order.paymentStatus === 'paid' ? 'Paid' : 'Due at pickup'}</span>
              </div>
              <div className="payment-summary">
                <span>Preparation</span>
                <span>{order.status}</span>
              </div>
            </div>
            <Link className="primary-button button-link" to="/menu">Back to menu</Link>
          </>
        )}
      </div>
    </section>
  )
}

function KitchenPaymentsPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [pendingId, setPendingId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    api.get('/api/kitchen/payments/counter', { signal: controller.signal })
      .then(({ data }) => setOrders(data.orders))
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setError(requestError.response?.data?.message || 'Could not load counter payments.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [])

  async function recordPayment(order) {
    setPendingId(order.orderId)
    setError('')
    setNotice('')
    try {
      await api.patch(`/api/kitchen/orders/${encodeURIComponent(order.orderId)}/payment`)
      setOrders((current) => current.filter((entry) => entry.orderId !== order.orderId))
      setNotice(`Counter payment recorded for order ${order.orderId}.`)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not record counter payment.')
    } finally {
      setPendingId('')
    }
  }

  return (
    <section className="menu-page">
      <div className="menu-page-heading">
        <div>
          <p className="eyebrow">KITCHEN STAFF</p>
          <h1 className="menu-page-title">Counter payments</h1>
          <p className="menu-page-copy">Record payment only after it has been received at the café counter.</p>
        </div>
        <Link className="secondary-button" to="/">Back to home</Link>
      </div>
      {error && <p className="form-error menu-feedback" role="alert">{error}</p>}
      {notice && <p className="menu-notice menu-feedback" role="status">{notice}</p>}
      {loading ? (
        <p className="menu-empty" aria-live="polite">Loading unpaid orders…</p>
      ) : orders.length === 0 ? (
        <p className="menu-empty">There are no unpaid counter orders.</p>
      ) : (
        <div className="payment-order-list">
          {orders.map((order) => (
            <article className="payment-order-card" key={order.orderId}>
              <div className="payment-order-heading">
                <div>
                  <p className="account-label">ORDER REFERENCE</p>
                  <h2>{order.orderId}</h2>
                </div>
                <strong>₹{Number(order.total).toFixed(2)}</strong>
              </div>
              <p className="payment-student">{order.studentName} · {order.studentPhone}</p>
              <ul className="payment-order-items">
                {order.items.map((item) => (
                  <li key={`${item.name}-${item.menuItem}`}>
                    <span>{item.quantity} × {item.name}</span>
                    <span>₹{(item.quantity * item.priceAtOrder).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <button
                className="primary-button"
                disabled={pendingId === order.orderId}
                onClick={() => recordPayment(order)}
                type="button"
              >
                {pendingId === order.orderId ? 'Recording…' : 'Record payment received'}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function HomePage({ user, health, onLogout, loggingOut, logoutError, cartCount }) {
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
        <>
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
          {user.role === 'kitchen' ? (
            <div className="welcome-actions">
              <Link className="primary-button button-link" to="/kitchen/menu">Manage menu</Link>
              <Link className="secondary-button button-link" to="/kitchen/payments">Counter payments</Link>
            </div>
          ) : (
            <div className="welcome-actions">
              <Link className="primary-button button-link" to="/menu">Browse menu</Link>
              <Link className="secondary-button button-link" to="/cart">
                Cart{cartCount > 0 ? ` (${cartCount})` : ''}
              </Link>
            </div>
          )}
        </>
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
  const [cart, setCart] = useState({})
  const [cartOwnerId, setCartOwnerId] = useState('')
  const [cartStorageReady, setCartStorageReady] = useState(false)
  const [cartError, setCartError] = useState('')
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
    if (sessionLoading || user?.role !== 'student' || !user.id) {
      setCart({})
      setCartOwnerId('')
      setCartStorageReady(false)
      return
    }

    try {
      const savedCart = loadSavedCart(user.id, window.localStorage)
      setCart(savedCart)
      setCartOwnerId(user.id)
      setCartStorageReady(true)
      setCartError('')
    } catch (error) {
      setCart({})
      setCartOwnerId(user.id)
      setCartStorageReady(false)
      setCartError(error.message || 'Could not load your saved cart.')
    }
  }, [sessionLoading, user?.id, user?.role])

  useEffect(() => {
    if (
      sessionLoading
      || user?.role !== 'student'
      || !user.id
      || cartOwnerId !== user.id
      || !cartStorageReady
    ) return

    try {
      saveCart(user.id, cart, window.localStorage)
      setCartError('')
    } catch {
      setCartError('Could not save your cart in this browser. Check your browser storage settings.')
    }
  }, [cart, cartOwnerId, cartStorageReady, sessionLoading, user?.id, user?.role])

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
      setCart({})
      setCartOwnerId('')
      setCartStorageReady(false)
      navigate('/login')
    } catch (error) {
      setLogoutError(error.response?.data?.message || 'Could not sign out. Please try again.')
    } finally {
      setLoggingOut(false)
    }
  }

  function addToCart(item) {
    setCart((current) => {
      const existing = current[item._id]
      const quantity = existing ? Math.min(existing.quantity + 1, 50) : 1
      return { ...current, [item._id]: { item, quantity } }
    })
  }

  function updateCartQuantity(itemId, quantity) {
    setCart((current) => {
      if (!current[itemId]) return current
      if (quantity < 1) {
        const next = { ...current }
        delete next[itemId]
        return next
      }
      return { ...current, [itemId]: { ...current[itemId], quantity: Math.min(quantity, 50) } }
    })
  }

  function removeCartItem(itemId) {
    setCart((current) => {
      const next = { ...current }
      delete next[itemId]
      return next
    })
  }

  function discardSavedCart() {
    if (!user?.id) return
    try {
      clearSavedCart(user.id, window.localStorage)
      setCart({})
      setCartStorageReady(true)
      setCartError('')
    } catch {
      setCartError('Could not clear your saved cart from this browser.')
    }
  }

  const cartCount = Object.values(cart).reduce((sum, entry) => sum + entry.quantity, 0)
  const isAuthRoute = ['/login', '/register', '/kitchen/login'].includes(location.pathname)

  return (
    <main className="page-shell">
      <header className="topbar">
        <Link className="brand" to="/" aria-label="Woah Cafe home">
          <span className="brand-mark" aria-hidden="true">W</span>
          <span>woah cafe</span>
        </Link>
        <div className="topbar-actions">
          {user?.role === 'student' && (
            <Link className="topbar-cart" to="/cart" aria-label={`Cart with ${cartCount} items`}>
              Cart{cartCount > 0 ? ` (${cartCount})` : ''}
            </Link>
          )}
          <span className="campus-label">MADE FOR CAMPUS</span>
        </div>
      </header>

      {sessionLoading ? (
        <section className="welcome" aria-live="polite">
          <p className="eyebrow">YOUR CAMPUS CAFÉ</p>
          <p className="welcome-copy">Checking your sign-in status…</p>
        </section>
      ) : (
        <>
          {sessionError && <p className="session-error" role="alert">{sessionError}</p>}
          {cartError && user?.role === 'student' && (
            <p className="session-error cart-storage-error" role="alert">
              {cartError}
              <button className="text-button" onClick={discardSavedCart} type="button">Clear saved cart</button>
            </p>
          )}
          <Routes>
            <Route
              path="/"
              element={(
                <HomePage
                  health={health}
                  loggingOut={loggingOut}
                  logoutError={logoutError}
                  onLogout={handleLogout}
                  cartCount={cartCount}
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
            <Route
              path="/menu"
              element={user?.role === 'student'
                ? cartOwnerId === user.id ? (
                  <MenuPage
                    cart={cart}
                    mode="student"
                    onAddToCart={addToCart}
                    onUpdateCartQuantity={updateCartQuantity}
                  />
                ) : <p className="welcome-copy" aria-live="polite">Loading your saved cart…</p>
                : <Navigate to={user ? '/' : '/login'} replace />}
            />
            <Route
              path="/cart"
              element={user?.role === 'student' ? cartOwnerId === user.id ? (
                <CartPage
                  cart={cart}
                  onClearCart={() => setCart({})}
                  onRemoveItem={removeCartItem}
                  onUpdateQuantity={updateCartQuantity}
                />
              ) : <p className="welcome-copy" aria-live="polite">Loading your saved cart…</p> : <Navigate to={user ? '/' : '/login'} replace />}
            />
            <Route
              path="/orders/:orderId"
              element={user?.role === 'student' ? <OrderConfirmationPage /> : <Navigate to={user ? '/' : '/login'} replace />}
            />
            <Route
              path="/kitchen/menu"
              element={user?.role === 'kitchen' ? <MenuPage mode="kitchen" /> : <Navigate to={user ? '/' : '/kitchen/login'} replace />}
            />
            <Route
              path="/kitchen/payments"
              element={user?.role === 'kitchen' ? <KitchenPaymentsPage /> : <Navigate to={user ? '/' : '/kitchen/login'} replace />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </>
      )}

      {!isAuthRoute && <footer className="footer">Good things are brewing.</footer>}
    </main>
  )
}
