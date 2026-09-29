import { useMemo } from 'react'
import { groupBySlot, resolveBadges, type BadgeRegistry, type BadgesBySlot } from '../../core/badge-registry'

/** Resolves once per badges/registry change so skipped-badge reports aren't repeated on every render. */
export const useBadges = (rawBadges: readonly unknown[], registry: BadgeRegistry): BadgesBySlot =>
  useMemo(() => groupBySlot(resolveBadges(registry, rawBadges)), [rawBadges, registry])
