import mongoose from 'mongoose'
import MenuItem from '../models/MenuItem.js'

export async function listMenu(request, response) {
  const filter = {}
  if (typeof request.query.category === 'string' && request.query.category.trim()) {
    filter.category = request.query.category.trim()
  }

  const items = await MenuItem.find(filter).sort({ category: 1, name: 1 }).lean()
  return response.json({ items })
}

export async function createMenuItem(request, response) {
  const { name, description = '', price, category, available = true } = request.body
  if (typeof name !== 'string' || !name.trim() || typeof category !== 'string' || !category.trim()) {
    return response.status(400).json({ message: 'Name and category are required.' })
  }
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
    return response.status(400).json({ message: 'Price must be a number greater than zero.' })
  }
  if (typeof description !== 'string' || typeof available !== 'boolean') {
    return response.status(400).json({ message: 'Description must be text and available must be true or false.' })
  }

  const item = await MenuItem.create({
    name: name.trim(),
    description: description.trim(),
    price,
    category: category.trim(),
    available,
  })
  return response.status(201).json({ item })
}

export async function updateMenuAvailability(request, response) {
  if (!mongoose.isValidObjectId(request.params.id)) {
    return response.status(400).json({ message: 'Invalid menu item ID.' })
  }
  if (typeof request.body.available !== 'boolean') {
    return response.status(400).json({ message: 'Availability must be true or false.' })
  }

  const item = await MenuItem.findByIdAndUpdate(
    request.params.id,
    { $set: { available: request.body.available } },
    { new: true, runValidators: true },
  )
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
