import { useMemo, useSyncExternalStore } from 'react'
import { cardDefinitions } from '../cards'
import { resolveCardConfig } from '../core/card-config'
import { selectConfig } from '../core/config-store'
import type { CardVariant } from '../core/schema/card-config'
import type { Product } from '../core/schema/product'
import { badgeRegistry, configStore, report } from './runtime'

export type CardHostProps = {
  variant: CardVariant
  product: Product
  /** Parsed `config` attribute (untrusted); undefined when absent. */
  attributeConfig: unknown
}

/**
 * Bridges the store into a card. useSyncExternalStore subscribes on mount and unsubscribes
 * on unmount, so the element only has to manage its React root.
 */
export const CardHost = ({ variant, product, attributeConfig }: CardHostProps) => {
  const stored = useSyncExternalStore(configStore.subscribe, () => selectConfig(configStore.getSnapshot(), variant))
  // Memoised so an invalid attribute is reported once per change, not on every store update.
  const config = useMemo(() => resolveCardConfig(stored, attributeConfig, report), [stored, attributeConfig])
  const { component: Card, css } = cardDefinitions[variant]

  return (
    <>
      <style>{css}</style>
      <Card product={product} config={config} registry={badgeRegistry} />
    </>
  )
}
