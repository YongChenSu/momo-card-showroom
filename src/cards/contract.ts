import type { BadgeRegistry } from '../core/badge-registry'
import type { Product } from '../core/schema/product'
import type { CardConfig } from '../core/schema/card-config'

/**
 * The contract every card variant implements. Inputs are already validated
 * (embed layer runs productSchema / resolveCardConfig), so cards trust their props.
 */
export type CardProps = {
  product: Product
  config: CardConfig
  registry: BadgeRegistry
}
