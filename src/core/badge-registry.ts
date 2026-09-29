import type { Schema } from 'yup'
import { rawBadgeSchema, type BadgeSlot } from './schema/badge'
import { consoleReporter, type Reporter } from './report'
import { safeValidate } from './validation'

/**
 * Declarative badge output — plain data, framework-free. Every badge (built-in or registered by a host)
 * resolves to this shape and cards render it uniformly. Extend with optional fields (e.g. `shape`, `icon`)
 * when a badge needs more than a coloured label.
 */
export type BadgeView = {
  label: string
  color: string
}

/**
 * A badge plugin as stored in the registry: its payload schema, the slot it occupies, and its view.
 * `view` returns null when it cannot produce a valid BadgeView (only host-registered plugins do; see external-badge).
 */
export type BadgePlugin = {
  type: string
  slot: BadgeSlot
  schema: Schema<unknown>
  view: (data: unknown) => BadgeView | null
}

export type BadgeRegistry = ReadonlyMap<string, BadgePlugin>

export type ResolvedBadge = {
  type: string
  slot: BadgeSlot
  view: BadgeView
}

export type BadgesBySlot = Partial<Record<BadgeSlot, ResolvedBadge[]>>

/**
 * Keeps each plugin's `view` typed against its own schema at definition time.
 * The single erasure point: the registry only calls `view` with data that passed `schema`.
 */
export const defineBadge = <T>(plugin: {
  type: string
  slot: BadgeSlot
  schema: Schema<T>
  view: (data: T) => BadgeView
}): BadgePlugin => plugin as unknown as BadgePlugin

/**
 * Returns a new registry; never mutates the input.
 * Duplicate types are rejected (existing plugin kept) so an extension cannot silently replace a built-in.
 */
export const registerBadge = (
  registry: BadgeRegistry,
  plugin: BadgePlugin,
  report: Reporter = consoleReporter,
): BadgeRegistry => {
  if (registry.has(plugin.type)) {
    report({
      code: 'badge.duplicate-type',
      message: `badge type "${plugin.type}" is already registered; keeping the existing plugin`,
    })
    return registry
  }
  return new Map(registry).set(plugin.type, plugin)
}

export const createBadgeRegistry = (
  plugins: readonly BadgePlugin[],
  report: Reporter = consoleReporter,
): BadgeRegistry =>
  plugins.reduce<BadgeRegistry>((registry, plugin) => registerBadge(registry, plugin, report), new Map())

const resolveOne = (
  registry: BadgeRegistry,
  raw: unknown,
  index: number,
  report: Reporter,
): ResolvedBadge | null => {
  const shape = safeValidate(rawBadgeSchema, raw)
  if (!shape.ok) {
    report({ code: 'badge.invalid-shape', message: `badges[${index}] has no valid "type"`, detail: raw })
    return null
  }
  const plugin = registry.get(shape.value.type)
  if (!plugin) {
    report({ code: 'badge.unknown-type', message: `badges[${index}] type "${shape.value.type}" is not registered`, detail: raw })
    return null
  }
  const payload = safeValidate(plugin.schema, raw)
  if (!payload.ok) {
    report({
      code: 'badge.invalid-payload',
      message: `badges[${index}] "${plugin.type}" payload is invalid`,
      detail: payload.errors,
    })
    return null
  }
  const view = plugin.view(payload.value)
  if (!view) {
    report({ code: 'badge.invalid-view', message: `badges[${index}] "${plugin.type}" view did not return a valid badge`, detail: raw })
    return null
  }
  return { type: plugin.type, slot: plugin.slot, view }
}

/**
 * Resolves badges one by one: a bad item is skipped and reported, the rest still render (D6).
 */
export const resolveBadges = (
  registry: BadgeRegistry,
  rawBadges: readonly unknown[],
  report: Reporter = consoleReporter,
): ResolvedBadge[] =>
  rawBadges.flatMap((raw, index) => {
    const resolved = resolveOne(registry, raw, index, report)
    return resolved ? [resolved] : []
  })

export const groupBySlot = (badges: readonly ResolvedBadge[]): BadgesBySlot =>
  badges.reduce<BadgesBySlot>(
    (groups, badge) => ({ ...groups, [badge.slot]: [...(groups[badge.slot] ?? []), badge] }),
    {},
  )
