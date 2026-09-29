import type { ComponentType } from 'react'
import type { BadgeSlot } from '../core/schema/badge'
import type { CardConfig, CardVariant } from '../core/schema/card-config'
import type { CardProps } from './contract'
import { CompactCard } from './compact/CompactCard'
import { GridCard } from './grid/GridCard'
import baseCss from './shared/base.css?inline'
import compactCss from './compact/compact-card.css?inline'
import gridCss from './grid/grid-card.css?inline'

export type CardField = keyof CardConfig['fields']

export type CardDefinition = {
  label: string
  component: ComponentType<CardProps>
  /** Stylesheet text injected into the card's shadow root (base + variant). */
  css: string
  /** Config fields / badge slots this variant actually renders — the panel only offers these. */
  fields: readonly CardField[]
  slots: readonly BadgeSlot[]
}

/**
 * Variant registry (D11). Consumers (embed / showroom) iterate this instead of hard-coding variants.
 * Adding a variant = one component + one stylesheet + one entry here; CardConfig and the store are shared.
 */
export const cardDefinitions: Record<CardVariant, CardDefinition> = {
  grid: {
    label: '搜尋結果卡（grid）',
    component: GridCard,
    css: baseCss + gridCss,
    fields: ['originalPrice', 'promoText', 'rating', 'soldCount'],
    slots: ['image-top-left', 'image-bottom-left', 'image-bottom-right', 'title-prefix'],
  },
  compact: {
    label: '降價好貨卡（compact）',
    component: CompactCard,
    css: baseCss + compactCss,
    fields: ['originalPrice'],
    slots: ['title-prefix'],
  },
}

export type { CardProps } from './contract'
export { builtinBadgeRegistry, builtinBadges } from './badges/builtin'
