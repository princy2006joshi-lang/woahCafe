import mongoose from 'mongoose'
import MenuItem from '../models/MenuItem.js'

export async function listMenu(request, response) {
  const filter = { available: true }
  if (typeof request.query.category === 'string' && request.query.category.trim()) {
    filter.category = request.query.category.trim()
  }

  const items = await MenuItem.find(filter).sort({ category: 1, name: 1 }).lean()
  return response.json({ items })
}

export async function listKitchenMenu(request, response) {
  const items = await MenuItem.find().sort({ category: 1, name: 1 }).lean()
  return response.json({ items })
}

export async function createMenuItem(request, response) {
  const body = request.body || {}
  const validationError = validateMenuFields(body, true)
  if (validationError) {
    return response.status(400).json({ message: validationError })
  }

  const item = await MenuItem.create({
    name: body.name.trim(),
    description: body.description?.trim() || '',
    price: body.price,
    category: body.category.trim(),
    imageUrl: body.imageUrl?.trim() || '',
    available: body.available ?? true,
  })
  return response.status(201).json({ item })
}

export async function updateMenuItem(request, response) {
  if (!mongoose.isValidObjectId(request.params.id)) {
    return response.status(400).json({ message: 'Invalid menu item ID.' })
  }

  const body = request.body || {}
  const validationError = validateMenuFields(body, false)
  if (validationError) {
    return response.status(400).json({ message: validationError })
  }

  const item = await MenuItem.findByIdAndUpdate(request.params.id, { $set: body }, {
    new: true,
    runValidators: true,
    context: 'query',
  })
  if (!item) {
    return response.status(404).json({ message: 'Menu item not found.' })
  }

  return response.json({ item })
}

export async function deleteMenuItem(request, response) {
  if (!mongoose.isValidObjectId(request.params.id)) {
    return response.status(400).json({ message: 'Invalid menu item ID.' })
  }

  const item = await MenuItem.findByIdAndDelete(request.params.id)
  if (!item) {
    return response.status(404).json({ message: 'Menu item not found.' })
  }

  return response.json({ message: 'Menu item removed.' })
}

export function validateMenuFields(fields, requireComplete) {
  const editableFields = ['name', 'description', 'price', 'category', 'imageUrl', 'available']
  const keys = Object.keys(fields)
  if (!keys.length || keys.some((key) => !editableFields.includes(key))) {
    return 'Provide valid menu item fields to save.'
  }
  if (requireComplete && (!('name' in fields) || !('price' in fields) || !('category' in fields))) {
    return 'Name, price, and category are required.'
  }
  if ('name' in fields && (typeof fields.name !== 'string' || !fields.name.trim() || fields.name.trim().length > 100)) {
    return 'Name is required and must be no more than 100 characters.'
  }
  if ('category' in fields && (typeof fields.category !== 'string' || !fields.category.trim() || fields.category.trim().length > 60)) {
    return 'Category is required and must be no more than 60 characters.'
  }
  if ('description' in fields && (typeof fields.description !== 'string' || fields.description.length > 500)) {
    return 'Description must be text no longer than 500 characters.'
  }
  if ('price' in fields && (typeof fields.price !== 'number' || !Number.isFinite(fields.price) || fields.price <= 0)) {
    return 'Price must be a number greater than zero.'
  }
  if ('available' in fields && typeof fields.available !== 'boolean') {
    return 'Availability must be true or false.'
  }
  if ('imageUrl' in fields) {
    if (typeof fields.imageUrl !== 'string' || fields.imageUrl.length > 2048) {
      return 'Image URL must be text no longer than 2048 characters.'
    }
    if (fields.imageUrl.trim()) {
      try {
        if (!['http:', 'https:'].includes(new URL(fields.imageUrl).protocol)) {
          return 'Image URL must use HTTP or HTTPS.'
        }
      } catch {
        return 'Enter a valid image URL.'
      }
    }
  }
  return null
}
