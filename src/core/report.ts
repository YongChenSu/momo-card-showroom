/**
 * Single exit for every degradation (skipped badge, invalid config, bad attribute JSON…).
 * Nothing may fail silently (CLAUDE.md). Today it logs; this is the hook for Sentry/Rollbar later.
 */
export type ReportCode =
  | 'badge.invalid-shape'
  | 'badge.unknown-type'
  | 'badge.invalid-payload'
  | 'badge.duplicate-type'
  | 'config.invalid-json'
  | 'config.invalid-stored'
  | 'config.unknown-variant'
  | 'config.invalid-update'
  | 'config.invalid-attribute'
  | 'config.persist-failed'

export type ReportEvent = {
  code: ReportCode
  message: string
  detail?: unknown
}

export type Reporter = (event: ReportEvent) => void

export const REPORT_PREFIX = '[momo-cards]'

export const consoleReporter: Reporter = ({ code, message, detail }) =>
  console.warn(`${REPORT_PREFIX} ${code}: ${message}`, detail ?? '')
