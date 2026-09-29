import { CARD_CONFIG_SCHEMA_VERSION, cardConfigSchema, cardVariants, type CardConfig, type CardVariant } from './schema/card-config'
import { applyPatch, defaultCardConfig, isRecord, type CardConfigPatch } from './card-config'
import { cardConfigMigrations, migrateConfig } from './config-migration'
import { consoleReporter, type Reporter } from './report'
import { safeValidate } from './validation'

/** Only variants the user has customised are present; missing ones fall back to defaults. */
export type ConfigState = Readonly<Partial<Record<CardVariant, CardConfig>>>

export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>

export type ConfigStore = {
  getSnapshot: () => ConfigState
  subscribe: (listener: () => void) => () => void
  update: (variant: CardVariant, patch: CardConfigPatch) => void
  reset: (variant: CardVariant) => void
}

export const CONFIG_STORAGE_KEY = 'momo-cards:card-config'

const isVariant = (key: string): key is CardVariant => (cardVariants as readonly string[]).includes(key)

/**
 * Reads persisted configs, migrating then validating each variant independently (D8 ④):
 * corrupt JSON → empty state; an unmigratable or invalid variant is dropped (defaults apply) — all reported.
 */
export const loadConfigState = (storage: KeyValueStorage, key: string, report: Reporter): ConfigState => {
  const text = storage.getItem(key)
  if (text === null) return {}
  const parsed: unknown = (() => {
    try {
      return JSON.parse(text)
    } catch {
      return undefined
    }
  })()
  if (!isRecord(parsed)) {
    report({ code: 'config.invalid-json', message: `stored "${key}" is not a JSON object; using defaults`, detail: text })
    return {}
  }
  return Object.entries(parsed).reduce<ConfigState>((state, [variant, value]) => {
    if (!isVariant(variant)) {
      report({ code: 'config.unknown-variant', message: `dropping stored config for unknown variant "${variant}"` })
      return state
    }
    const migrated = migrateConfig(value, CARD_CONFIG_SCHEMA_VERSION, cardConfigMigrations)
    if (!migrated.ok) {
      report({ code: 'config.unsupported-version', message: `stored config for "${variant}" cannot be migrated; using defaults`, detail: migrated.reason })
      return state
    }
    const result = safeValidate(cardConfigSchema, migrated.value)
    if (!result.ok) {
      report({ code: 'config.invalid-stored', message: `stored config for "${variant}" is invalid; using defaults`, detail: result.errors })
      return state
    }
    return { ...state, [variant]: result.value }
  }, {})
}

/**
 * Framework-agnostic store (D9). The single mutable point is `state`; only update/reset replace it,
 * always with a new object, so `getSnapshot` is referentially stable between changes.
 * React reads it via useSyncExternalStore; custom elements call `subscribe` directly.
 */
export const createConfigStore = (
  storage: KeyValueStorage,
  key: string = CONFIG_STORAGE_KEY,
  report: Reporter = consoleReporter,
): ConfigStore => {
  let state: ConfigState = loadConfigState(storage, key, report)
  const listeners = new Set<() => void>()

  const commit = (next: ConfigState) => {
    state = next
    try {
      storage.setItem(key, JSON.stringify(next))
    } catch (error) {
      // Private mode / quota: keep the in-memory change, surface the failure.
      report({ code: 'config.persist-failed', message: 'could not persist card config', detail: error })
    }
    listeners.forEach((listener) => listener())
  }

  const getSnapshot = () => state

  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  const update = (variant: CardVariant, patch: CardConfigPatch) => {
    const next = applyPatch(state[variant] ?? defaultCardConfig, patch)
    if (!next) {
      report({ code: 'config.invalid-update', message: `rejected invalid update for "${variant}"`, detail: patch })
      return
    }
    commit({ ...state, [variant]: next })
  }

  const reset = (variant: CardVariant) => {
    if (!(variant in state)) return
    const { [variant]: _removed, ...rest } = state
    commit(rest)
  }

  return { getSnapshot, subscribe, update, reset }
}

/** Selector with a stable fallback — safe to use inside useSyncExternalStore's getSnapshot. */
export const selectConfig = (state: ConfigState, variant: CardVariant): CardConfig =>
  state[variant] ?? defaultCardConfig
