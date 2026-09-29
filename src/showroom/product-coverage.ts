import type { CardField } from '../cards'
import type { BadgeRegistry } from '../core/badge-registry'
import type { BadgeSlot } from '../core/schema/badge'
import type { ProductInput } from '../core/schema/product'

export type ProductCoverage = {
  fields: ReadonlySet<CardField>
  slots: ReadonlySet<BadgeSlot>
}

const hasType = (badge: unknown): badge is { type: string } =>
  typeof badge === 'object' && badge !== null && 'type' in badge && typeof badge.type === 'string'

/**
 * Which toggleable fields / badge slots a product actually has data for. The panel uses it to explain
 * why a toggle shows no change for the current preview. Slot lookup only (no payload validation), so it never reports.
 */
export const productCoverage = (product: ProductInput, registry: BadgeRegistry): ProductCoverage => ({
  fields: new Set<CardField>(
    [
      product.originalPrice !== undefined && 'originalPrice',
      product.promoText !== undefined && 'promoText',
      product.rating !== undefined && 'rating',
      product.soldCount !== undefined && 'soldCount',
    ].filter((field): field is CardField => field !== false),
  ),
  slots: new Set(
    (product.badges ?? []).flatMap((badge) => {
      const plugin = hasType(badge) ? registry.get(badge.type) : undefined
      return plugin ? [plugin.slot] : []
    }),
  ),
})

/** Preview default: the product exercising the most toggles, so every panel option shows a visible effect. */
export const richestProduct = (products: readonly ProductInput[], registry: BadgeRegistry): ProductInput | undefined =>
  products.reduce<{ product?: ProductInput; score: number }>(
    (best, product) => {
      const { fields, slots } = productCoverage(product, registry)
      const score = fields.size + slots.size
      return score > best.score ? { product, score } : best
    },
    { score: -1 },
  ).product
