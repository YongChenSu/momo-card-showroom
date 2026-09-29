import { useMemo, useState, useSyncExternalStore } from 'react'
import { Link, useParams } from 'react-router'
import { cardDefinitions } from '../../cards'
import { mockProducts } from '../../core/mock/products'
import { cardVariants, type CardVariant } from '../../core/schema/card-config'
import { badgeRegistryStore } from '../../embed/runtime'
import { ConfigPanel } from '../panel/ConfigPanel'
import { ProductCard } from '../ProductCard'
import { productCoverage, richestProduct } from '../product-coverage'

const isVariant = (value: string | undefined): value is CardVariant =>
  value !== undefined && (cardVariants as readonly string[]).includes(value)

/** `/cards/:variant` — single-card preview + adjustment panel. */
export const CardPage = () => {
  const { variant } = useParams()
  const registry = useSyncExternalStore(badgeRegistryStore.subscribe, badgeRegistryStore.getSnapshot)
  const [productId, setProductId] = useState(() => richestProduct(mockProducts, registry)?.id)
  const product = mockProducts.find((item) => item.id === productId) ?? mockProducts[0]
  const coverage = useMemo(() => product && productCoverage(product, registry), [product, registry])

  if (!isVariant(variant)) {
    return (
      <p>
        找不到卡片類型「{variant}」。<Link to="/">回列表</Link>
      </p>
    )
  }

  return (
    <div className="card-page">
      <section className="card-page__preview">
        <h2>{cardDefinitions[variant].label}</h2>
        <label className="field">
          預覽商品
          <select value={productId} onChange={(event) => setProductId(event.target.value)}>
            {mockProducts.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <div className="card-page__stage">{product && <ProductCard variant={variant} product={product} />}</div>
      </section>
      <ConfigPanel variant={variant} coverage={coverage} />
    </div>
  )
}
