import * as yup from 'yup'

/**
 * Product content — owned by the product system (mocked here), never edited by the card.
 * `badges` stays opaque (`unknown[]`) on purpose: each item is resolved individually by the
 * badge registry so one malformed/unknown badge cannot fail the whole product.
 */
export type Product = {
  id: string
  title: string
  imageUrl: string
  imageCount: number
  url: string
  price: number
  originalPrice?: number
  /** `discounted` → 「(售價已折)」, `from` → 「起」 */
  priceNote?: 'discounted' | 'from'
  /** Red one-line promo copy, e.g. 滿1件折391元 */
  promoText?: string
  rating?: {
    score: number
    count: number
  }
  soldCount?: number
  badges: unknown[]
}

/** What a data source may send before defaults are applied. */
export type ProductInput = Omit<Product, 'imageCount' | 'badges'> & {
  imageCount?: number
  badges?: unknown[]
}

const ratingSchema = yup.object({
  score: yup.number().min(0).max(5).required(),
  count: yup.number().integer().min(0).required(),
})

export const productSchema: yup.ObjectSchema<Product> = yup.object({
  id: yup.string().required(),
  title: yup.string().required(),
  imageUrl: yup.string().required(),
  imageCount: yup.number().integer().min(1).default(1),
  url: yup.string().required(),
  price: yup.number().min(0).required(),
  originalPrice: yup.number().min(0).optional(),
  priceNote: yup.string().oneOf(['discounted', 'from'] as const).optional(),
  promoText: yup.string().optional(),
  rating: ratingSchema.default(undefined).optional(),
  soldCount: yup.number().integer().min(0).optional(),
  // mixed + type guard (not array().of(mixed())) keeps items as `unknown` for per-item resolution
  badges: yup
    .mixed<unknown[]>((value): value is unknown[] => Array.isArray(value))
    .default(() => []),
})
