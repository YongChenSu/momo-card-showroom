import { useSyncExternalStore } from 'react'
import { selectConfig } from '../core/config-store'
import type { CardConfig, CardVariant } from '../core/schema/card-config'
import { configStore } from '../embed'

/** Stored config for a variant (without any per-element attribute override). */
export const useCardConfig = (variant: CardVariant): CardConfig =>
  useSyncExternalStore(configStore.subscribe, () => selectConfig(configStore.getSnapshot(), variant))
