import { builtinBadgeRegistry } from '../cards'
import { createConfigStore, type KeyValueStorage } from '../core/config-store'
import { createBadgeRegistryStore, createExternalBadge } from '../core/external-badge'
import { consoleReporter } from '../core/report'

/** In-memory fallback when localStorage is unavailable (sandboxed iframe, blocked storage). */
const createMemoryStorage = (): KeyValueStorage => {
  const items = new Map<string, string>()
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => {
      items.set(key, value)
    },
  }
}

const resolveStorage = (): KeyValueStorage => {
  try {
    return window.localStorage
  } catch (error) {
    consoleReporter({ code: 'config.persist-failed', message: 'localStorage unavailable; config will not persist', detail: error })
    return createMemoryStorage()
  }
}

/**
 * One store per page (D8/D9): every <momo-product-card> and the showroom panel share it,
 * so an update from the panel re-renders all cards of that variant.
 */
export const configStore = createConfigStore(resolveStorage())

export const report = consoleReporter

/** Starts with the built-ins; hosts extend it through registerBadge. Cards subscribe, so late registration re-renders them. */
export const badgeRegistryStore = createBadgeRegistryStore(builtinBadgeRegistry, report)

/**
 * Public API: `MomoCards.registerBadge({ type, slot, view })`. Input is validated at this boundary;
 * returns false (and reports) when the definition is invalid or the type is already taken.
 */
export const registerBadge = (input: unknown): boolean => {
  const plugin = createExternalBadge(input, report)
  return plugin ? badgeRegistryStore.register(plugin) : false
}
