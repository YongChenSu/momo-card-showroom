import { describe, expect, test } from 'vitest'
import { mockProducts } from '../mock/products'
import { CARD_CONFIG_SCHEMA_VERSION, cardConfigSchema } from './card-config'
import { productSchema } from './product'

describe('productSchema', () => {
  test('all mock products are valid (badges stay opaque)', () => {
    mockProducts.forEach((p) => expect(productSchema.safeParse(p).success).toBe(true))
  })

  test('applies defaults', () => {
    const parsed = productSchema.parse({ id: 'x', title: 't', imageUrl: 'i', url: 'u', price: 1 })
    expect(parsed.badges).toEqual([])
    expect(parsed.imageCount).toBe(1)
  })
})

describe('cardConfigSchema', () => {
  test('empty input yields fully populated defaults (nested prefault)', () => {
    const config = cardConfigSchema.parse({})
    expect(config.schemaVersion).toBe(CARD_CONFIG_SCHEMA_VERSION)
    expect(config.fields.rating).toBe(true)
    expect(config.slots['title-prefix']).toBe(true)
    expect(config.theme.radius).toBe(8)
  })

  test('partial nested input keeps given values and fills the rest', () => {
    const config = cardConfigSchema.parse({ fields: { rating: false }, theme: { radius: 0 } })
    expect(config.fields).toMatchObject({ rating: false, soldCount: true })
    expect(config.theme).toMatchObject({ radius: 0, priceColor: '#e4007f' })
  })

  test('rejects invalid values', () => {
    expect(cardConfigSchema.safeParse({ titleLines: 9 }).success).toBe(false)
    expect(cardConfigSchema.safeParse({ theme: { priceColor: 'red' } }).success).toBe(false)
  })
})
