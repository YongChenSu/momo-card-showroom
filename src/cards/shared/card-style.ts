import type { CSSProperties } from 'react'
import type { CardConfig } from '../../core/schema/card-config'

/** CardConfig theme → CSS custom properties on the card root (read by the variant stylesheets). */
export const cardStyleVars = (config: CardConfig): CSSProperties =>
  ({
    '--card-price-color': config.theme.priceColor,
    '--card-radius': `${config.theme.radius}px`,
    '--card-title-lines': String(config.titleLines),
  }) as CSSProperties
