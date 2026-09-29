import type { CardVariant } from '../core/schema/card-config'
import type { ProductInput } from '../core/schema/product'

type ProductCardProps = {
  variant: CardVariant
  product: ProductInput
}

/** The showroom renders cards only through the custom element (D12), exactly as an embedding page would. */
export const ProductCard = ({ variant, product }: ProductCardProps) => (
  <momo-product-card variant={variant} product={JSON.stringify(product)} />
)
