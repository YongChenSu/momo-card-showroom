import { isRecord } from './card-config'

type Config = Record<string, unknown>

/** One step per schema change: key = version it upgrades FROM (result is stamped key + 1). */
export type Migrations = Readonly<Record<number, (config: Config) => Config>>

export type MigrationResult = { ok: true; value: unknown } | { ok: false; reason: string }

/**
 * Real history of CardConfig. Bump CARD_CONFIG_SCHEMA_VERSION together with a new entry here,
 * so stored configs from older builds are upgraded instead of being reset to defaults.
 * 0 → 1: configs written before versioning existed have the same shape and only lack `schemaVersion`.
 */
export const cardConfigMigrations: Migrations = {
  0: (config) => config,
}

/**
 * Upgrades a stored config step by step to `current`. Runs before schema validation (the schema only
 * knows the current shape). A config from a newer build cannot be downgraded, so it fails instead.
 * Non-objects pass through untouched and are left for validation to reject.
 */
export const migrateConfig = (raw: unknown, current: number, migrations: Migrations): MigrationResult => {
  if (!isRecord(raw)) return { ok: true, value: raw }
  const from = raw.schemaVersion ?? 0
  if (typeof from !== 'number' || !Number.isInteger(from)) {
    return { ok: false, reason: `schemaVersion ${JSON.stringify(raw.schemaVersion)} is not an integer` }
  }
  if (from > current) return { ok: false, reason: `schemaVersion ${from} is newer than supported ${current}` }
  if (from === current) return { ok: true, value: raw }

  let config: Config = raw
  for (let version = from; version < current; version += 1) {
    const step = migrations[version]
    if (!step) return { ok: false, reason: `no migration from schemaVersion ${version}` }
    config = { ...step(config), schemaVersion: version + 1 }
  }
  return { ok: true, value: config }
}
