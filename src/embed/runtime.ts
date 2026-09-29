import { builtinBadgeRegistry } from '../cards'
import { createConfigStore, type KeyValueStorage } from '../core/config-store'
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

/** Built-ins only for now; external registration (T11) will replace this with a mutable reference. */
export const badgeRegistry = builtinBadgeRegistry

export const report = consoleReporter
