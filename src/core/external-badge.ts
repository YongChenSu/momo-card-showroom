import * as yup from 'yup'
import { registerBadge, type BadgePlugin, type BadgeRegistry, type BadgeView } from './badge-registry'
import { badgeSlots, type BadgeSlot } from './schema/badge'
import { consoleReporter, type Reporter } from './report'
import { safeValidate } from './validation'

/**
 * What a host page passes to `MomoCards.registerBadge` — declarative and framework-free (D6 option A).
 * `view` receives the raw badge object from the product data and returns a label + colour.
 */
export type ExternalBadgeInput = {
  type: string
  slot: BadgeSlot
  view: (data: Record<string, unknown>) => BadgeView
}

export type BadgeRegistryStore = {
  getSnapshot: () => BadgeRegistry
  subscribe: (listener: () => void) => () => void
  /** Returns false when the plugin was rejected (duplicate type). */
  register: (plugin: BadgePlugin) => boolean
}

type ExternalBadgeShape = Pick<ExternalBadgeInput, 'type' | 'slot'>

const externalBadgeSchema: yup.ObjectSchema<ExternalBadgeShape> = yup.object({
  type: yup.string().trim().min(1).required(),
  slot: yup.mixed<BadgeSlot>().oneOf(badgeSlots).required(),
})

const badgeViewSchema: yup.ObjectSchema<BadgeView> = yup.object({
  label: yup.string().min(1).required(),
  color: yup.string().min(1).required(),
})

// Host payloads have no schema of their own; mixed() passes the raw badge through untouched.
const anyPayload = yup.mixed<Record<string, unknown>>()

/**
 * Boundary for host-supplied plugins: the definition is validated here, and the host's `view` is
 * wrapped so a throw or a malformed result becomes null (→ badge skipped and reported) instead of breaking the card.
 */
export const createExternalBadge = (input: unknown, report: Reporter = consoleReporter): BadgePlugin | null => {
  const shape = safeValidate(externalBadgeSchema, input)
  const view = typeof input === 'object' && input !== null && 'view' in input ? input.view : undefined
  if (!shape.ok || typeof view !== 'function') {
    report({
      code: 'badge.invalid-plugin',
      message: 'registerBadge expects { type: string, slot: BadgeSlot, view: (data) => { label, color } }',
      detail: shape.ok ? 'view is not a function' : shape.errors,
    })
    return null
  }
  const safeView = (data: unknown): BadgeView | null => {
    try {
      const result = safeValidate(badgeViewSchema, view(data))
      return result.ok ? result.value : null
    } catch {
      return null
    }
  }
  return { type: shape.value.type, slot: shape.value.slot, schema: anyPayload, view: safeView }
}

/**
 * The one controlled mutable point for badges (D6): the registry itself stays immutable,
 * this store swaps in a new one on registration so already-rendered cards re-resolve their badges.
 */
export const createBadgeRegistryStore = (
  initial: BadgeRegistry,
  report: Reporter = consoleReporter,
): BadgeRegistryStore => {
  let registry = initial
  const listeners = new Set<() => void>()

  const register = (plugin: BadgePlugin) => {
    const next = registerBadge(registry, plugin, report)
    if (next === registry) return false
    registry = next
    listeners.forEach((listener) => listener())
    return true
  }

  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  return { getSnapshot: () => registry, subscribe, register }
}
