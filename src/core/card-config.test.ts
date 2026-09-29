import { describe, expect, test, vi } from 'vitest'
import { applyPatch, defaultCardConfig, resolveCardConfig } from './card-config'
import type { ReportEvent } from './report'

const stored = applyPatch(defaultCardConfig, { titleLines: 1, theme: { radius: 0 } })!

describe('resolveCardConfig precedence: attribute > stored > defaults', () => {
  test('no stored, no attribute → defaults', () => {
    expect(resolveCardConfig(undefined, undefined)).toBe(defaultCardConfig)
  })

  test('stored wins over defaults', () => {
    expect(resolveCardConfig(stored, undefined)).toBe(stored)
  })

  test('attribute overrides stored, stored fills the rest', () => {
    const config = resolveCardConfig(stored, { titleLines: 3 })
    expect(config.titleLines).toBe(3)
    expect(config.theme.radius).toBe(0)
  })

  test.each([
    ['not an object', 'grid'],
    ['non-object section', { fields: 'x' }],
    ['invalid value', { titleLines: 99 }],
  ])('invalid attribute (%s) is reported and ignored', (_label, attribute) => {
    const report = vi.fn<(event: ReportEvent) => void>()
    expect(resolveCardConfig(stored, attribute, report)).toBe(stored)
    expect(report.mock.calls.map(([e]) => e.code)).toEqual(['config.invalid-attribute'])
  })
})
