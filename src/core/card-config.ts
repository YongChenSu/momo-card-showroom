import { cardConfigSchema, type CardConfig } from './schema/card-config'
import { consoleReporter, type Reporter } from './report'
import { safeValidate } from './validation'

/** Partial update from the adjustment panel or a host `config` attribute; nested sections merge shallowly. */
export type CardConfigPatch = {
  fields?: Partial<CardConfig['fields']>
  slots?: Partial<CardConfig['slots']>
  titleLines?: number
  theme?: Partial<CardConfig['theme']>
}

type Section = 'fields' | 'slots' | 'theme'

const SECTIONS: readonly Section[] = ['fields', 'slots', 'theme']

/** Built once so selectors falling back to defaults return a stable reference (useSyncExternalStore). */
export const defaultCardConfig: CardConfig = Object.freeze(cardConfigSchema.validateSync({}))

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const mergeConfig = (base: CardConfig, patch: CardConfigPatch): CardConfig => ({
  ...base,
  ...(patch.titleLines !== undefined && { titleLines: patch.titleLines }),
  fields: { ...base.fields, ...patch.fields },
  slots: { ...base.slots, ...patch.slots },
  theme: { ...base.theme, ...patch.theme },
})

/**
 * Merges an untrusted patch and validates the result. Returns null when the patch is not an object,
 * has a non-object section, or produces an invalid config — callers decide how to report.
 */
export const applyPatch = (base: CardConfig, patch: unknown): CardConfig | null => {
  if (!isRecord(patch)) return null
  if (SECTIONS.some((section) => patch[section] !== undefined && !isRecord(patch[section]))) return null
  const result = safeValidate(cardConfigSchema, mergeConfig(base, patch as CardConfigPatch))
  return result.ok ? result.value : null
}

/**
 * Precedence (D8 ③): host `config` attribute > stored config for the variant > schema defaults.
 * An invalid attribute is reported and ignored rather than breaking the card.
 */
export const resolveCardConfig = (
  stored: CardConfig | undefined,
  attributeConfig: unknown,
  report: Reporter = consoleReporter,
): CardConfig => {
  const base = stored ?? defaultCardConfig
  if (attributeConfig === undefined) return base
  const resolved = applyPatch(base, attributeConfig)
  if (resolved) return resolved
  report({ code: 'config.invalid-attribute', message: 'ignoring invalid "config" attribute', detail: attributeConfig })
  return base
}
