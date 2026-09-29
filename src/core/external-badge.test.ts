import { describe, expect, test, vi } from 'vitest'
import { createBadgeRegistry, defineBadge, resolveBadges } from './badge-registry'
import { createBadgeRegistryStore, createExternalBadge } from './external-badge'
import type { ReportEvent } from './report'
import * as yup from 'yup'

const setup = () => {
  const report = vi.fn<(event: ReportEvent) => void>()
  const codes = () => report.mock.calls.map(([event]) => event.code)
  return { report, codes }
}

const anniversary = {
  type: 'anniversary',
  slot: 'image-top-left',
  view: (data: Record<string, unknown>) => ({ label: `${String(data.year)}週年`, color: '#d4145a' }),
}

describe('createExternalBadge', () => {
  test('turns a declarative host definition into a plugin that receives the raw payload', () => {
    const { report } = setup()
    const plugin = createExternalBadge(anniversary, report)
    expect(plugin).not.toBeNull()
    const registry = createBadgeRegistry(plugin ? [plugin] : [], report)
    expect(resolveBadges(registry, [{ type: 'anniversary', year: 30 }], report)).toEqual([
      { type: 'anniversary', slot: 'image-top-left', view: { label: '30週年', color: '#d4145a' } },
    ])
    expect(report).not.toHaveBeenCalled()
  })

  test.each([
    ['not an object', 'anniversary'],
    ['missing type', { slot: 'title-prefix', view: () => ({ label: 'x', color: '#000' }) }],
    ['unknown slot', { ...anniversary, slot: 'footer' }],
    ['view is not a function', { ...anniversary, view: { label: 'x', color: '#000' } }],
  ])('rejects invalid input (%s) and reports', (_case, input) => {
    const { report, codes } = setup()
    expect(createExternalBadge(input, report)).toBeNull()
    expect(codes()).toEqual(['badge.invalid-plugin'])
  })

  test.each([
    ['throws', () => {
      throw new Error('boom')
    }],
    ['returns an invalid view', () => ({ label: '', color: 42 })],
  ])('a view that %s skips only that badge and reports', (_case, view) => {
    const { report, codes } = setup()
    const broken = createExternalBadge({ type: 'broken', slot: 'title-prefix', view }, report)
    const ad = defineBadge({ type: 'ad', slot: 'image-bottom-right', schema: yup.object({}), view: () => ({ label: 'Ad', color: '#999' }) })
    const registry = createBadgeRegistry(broken ? [broken, ad] : [ad], report)
    const result = resolveBadges(registry, [{ type: 'broken' }, { type: 'ad' }], report)
    expect(result.map((badge) => badge.type)).toEqual(['ad'])
    expect(codes()).toEqual(['badge.invalid-view'])
  })
})

describe('createBadgeRegistryStore', () => {
  test('register returns a new snapshot and notifies subscribers', () => {
    const { report } = setup()
    const store = createBadgeRegistryStore(new Map(), report)
    const listener = vi.fn()
    store.subscribe(listener)
    const before = store.getSnapshot()
    const plugin = createExternalBadge(anniversary, report)
    expect(plugin && store.register(plugin)).toBe(true)
    expect(store.getSnapshot()).not.toBe(before)
    expect(store.getSnapshot().has('anniversary')).toBe(true)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  test('a duplicate type keeps the snapshot reference and does not notify', () => {
    const { report, codes } = setup()
    const plugin = createExternalBadge(anniversary, report)
    if (!plugin) throw new Error('fixture invalid')
    const store = createBadgeRegistryStore(new Map([[plugin.type, plugin]]), report)
    const listener = vi.fn()
    store.subscribe(listener)
    const before = store.getSnapshot()
    expect(store.register(plugin)).toBe(false)
    expect(store.getSnapshot()).toBe(before)
    expect(listener).not.toHaveBeenCalled()
    expect(codes()).toEqual(['badge.duplicate-type'])
  })
})
