import { mockProducts } from '../core/mock/products'
import '../embed'

/** Temporary smoke page for the embed adapter; T7 replaces it with the list / single-card routes. */
export const App = () => (
  <main>
    <h1>momo Card Showroom</h1>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
      {mockProducts.map((product) => (
        <momo-product-card key={product.id} variant="grid" product={JSON.stringify(product)} />
      ))}
    </div>
  </main>
)
