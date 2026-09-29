import type { CardProps } from '../contract'
import { cardStyleVars } from '../shared/card-style'
import { formatPrice } from '../shared/format'
import { SlotBadges } from '../shared/SlotBadges'
import { useBadges } from '../shared/use-badges'

/**
 * Home-page "降價好貨" style card (docs/decisions.md D4 ②): image, title, price and struck-through original price.
 * Same Product data and CardProps contract as the grid card — only the presentation differs.
 */
export const CompactCard = ({ product, config, registry }: CardProps) => {
  const badges = useBadges(product.badges, registry)

  return (
    <article className="card card--compact" style={cardStyleVars(config)}>
      <a className="card__link" href={product.url}>
        <div className="card__media">
          <img className="card__image" src={product.imageUrl} alt={product.title} loading="lazy" />
        </div>
        <div className="card__body">
          <h3 className="card__title">
            <SlotBadges slot="title-prefix" badges={badges} config={config} className="card__slot card__slot--title" />
            {product.title}
          </h3>
          <p className="card__price">
            <span className="card__currency">$</span>
            <strong className="card__amount">{formatPrice(product.price)}</strong>
            {config.fields.originalPrice && product.originalPrice !== undefined && (
              <del className="card__original-price">${formatPrice(product.originalPrice)}</del>
            )}
          </p>
        </div>
      </a>
    </article>
  )
}
