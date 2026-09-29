import { Link } from 'react-router'
import { cardDefinitions } from '../../cards'
import { mockProducts } from '../../core/mock/products'
import { cardVariants } from '../../core/schema/card-config'
import { ProductCard } from '../ProductCard'

/** `/` — every variant from the card registry × every mock product. */
export const ListPage = () => (
  <>
    {cardVariants.map((variant) => (
      <section key={variant} className="variant-section">
        <header className="variant-section__header">
          <h2>{cardDefinitions[variant].label}</h2>
          <Link className="variant-section__action" to={`/cards/${variant}`}>
            調整此卡 →
          </Link>
        </header>
        <div className="card-grid">
          {mockProducts.map((product) => (
            <ProductCard key={product.id} variant={variant} product={product} />
          ))}
        </div>
      </section>
    ))}
  </>
)
