import type { CardProps } from '../contract'
import { cardStyleVars } from '../shared/card-style'
import { formatPrice, formatStars } from '../shared/format'
import { SlotBadges } from '../shared/SlotBadges'
import { useBadges } from '../shared/use-badges'

const PRICE_NOTE_LABEL = { discounted: '(售價已折)', from: '起' } as const

/** Search-result style card (docs/decisions.md D4 ①). */
export const GridCard = ({ product, config, registry }: CardProps) => {
  const badges = useBadges(product.badges, registry)
  const { fields } = config

  return (
    <article className="card card--grid" style={cardStyleVars(config)}>
      <a className="card__link" href={product.url}>
        <div className="card__media">
          <img className="card__image" src={product.imageUrl} alt={product.title} loading="lazy" />
          <SlotBadges slot="image-top-left" badges={badges} config={config} className="card__slot card__slot--top-left" />
          <SlotBadges slot="image-bottom-left" badges={badges} config={config} className="card__slot card__slot--bottom-left" />
          <SlotBadges slot="image-bottom-right" badges={badges} config={config} className="card__slot card__slot--bottom-right" />
        </div>
        {product.imageCount > 1 && (
          <div className="card__dots" aria-hidden="true">
            {Array.from({ length: product.imageCount }, (_, index) => (
              <span key={index} className={index === 0 ? 'card__dot card__dot--active' : 'card__dot'} />
            ))}
          </div>
        )}
        <div className="card__body">
          {fields.promoText && product.promoText && <p className="card__promo">{product.promoText}</p>}
          <h3 className="card__title">
            <SlotBadges slot="title-prefix" badges={badges} config={config} className="card__slot card__slot--title" />
            {product.title}
          </h3>
          <p className="card__price">
            <span className="card__currency">$</span>
            <strong className="card__amount">{formatPrice(product.price)}</strong>
            {product.priceNote && <small className="card__price-note">{PRICE_NOTE_LABEL[product.priceNote]}</small>}
            {fields.originalPrice && product.originalPrice !== undefined && (
              <del className="card__original-price">${formatPrice(product.originalPrice)}</del>
            )}
          </p>
          {fields.rating && product.rating && (
            <p className="card__rating">
              <span className="card__stars" aria-label={`${product.rating.score} 顆星`}>
                {formatStars(product.rating.score)}
              </span>
              <span className="card__rating-count">({product.rating.count})</span>
            </p>
          )}
          {fields.soldCount && product.soldCount !== undefined && (
            <p className="card__sold">總銷量&gt;{product.soldCount}</p>
          )}
        </div>
      </a>
    </article>
  )
}
