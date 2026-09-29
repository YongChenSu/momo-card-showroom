import { describe, expect, test, vi } from 'vitest'
import { defaultCardConfig } from './card-config'
import { CONFIG_STORAGE_KEY, createConfigStore, selectConfig, type KeyValueStorage } from './config-store'
import type { ReportEvent } from './report'

const createMemoryStorage = (initial?: string) => {
  const data = new Map<string, string>(initial === undefined ? [] : [[CONFIG_STORAGE_KEY, initial]])
  const storage: KeyValueStorage = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  }
  return { storage, read: () => data.get(CONFIG_STORAGE_KEY) }
}

const setup = (initial?: string) => {
  const report = vi.fn<(event: ReportEvent) => void>()
  const { storage, read } = createMemoryStorage(initial)
  const store = createConfigStore(storage, CONFIG_STORAGE_KEY, report)
  const codes = () => report.mock.calls.map(([event]) => event.code)
  return { store, report, read, codes }
}

describe('load', () => {
  test('empty storage → empty state, defaults via selector (stable reference)', () => {
    const { store, report } = setup()
    expect(store.getSnapshot()).toEqual({})
    expect(selectConfig(store.getSnapshot(), 'grid')).toBe(defaultCardConfig)
    expect(report).not.toHaveBeenCalled()
  })

  test('corrupt JSON → defaults + report', () => {
    const { store, codes } = setup('{not json')
    expect(store.getSnapshot()).toEqual({})
    expect(codes()).toEqual(['config.invalid-json'])
  })

  test('validates each variant independently', () => {
    const { store, codes } = setup(
      JSON.stringify({ grid: { titleLines: 1 }, compact: { titleLines: 99 }, legacy: {} }),
    )
    expect(selectConfig(store.getSnapshot(), 'grid').titleLines).toBe(1)
    expect(selectConfig(store.getSnapshot(), 'compact')).toBe(defaultCardConfig)
    expect(codes()).toEqual(['config.invalid-stored', 'config.unknown-variant'])
  })

  test('strips unknown keys from stored config', () => {
    const { store } = setup(JSON.stringify({ grid: { titleLines: 1, evil: '<script>' } }))
    expect(store.getSnapshot().grid).not.toHaveProperty('evil')
  })
})

describe('update / reset', () => {
  test('merges nested patch, persists, notifies, and produces a new snapshot reference', () => {
    const { store, read } = setup()
    const listener = vi.fn()
    store.subscribe(listener)
    const before = store.getSnapshot()

    store.update('grid', { fields: { rating: false } })

    const after = store.getSnapshot()
    expect(after).not.toBe(before)
    expect(after.grid?.fields).toMatchObject({ rating: false, soldCount: true })
    expect(listener).toHaveBeenCalledTimes(1)
    expect(JSON.parse(read() ?? '{}').grid.fields.rating).toBe(false)
  })

  test('snapshot is referentially stable when nothing changes', () => {
    const { store } = setup()
    expect(store.getSnapshot()).toBe(store.getSnapshot())
    store.update('grid', { titleLines: 1 })
    const snapshot = store.getSnapshot()
    expect(store.getSnapshot()).toBe(snapshot)
    // an untouched variant keeps its reference across updates of another variant
    store.update('compact', { titleLines: 3 })
    expect(store.getSnapshot().grid).toBe(snapshot.grid)
  })

  test('invalid update is rejected: state unchanged, no notify, reported', () => {
    const { store, codes } = setup()
    const listener = vi.fn()
    store.subscribe(listener)
    const before = store.getSnapshot()
    store.update('grid', { theme: { priceColor: 'red' } })
    expect(store.getSnapshot()).toBe(before)
    expect(listener).not.toHaveBeenCalled()
    expect(codes()).toEqual(['config.invalid-update'])
  })

  test('reset removes the variant; resetting an absent variant is a no-op', () => {
    const { store } = setup()
    const listener = vi.fn()
    store.update('grid', { titleLines: 1 })
    store.subscribe(listener)
    store.reset('grid')
    expect(store.getSnapshot().grid).toBeUndefined()
    const afterReset = store.getSnapshot()
    store.reset('grid')
    expect(store.getSnapshot()).toBe(afterReset)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  test('unsubscribe stops notifications', () => {
    const { store } = setup()
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)
    unsubscribe()
    store.update('grid', { titleLines: 1 })
    expect(listener).not.toHaveBeenCalled()
  })

  test('persist failure keeps in-memory change and reports', () => {
    const report = vi.fn<(event: ReportEvent) => void>()
    const storage: KeyValueStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
    }
    const store = createConfigStore(storage, CONFIG_STORAGE_KEY, report)
    store.update('grid', { titleLines: 1 })
    expect(store.getSnapshot().grid?.titleLines).toBe(1)
    expect(report.mock.calls.map(([e]) => e.code)).toEqual(['config.persist-failed'])
  })
})
