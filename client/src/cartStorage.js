const cartStoragePrefix = 'woah-cafe-cart:'

function storageKey(userId) {
  return `${cartStoragePrefix}${encodeURIComponent(userId)}`
}

export function loadSavedCart(userId, storage) {
  const savedCart = storage.getItem(storageKey(userId))
  if (savedCart === null) return {}

  let parsedCart
  try {
    parsedCart = JSON.parse(savedCart)
  } catch {
    throw new Error('Your saved cart could not be read. Clear it to start a new cart.')
  }

  if (!parsedCart || typeof parsedCart !== 'object' || Array.isArray(parsedCart)) {
    throw new Error('Your saved cart has an invalid format. Clear it to start a new cart.')
  }

  const entries = Object.entries(parsedCart)
  const cart = {}
  for (const [itemId, entry] of entries) {
    const item = entry?.item
    if (
      typeof itemId !== 'string'
      || !item
      || item._id !== itemId
      || typeof item.name !== 'string'
      || typeof item.category !== 'string'
      || !Number.isFinite(item.price)
      || item.price <= 0
      || !Number.isInteger(entry.quantity)
      || entry.quantity < 1
      || entry.quantity > 50
    ) {
      throw new Error('Your saved cart contains invalid item data. Clear it to start a new cart.')
    }
    cart[itemId] = {
      item: {
        _id: item._id,
        name: item.name,
        description: typeof item.description === 'string' ? item.description : '',
        category: item.category,
        price: item.price,
        imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : '',
        available: item.available === true,
      },
      quantity: entry.quantity,
    }
  }
  return cart
}

export function saveCart(userId, cart, storage) {
  storage.setItem(storageKey(userId), JSON.stringify(cart))
}

export function clearSavedCart(userId, storage) {
  storage.removeItem(storageKey(userId))
}
