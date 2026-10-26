import { useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import api from './axiosCalls/axios.js'
import { clearSavedCart, loadSavedCart, saveCart } from './cartStorage.js'

let razorpayScriptPromise

function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve()
  if (razorpayScriptPromise) return razorpayScriptPromise

  razorpayScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = resolve
    script.onerror = () => {
      script.remove()
      razorpayScriptPromise = null
      reject(new Error('Could not load Razorpay Checkout. Check your connection and try again.'))
    }
    document.head.appendChild(script)
  })
  return razorpayScriptPromise
}

function openRazorpayCheckout({ order, payment, user, onSuccess, onFailure, onDismiss }) {
  const checkout = new window.Razorpay({
    key: payment.keyId,
    amount: payment.amount,
    currency: payment.currency,
    name: 'Woah Cafe',
    description: `Order ${order.orderId}`,
    order_id: payment.orderId,
    prefill: {
      name: user.name,
      email: user.email,
      contact: user.phone,
    },
    handler: onSuccess,
    modal: { ondismiss: onDismiss },
  })
  checkout.on('payment.failed', onFailure)
  checkout.open()
}

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
      <aside className="auth-illustration" aria-hidden="true">
        <span className="auth-stamp">WOAH CAFÉ · CAMPUS COUNTER</span>
        <img src="https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=85" alt="" />
        <div className="auth-illustration-note">
          <span>GOOD BREAKS START HERE</span>
          <strong>A little good<br />in the middle<br />of your day.</strong>
        </div>
        <span className="auth-illustration-index">NO. 01 / OPEN DAILY</span>
      </aside>
      <div className="auth-content">
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

const categoryPhotoIds = {
  burgers: ['photo-1568901346375-23c9450c58cd', 'photo-1550547660-d9450f859349'],
  sandwiches: ['photo-1528735602780-2552fd46c7af', 'photo-1509722747041-616f39b57569'],
  beverages: ['photo-1509042239860-f550ce710b93', 'photo-1461023058943-07fcbe16d735'],
  maggis: ['photo-1569718212165-3a8278d5f624', 'photo-1585032226651-759b368d7246'],
  rolls: ['photo-1626700051175-6818013e1d4f', 'photo-1551504734-5ee1c4a1479b'],
  omelettes: ['photo-1525351484163-7529414344d8', 'photo-1510693206972-df098062cb71'],
}

