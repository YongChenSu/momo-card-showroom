import { describe, expect, test } from 'vitest'
import { mockProducts } from '../mock/products'
import { safeValidate } from '../validation'
import { CARD_CONFIG_SCHEMA_VERSION, cardConfigSchema } from './card-config'
import { productSchema } from './product'

describe('productSchema', () => {
  test('all mock products are valid (badges stay opaque)', () => {
    mockProducts.forEach((p) => expect(safeValidate(productSchema, p).ok).toBe(true))
  })

  test('applies defaults', () => {
    const parsed = productSchema.validateSync({ id: 'x', title: 't', imageUrl: 'i', url: 'u', price: 1 })
    expect(parsed.badges).toEqual([])
    expect(parsed.imageCount).toBe(1)
  })

  test('rejects non-array badges', () => {
    const result = safeValidate(productSchema, { id: 'x', title: 't', imageUrl: 'i', url: 'u', price: 1, badges: 'ad' })
    expect(result.ok).toBe(false)
  })
})

describe('cardConfigSchema', () => {
  test('empty input yields fully populated defaults (nested)', () => {
    const config = cardConfigSchema.validateSync({})
    expect(config.schemaVersion).toBe(CARD_CONFIG_SCHEMA_VERSION)
    expect(config.fields.rating).toBe(true)
    expect(config.slots['title-prefix']).toBe(true)
    expect(config.theme.radius).toBe(8)
  })

  test('partial nested input keeps given values and fills the rest', () => {
    const config = cardConfigSchema.validateSync({ fields: { rating: false }, theme: { radius: 0 } })
    expect(config.fields).toMatchObject({ rating: false, soldCount: true })
    expect(config.theme).toMatchObject({ radius: 0, priceColor: '#e4007f' })
  })

  test('rejects invalid values', () => {
    expect(safeValidate(cardConfigSchema, { titleLines: 9 }).ok).toBe(false)
    expect(safeValidate(cardConfigSchema, { theme: { priceColor: 'red' } }).ok).toBe(false)
    expect(safeValidate(cardConfigSchema, { schemaVersion: 2 }).ok).toBe(false)
  })
})
