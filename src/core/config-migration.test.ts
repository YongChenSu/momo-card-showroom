import { describe, expect, test, vi } from 'vitest'
import { CONFIG_STORAGE_KEY, loadConfigState, type KeyValueStorage } from './config-store'
import { migrateConfig, type Migrations } from './config-migration'
import type { ReportEvent } from './report'

// Fake history: v1 renamed nothing, v2 renamed `accent` → `theme.priceColor`, v3 added `titleLines`.
const fakeMigrations: Migrations = {
  1: ({ accent, ...rest }) => ({ ...rest, theme: { priceColor: accent } }),
  2: (config) => ({ ...config, titleLines: 2 }),
}

describe('migrateConfig', () => {
  test('applies each step in order and stamps the new version', () => {
    const result = migrateConfig({ schemaVersion: 1, accent: '#123456' }, 3, fakeMigrations)
    expect(result).toEqual({
      ok: true,
      value: { schemaVersion: 3, theme: { priceColor: '#123456' }, titleLines: 2 },
    })
  })

  test('current version passes through unchanged (same reference)', () => {
    const config = { schemaVersion: 3, titleLines: 1 }
    const result = migrateConfig(config, 3, fakeMigrations)
    expect(result.ok && result.value).toBe(config)
  })

  test('missing schemaVersion is treated as version 0', () => {
    const result = migrateConfig({ titleLines: 1 }, 1, { 0: (config) => config })
    expect(result).toEqual({ ok: true, value: { titleLines: 1, schemaVersion: 1 } })
  })

  test.each([
    ['newer than supported', { schemaVersion: 4 }],
    ['no migration step from that version', { schemaVersion: 0 }],
    ['version is not an integer', { schemaVersion: '1' }],
  ])('fails when %s', (_case, config) => {
    expect(migrateConfig(config, 3, fakeMigrations).ok).toBe(false)
  })
})

describe('loadConfigState with migration', () => {
  const load = (stored: unknown) => {
    const report = vi.fn<(event: ReportEvent) => void>()
    const storage: KeyValueStorage = {
      getItem: () => JSON.stringify(stored),
      setItem: () => undefined,
    }
    const state = loadConfigState(storage, CONFIG_STORAGE_KEY, report)
    return { state, codes: report.mock.calls.map(([event]) => event.code) }
  }

  test('a pre-versioning config (no schemaVersion) is migrated and kept', () => {
    const { state, codes } = load({ grid: { titleLines: 3 } })
    expect(state.grid?.titleLines).toBe(3)
    expect(state.grid?.schemaVersion).toBe(1)
    expect(codes).toEqual([])
  })

  test('a config from a newer build is dropped and reported, other variants survive', () => {
    const { state, codes } = load({ grid: { schemaVersion: 99, titleLines: 3 }, compact: { schemaVersion: 1, titleLines: 1 } })
    expect(state.grid).toBeUndefined()
    expect(state.compact?.titleLines).toBe(1)
    expect(codes).toEqual(['config.unsupported-version'])
  })
})