function MenuItemImage({ item }) {
  const categoryKey = item.category.toLowerCase().includes('sandwich') ? 'sandwiches'
    : item.category.toLowerCase().includes('beverage') ? 'beverages'
      : item.category.toLowerCase().includes('maggi') ? 'maggis'
        : item.category.toLowerCase().includes('roll') ? 'rolls'
          : item.category.toLowerCase().includes('omelette') ? 'omelettes'
            : 'burgers'
  const nameSeed = [...item.name].reduce((seed, character) => seed + character.charCodeAt(0), 0)
  const fallbackPhoto = categoryPhotoIds[categoryKey][nameSeed % categoryPhotoIds[categoryKey].length]
  const imageSources = [
    item.imageUrl,
    `https://images.unsplash.com/${fallbackPhoto}?auto=format&fit=crop&w=960&q=82`,
    `/menu-art/${categoryKey}.svg`,
  ].filter((source, index, sources) => source && sources.indexOf(source) === index)
  const [sourceIndex, setSourceIndex] = useState(0)

  useEffect(() => {
    setSourceIndex(0)
  }, [item._id, item.category, item.imageUrl])

  if (sourceIndex >= imageSources.length) {
    return (
      <div className={`menu-item-image menu-item-image--empty menu-item-art--${categoryKey}`} aria-hidden="true">
        <span>{item.category}</span>
      </div>
    )
  }

  return (
    <img
      className={`menu-item-image menu-item-art--${categoryKey}`}
      src={imageSources[sourceIndex]}
      alt={item.name}
      loading="lazy"
      onError={() => setSourceIndex((index) => index + 1)}
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
  const [activeCategory, setActiveCategory] = useState('all')

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

  const categories = [...new Set(items.map((item) => item.category))].sort((left, right) => left.localeCompare(right))
  const visibleItems = items.filter((item) => (
    (activeCategory === 'all' || item.category === activeCategory)
    && (isKitchen || item.available)
  ))

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
      {categories.length > 0 && (
        <div className="menu-browse-tools">
          <div className="menu-category-bar" aria-label="Filter menu by category" role="group">
            <button
              aria-pressed={activeCategory === 'all'}
              className={`category-filter${activeCategory === 'all' ? ' category-filter--active' : ''}`}
              onClick={() => setActiveCategory('all')}
              type="button"
            >
              All dishes <span>{items.filter((item) => isKitchen || item.available).length}</span>
            </button>
            {categories.map((category) => {
              const count = items.filter((item) => item.category === category && (isKitchen || item.available)).length
              return (
                <button
                  aria-pressed={activeCategory === category}
                  className={`category-filter${activeCategory === category ? ' category-filter--active' : ''}`}
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  type="button"
                >
                  {category} <span>{count}</span>
                </button>
              )
            })}
          </div>
          <p className="menu-result-count">
            <span>{String(visibleItems.length).padStart(2, '0')}</span> {visibleItems.length === 1 ? 'dish' : 'dishes'} on the {isKitchen ? 'menu' : 'counter'}
          </p>
        </div>
      )}
      {loading ? (
        <p className="menu-empty" aria-live="polite">Loading menu…</p>
      ) : items.length === 0 ? (
        <p className="menu-empty">
          {isKitchen ? 'No menu items yet. Add an item using the form above.' : 'There are no available menu items right now.'}
        </p>
      ) : visibleItems.length === 0 ? (
        <p className="menu-empty">No dishes in this category right now.</p>
      ) : (
        <div className="menu-grid">
          {visibleItems.map((item) => (
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

function CartPage({ cart, user, onUpdateQuantity, onRemoveItem, onClearCart }) {
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
      const orderPath = `/orders/${encodeURIComponent(data.order.orderId)}`
      if (!data.payment) {
        navigate(orderPath)
        return
      }
      try {
        await loadRazorpayScript()
        openRazorpayCheckout({
          order: data.order,
          payment: data.payment,
          user,
          onSuccess: async (paymentResponse) => {
            try {
              await api.post(`/api/orders/${encodeURIComponent(data.order.orderId)}/payments/verify`, {
                paymentId: paymentResponse.razorpay_payment_id,
                signature: paymentResponse.razorpay_signature,
              })
            } catch (requestError) {
              navigate(orderPath, {
                state: {
                  paymentNotice: requestError.response?.data?.message
                    || 'Could not verify the payment. Refresh the order before retrying.',
                },
              })
              return
            }
            navigate(orderPath)
          },
          onFailure: async (failure) => {
            const paymentId = failure?.error?.metadata?.payment_id
            if (!paymentId) {
              navigate(orderPath, { state: { paymentNotice: 'Payment was not completed. You can retry from this order.' } })
              return
            }
            try {
              await api.post(`/api/orders/${encodeURIComponent(data.order.orderId)}/payments/failure`, { paymentId })
              navigate(orderPath, { state: { paymentNotice: 'Payment failed. You can retry from this order.' } })
            } catch (requestError) {
              navigate(orderPath, {
                state: {
                  paymentNotice: requestError.response?.data?.message
                    || 'Could not confirm the payment result. Refresh the order before retrying.',
                },
              })
            }
          },
          onDismiss: () => navigate(orderPath),
        })
      } catch {
        navigate(orderPath)
      }
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
            <label className="payment-option">
              <input
                checked={paymentMethod === 'razorpay'}
                name="paymentMethod"
                onChange={() => setPaymentMethod('razorpay')}
                type="radio"
                value="razorpay"
              />
              <span>
                <strong>Pay online with Razorpay</strong>
                <small>Complete payment securely before the café prepares your order.</small>
              </span>
            </label>
            <p className="payment-note">Online payment requires Razorpay keys to be configured by the café.</p>
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="cart-total">
              <span>Total</span>
              <strong>₹{total.toFixed(2)}</strong>
            </div>
            <button className="primary-button" disabled={submitting} type="submit">
              {submitting ? 'Starting checkout…' : paymentMethod === 'razorpay' ? 'Continue to payment' : 'Place order'}
            </button>
          </form>
        </div>
      )}
    </section>
  )
}

function OrderConfirmationPage({ user }) {
  const { orderId } = useParams()
  const location = useLocation()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [paymentError, setPaymentError] = useState(location.state?.paymentNotice || '')
  const [startingPayment, setStartingPayment] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    let polling = false

    async function refreshOrder() {
      if (polling) return
      polling = true
      try {
        const { data } = await api.get(`/api/orders/${encodeURIComponent(orderId)}`, { signal: controller.signal })
        setOrder(data.order)
        setError('')
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(requestError.response?.data?.message || 'Could not load this order.')
        }
      } finally {
        polling = false
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    refreshOrder()
    const interval = setInterval(refreshOrder, 5000)
    return () => {
      controller.abort()
      clearInterval(interval)
    }
  }, [orderId])

  async function retryOnlinePayment() {
    setStartingPayment(true)
    setPaymentError('')
    try {
      const { data } = await api.post(`/api/orders/${encodeURIComponent(orderId)}/payments/attempt`)
      if (!data.payment) {
        setOrder(data.order)
        return
      }
      await loadRazorpayScript()
      openRazorpayCheckout({
        order: data.order,
        payment: data.payment,
        user,
        onSuccess: async (paymentResponse) => {
          try {
            await api.post(`/api/orders/${encodeURIComponent(orderId)}/payments/verify`, {
              paymentId: paymentResponse.razorpay_payment_id,
              signature: paymentResponse.razorpay_signature,
            })
            setPaymentError('')
          } catch (requestError) {
            setPaymentError(requestError.response?.data?.message || 'Could not verify the payment. Check the order status before retrying.')
          }
        },
        onFailure: async (failure) => {
          const paymentId = failure?.error?.metadata?.payment_id
          if (!paymentId) {
            setPaymentError('Payment was not completed. You can retry from this order.')
            return
          }
          try {
            await api.post(`/api/orders/${encodeURIComponent(orderId)}/payments/failure`, { paymentId })
            setPaymentError('Payment failed. You can retry from this order.')
          } catch (requestError) {
            setPaymentError(requestError.response?.data?.message || 'Could not confirm the payment result. Refresh the order before retrying.')
          }
        },
        onDismiss: () => {},
      })
    } catch (requestError) {
      setPaymentError(requestError.response?.data?.message || requestError.message || 'Could not start online payment.')
    } finally {
      setStartingPayment(false)
    }
  }

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
            <p className="menu-page-copy">Your order status refreshes automatically while the café prepares it.</p>
            {order.status === 'Ready for Pickup' && (
              <aside className="ready-notification" aria-live="assertive">
                <strong>Your order is ready for pickup!</strong>
                <span>Please collect it from the café counter.</span>
              </aside>
            )}
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
                <span>
                  {order.paymentMethod === 'razorpay' ? 'Online · Razorpay' : 'Pay at the café'}
                  {' · '}
                  {order.paymentStatus === 'paid'
                    ? 'Paid'
                    : order.paymentStatus === 'failed'
                      ? 'Failed'
                      : order.paymentMethod === 'razorpay' ? 'Payment pending' : 'Due at pickup'}
                </span>
              </div>
              {order.paymentMethod === 'razorpay' && order.paymentStatus !== 'paid' && (
                <>
                  {paymentError && <p className="form-error" role="alert">{paymentError}</p>}
                  <button
                    className="primary-button"
                    disabled={startingPayment}
                    onClick={retryOnlinePayment}
                    type="button"
                  >
                    {startingPayment ? 'Starting checkout…' : order.paymentStatus === 'failed' ? 'Retry online payment' : 'Pay online now'}
                  </button>
                </>
              )}
              <div className="payment-summary">
                <span>Preparation</span>
                <span>{order.status}</span>
              </div>
            </div>
            <div className="welcome-actions">
              <Link className="primary-button button-link" to="/orders">Order history</Link>
              <Link className="secondary-button button-link" to="/menu">Back to menu</Link>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function ReadyOrderNotice({ orders }) {
  if (orders.length === 0) return null

  return (
    <aside className="ready-notification global-ready-notification" aria-live="assertive">
      <div>
        <strong>{orders.length === 1 ? 'Your order is ready for pickup!' : `${orders.length} orders are ready for pickup!`}</strong>
        <span>Collect your ready order{orders.length === 1 ? '' : 's'} from the café counter.</span>
      </div>
      <Link className="ready-notification-link" to={`/orders/${encodeURIComponent(orders[0].orderId)}`}>
        View order
      </Link>
    </aside>
  )
}

function StudentOrderHistoryPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    let polling = false

    async function refreshOrders() {
      if (polling) return
      polling = true
      try {
        const { data } = await api.get('/api/orders/my', { signal: controller.signal })
        setOrders(data.orders)
        setError('')
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(requestError.response?.data?.message || 'Could not load your orders.')
        }
      } finally {
        polling = false
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    refreshOrders()
    const interval = setInterval(refreshOrders, 7000)
    return () => {
      controller.abort()
      clearInterval(interval)
    }
  }, [])

  return (
    <section className="menu-page">
      <div className="menu-page-heading">
        <div>
          <p className="eyebrow">YOUR ORDERS</p>
          <h1 className="menu-page-title">Order history</h1>
          <p className="menu-page-copy">Statuses update automatically while your orders are active.</p>
        </div>
        <Link className="secondary-button" to="/menu">Back to menu</Link>
      </div>
      {error && <p className="form-error menu-feedback" role="alert">{error}</p>}
      {loading ? (
        <p className="menu-empty" aria-live="polite">Loading your orders…</p>
      ) : orders.length === 0 ? (
        <p className="menu-empty">You haven’t placed an order yet. <Link to="/menu">Browse the menu</Link>.</p>
      ) : (
        <div className="student-order-list">
          {orders.map((order) => (
            <article className="student-order-card" key={order.orderId}>
              <div className="student-order-heading">
                <div>
                  <p className="account-label">ORDER REFERENCE</p>
                  <h2>{order.orderId}</h2>
                </div>
                <span className={`order-status-badge${order.status === 'Ready for Pickup' ? ' order-status-badge--ready' : ''}`}>
                  {order.status === 'Completed / Taken' ? 'Completed' : order.status}
                </span>
              </div>
              <ul className="payment-order-items">
                {order.items.map((item) => (
                  <li key={`${item.name}-${item.menuItem}`}>
                    <span>{item.quantity} × {item.name}</span>
                    <span>₹{(item.quantity * item.priceAtOrder).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="student-order-footer">
                <span>
                  {order.paymentMethod === 'razorpay' ? 'Online · Razorpay' : 'Pay at the café'}
                  {' · '}
                  {order.paymentStatus === 'paid'
                    ? 'Paid'
                    : order.paymentStatus === 'failed'
                      ? 'Failed'
                      : order.paymentMethod === 'razorpay' ? 'Payment pending' : 'Due at pickup'}
                </span>
                <strong>₹{Number(order.total).toFixed(2)}</strong>
              </div>
              {order.status === 'Ready for Pickup' && (
                <p className="ready-order-hint" role="status">Your order is ready. Please collect it at the café.</p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function StudentProfilePage({ user, onProfileUpdated }) {
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setError('')
    setNotice('')
  }

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const { data } = await api.patch('/api/auth/profile', form)
      onProfileUpdated(data.user)
      setForm({ name: data.user.name, phone: data.user.phone || '' })
      setNotice('Your profile has been updated.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update your profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="menu-page">
      <div className="menu-page-heading">
        <div>
          <p className="eyebrow">YOUR ACCOUNT</p>
          <h1 className="menu-page-title">Student profile</h1>
          <p className="menu-page-copy">Update your name or phone number. Your institutional email cannot be changed here.</p>
        </div>
        <Link className="secondary-button" to="/">Back to home</Link>
      </div>

      <form className="profile-form" onSubmit={submit}>
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
        <label>
          Institutional email
          <input autoComplete="email" readOnly value={user.email} />
          <span className="form-hint">Email is read-only and must remain tied to your student account.</span>
        </label>
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
        {error && <p className="form-error" role="alert">{error}</p>}
        {notice && <p className="menu-notice" role="status">{notice}</p>}
        <button className="primary-button" disabled={saving} type="submit">
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </section>
  )
}

function KitchenOrdersPage() {
  const [view, setView] = useState('active')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [pendingId, setPendingId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    let polling = false

    async function refreshOrders() {
      if (polling) return
      polling = true
      try {
        const { data } = await api.get(`/api/kitchen/orders?view=${view}`, { signal: controller.signal })
        setOrders(data.orders)
        setError('')
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(requestError.response?.data?.message || 'Could not load kitchen orders.')
        }
      } finally {
        polling = false
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    setLoading(true)
    refreshOrders()
    const interval = setInterval(refreshOrders, 5000)
    return () => {
      controller.abort()
      clearInterval(interval)
    }
  }, [view])

  async function advanceOrder(order) {
    const transitions = {
      Queued: 'In Progress',
      'In Progress': 'Ready for Pickup',
      'Ready for Pickup': 'Completed',
    }
    const nextStatus = transitions[order.status]
    if (!nextStatus) return

    setPendingId(order.orderId)
    setError('')
    setNotice('')
    try {
      const { data } = await api.patch(
        `/api/kitchen/orders/${encodeURIComponent(order.orderId)}/status`,
        { status: nextStatus },
      )
      setOrders((current) => view === 'active'
        ? current.map((entry) => entry.orderId === order.orderId ? data.order : entry)
        : current.filter((entry) => entry.orderId !== order.orderId))
      setNotice(`Order ${order.orderId} moved to ${data.order.status}.`)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update the order status.')
    } finally {
      setPendingId('')
    }
  }

  return (
    <section className="menu-page">
      <div className="menu-page-heading">
        <div>
          <p className="eyebrow">KITCHEN STAFF</p>
          <h1 className="menu-page-title">Kitchen orders</h1>
          <p className="menu-page-copy">New and updated orders refresh automatically every 5 seconds.</p>
        </div>
        <Link className="secondary-button" to="/">Back to home</Link>
      </div>
      <div className="order-view-tabs" role="tablist" aria-label="Order view">
        <button
          aria-selected={view === 'active'}
          className={`order-view-tab${view === 'active' ? ' order-view-tab--active' : ''}`}
          onClick={() => setView('active')}
          role="tab"
          type="button"
        >Active orders</button>
        <button
          aria-selected={view === 'history'}
          className={`order-view-tab${view === 'history' ? ' order-view-tab--active' : ''}`}
          onClick={() => setView('history')}
          role="tab"
          type="button"
        >Completed history</button>
      </div>
      {error && <p className="form-error menu-feedback" role="alert">{error}</p>}
      {notice && <p className="menu-notice menu-feedback" role="status">{notice}</p>}
      {loading ? (
        <p className="menu-empty" aria-live="polite">Loading orders…</p>
      ) : orders.length === 0 ? (
        <p className="menu-empty">{view === 'active' ? 'No active orders right now.' : 'No completed orders yet.'}</p>
      ) : (
        <div className="kitchen-order-list">
          {orders.map((order) => (
            <article className="kitchen-order-card" key={order.orderId}>
              <div className="kitchen-order-heading">
                <div>
                  <p className="account-label">{view === 'history' ? 'COMPLETED ORDER' : 'ORDER REFERENCE'}</p>
                  <h2>{order.orderId}</h2>
                </div>
                <span className={`order-status-badge${order.status === 'Ready for Pickup' ? ' order-status-badge--ready' : ''}`}>
                  {order.status === 'Completed / Taken' ? 'Completed' : order.status}
                </span>
              </div>
              <div className="kitchen-contact">
                <strong>{order.studentName}</strong>
                <a href={`tel:${order.studentPhone}`}>{order.studentPhone}</a>
              </div>
              <ul className="payment-order-items">
                {order.items.map((item) => (
                  <li key={`${item.name}-${item.menuItem}`}>
                    <span>{item.quantity} × {item.name}</span>
                    <span>₹{(item.quantity * item.priceAtOrder).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="kitchen-order-meta">
                <span>Total <strong>₹{Number(order.total).toFixed(2)}</strong></span>
                <span>Payment <strong>{order.paymentMethod === 'counter' ? 'At café' : order.paymentMethod}</strong></span>
                <span>Payment status <strong>{order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}</strong></span>
              </div>
              {view === 'active' && (
                <button
                  className="primary-button"
                  disabled={pendingId === order.orderId}
                  onClick={() => advanceOrder(order)}
                  type="button"
                >
                  {pendingId === order.orderId
                    ? 'Updating…'
                    : order.status === 'Ready for Pickup' ? 'Mark completed'
                      : `Move to ${({ Queued: 'In Progress', 'In Progress': 'Ready for Pickup' })[order.status]}`}
                </button>
              )}
            </article>
          ))}
        </div>
      )}
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
              <Link className="primary-button button-link" to="/kitchen/orders">Kitchen orders</Link>
              <Link className="primary-button button-link" to="/kitchen/menu">Manage menu</Link>
              <Link className="secondary-button button-link" to="/kitchen/payments">Counter payments</Link>
            </div>
          ) : (
            <div className="welcome-actions">
              <Link className="primary-button button-link" to="/menu">Browse menu</Link>
              <Link className="secondary-button button-link" to="/profile">Edit profile</Link>
              <Link className="secondary-button button-link" to="/orders">Order history</Link>
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

      <div className="welcome-art" aria-hidden="true">
        <span className="welcome-art-index">W / 01</span>
        <img
          src="https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1100&q=85"
          alt=""
        />
        <div className="welcome-art-note">
          <span>THE CAMPUS COUNTER</span>
          <strong>Good things,<br />made fresh.</strong>
        </div>
        <span className="welcome-art-caption">Quick plates · good breaks</span>
      </div>

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
  const [readyOrders, setReadyOrders] = useState([])
  const [notificationError, setNotificationError] = useState('')
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
    if (sessionLoading || user?.role !== 'student') {
      setReadyOrders([])
      setNotificationError('')
      return undefined
    }

    const controller = new AbortController()
    let polling = false

    async function refreshReadyOrders() {
      if (polling) return
      polling = true
      try {
        const { data } = await api.get('/api/orders/my', { signal: controller.signal })
        setReadyOrders(data.orders.filter((order) => order.status === 'Ready for Pickup'))
        setNotificationError('')
      } catch (error) {
        if (!controller.signal.aborted) {
          setNotificationError(error.response?.data?.message || 'Could not check for ready orders.')
        }
      } finally {
        polling = false
      }
    }

    refreshReadyOrders()
    const interval = setInterval(refreshReadyOrders, 7000)
    return () => {
      controller.abort()
      clearInterval(interval)
    }
  }, [sessionLoading, user?.id, user?.role])

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
            <>
              <Link
                aria-current={location.pathname === '/profile' ? 'page' : undefined}
                className="topbar-cart"
                to="/profile"
              >
                Profile
              </Link>
              <Link className="topbar-cart" to="/cart" aria-label={`Cart with ${cartCount} items`}>
                Cart{cartCount > 0 ? ` (${cartCount})` : ''}
              </Link>
            </>
          )}
          {user?.role === 'kitchen' && (
            <>
              <Link className="topbar-cart" to="/kitchen/orders">Orders</Link>
              <Link className="topbar-cart" to="/kitchen/menu">Menu</Link>
              <Link className="topbar-cart" to="/kitchen/payments">Payments</Link>
            </>
          )}
          <span className="campus-label">MADE FOR CAMPUS</span>
        </div>
      </header>
      {!sessionLoading && user?.role === 'student' && (
        <>
          <ReadyOrderNotice orders={location.pathname.startsWith('/orders/') ? [] : readyOrders} />
          {notificationError && <p className="session-error notification-error" role="alert">{notificationError}</p>}
        </>
      )}

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
                  user={user}
                  onClearCart={() => setCart({})}
                  onRemoveItem={removeCartItem}
                  onUpdateQuantity={updateCartQuantity}
                />
              ) : <p className="welcome-copy" aria-live="polite">Loading your saved cart…</p> : <Navigate to={user ? '/' : '/login'} replace />}
            />
            <Route
              path="/orders/:orderId"
              element={user?.role === 'student' ? <OrderConfirmationPage user={user} /> : <Navigate to={user ? '/' : '/login'} replace />}
            />
            <Route
              path="/orders"
              element={user?.role === 'student' ? <StudentOrderHistoryPage /> : <Navigate to={user ? '/' : '/login'} replace />}
            />
            <Route
              path="/profile"
              element={user?.role === 'student'
                ? <StudentProfilePage user={user} onProfileUpdated={setUser} />
                : <Navigate to={user ? '/' : '/login'} replace />}
            />
            <Route
              path="/kitchen/orders"
              element={user?.role === 'kitchen' ? <KitchenOrdersPage /> : <Navigate to={user ? '/' : '/kitchen/login'} replace />}
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
