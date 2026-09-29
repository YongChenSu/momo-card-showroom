import { describe, expect, test, vi } from 'vitest'
import * as yup from 'yup'
import {
  createBadgeRegistry,
  defineBadge,
  groupBySlot,
  registerBadge,
  resolveBadges,
} from './badge-registry'
import type { ReportEvent } from './report'

const moPoints = defineBadge({
  type: 'mo-points',
  slot: 'image-bottom-left',
  schema: yup.object({ percent: yup.number().positive().required() }),
  view: ({ percent }) => ({ label: `mo點${percent}%`, color: '#e4007f' }),
})
const ad = defineBadge({
  type: 'ad',
  slot: 'image-bottom-right',
  schema: yup.object({}),
  view: () => ({ label: 'Ad', color: '#999999' }),
})

const setup = () => {
  const report = vi.fn<(event: ReportEvent) => void>()
  const registry = createBadgeRegistry([moPoints, ad], report)
  return { report, registry }
}

const codes = (report: ReturnType<typeof setup>['report']) => report.mock.calls.map(([event]) => event.code)

describe('resolveBadges', () => {
  test('resolves valid badges in order with slot and view', () => {
    const { registry, report } = setup()
    const result = resolveBadges(registry, [{ type: 'mo-points', percent: 3 }, { type: 'ad' }], report)
    expect(result).toEqual([
      { type: 'mo-points', slot: 'image-bottom-left', view: { label: 'mo點3%', color: '#e4007f' } },
      { type: 'ad', slot: 'image-bottom-right', view: { label: 'Ad', color: '#999999' } },
    ])
    expect(report).not.toHaveBeenCalled()
  })

  test('skips unknown type, keeps the rest', () => {
    const { registry, report } = setup()
    const result = resolveBadges(registry, [{ type: 'anniversary' }, { type: 'ad' }], report)
    expect(result.map((b) => b.type)).toEqual(['ad'])
    expect(codes(report)).toEqual(['badge.unknown-type'])
  })

  test('skips invalid payload, keeps the rest', () => {
    const { registry, report } = setup()
    const result = resolveBadges(registry, [{ type: 'mo-points', percent: 'abc' }, { type: 'ad' }], report)
    expect(result.map((b) => b.type)).toEqual(['ad'])
    expect(codes(report)).toEqual(['badge.invalid-payload'])
  })

  test('skips items without a valid type', () => {
    const { registry, report } = setup()
    const result = resolveBadges(registry, [null, 'ad', { type: '' }, {}], report)
    expect(result).toEqual([])
    expect(codes(report)).toEqual(Array(4).fill('badge.invalid-shape'))
  })
})

describe('registerBadge', () => {
  test('returns a new registry and leaves the original untouched', () => {
    const { registry, report } = setup()
    const custom = defineBadge({ type: 'anniversary', slot: 'image-top-left', schema: yup.object({}), view: () => ({ label: '週年慶', color: '#c00000' }) })
    const next = registerBadge(registry, custom, report)
    expect(next).not.toBe(registry)
    expect(registry.has('anniversary')).toBe(false)
    expect(resolveBadges(next, [{ type: 'anniversary' }], report).map((b) => b.view.label)).toEqual(['週年慶'])
  })

  test('rejects duplicate type and keeps the existing plugin', () => {
    const { registry, report } = setup()
    const hijack = defineBadge({ type: 'ad', slot: 'title-prefix', schema: yup.object({}), view: () => ({ label: 'HIJACK', color: '#000000' }) })
    const next = registerBadge(registry, hijack, report)
    expect(next).toBe(registry)
    expect(codes(report)).toEqual(['badge.duplicate-type'])
    expect(resolveBadges(next, [{ type: 'ad' }], report)[0]?.view.label).toBe('Ad')
  })
})

test('groupBySlot groups while preserving order', () => {
  const { registry, report } = setup()
  const resolved = resolveBadges(
    registry,
    [{ type: 'mo-points', percent: 3 }, { type: 'ad' }, { type: 'mo-points', percent: 5 }],
    report,
  )
  const groups = groupBySlot(resolved)
  expect(groups['image-bottom-left']?.map((b) => b.view.label)).toEqual(['mo點3%', 'mo點5%'])
  expect(groups['image-bottom-right']?.map((b) => b.view.label)).toEqual(['Ad'])
  expect(groups['title-prefix']).toBeUndefined()
})
