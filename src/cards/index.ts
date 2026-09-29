import type { ComponentType } from 'react'
import type { CardVariant } from '../core/schema/card-config'
import type { CardProps } from './contract'
import { GridCard } from './grid/GridCard'
import baseCss from './shared/base.css?inline'
import gridCss from './grid/grid-card.css?inline'

export type CardDefinition = {
  label: string
  component: ComponentType<CardProps>
  /** Stylesheet text injected into the card's shadow root (base + variant). */
  css: string
}

/**
 * Variant registry (D11). Consumers (embed / showroom) iterate this instead of hard-coding variants.
 * `compact` is added in T10; until then it falls back to the grid layout.
 */
export const cardDefinitions: Record<CardVariant, CardDefinition> = {
  grid: { label: '搜尋結果卡（grid）', component: GridCard, css: baseCss + gridCss },
  compact: { label: '降價好貨卡（compact）', component: GridCard, css: baseCss + gridCss },
}

export type { CardProps } from './contract'
export { builtinBadgeRegistry, builtinBadges } from './badges/builtin'
