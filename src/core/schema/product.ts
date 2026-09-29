import { z } from 'zod'

/**
 * Product content — owned by the product system (mocked here), never edited by the card.
 * `badges` stays opaque (`unknown[]`) on purpose: each item is resolved individually by the
 * badge registry so one malformed/unknown badge cannot fail the whole product.
 */
export const productSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  imageUrl: z.string().min(1),
  imageCount: z.number().int().min(1).default(1),
  url: z.string().min(1),
  price: z.number().nonnegative(),
  originalPrice: z.number().nonnegative().optional(),
  /** `discounted` → 「(售價已折)」, `from` → 「起」 */
  priceNote: z.enum(['discounted', 'from']).optional(),
  /** Red one-line promo copy, e.g. 滿1件折391元 */
  promoText: z.string().optional(),
  rating: z
    .object({
      score: z.number().min(0).max(5),
      count: z.number().int().nonnegative(),
    })
    .optional(),
  soldCount: z.number().int().nonnegative().optional(),
  badges: z.array(z.unknown()).default([]),
})

export type Product = z.infer<typeof productSchema>
export type ProductInput = z.input<typeof productSchema>
