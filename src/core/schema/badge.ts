import { z } from 'zod'

/**
 * Slots are the only badge concept the card layout knows about.
 * Which badge goes into which slot is decided by badge plugins (see T3 registry).
 * Derived from observed momo search-result cards (docs/decisions.md D4).
 */
export const badgeSlots = [
  'image-top-left', //     e.g. 限時加碼 8%
  'image-bottom-left', //  e.g. mo點3%、免運券、$190超取免運 (stacked)
  'image-bottom-right', // e.g. Ad、官方
  'title-prefix', //       e.g. 店+、好店
] as const

export const badgeSlotSchema = z.enum(badgeSlots)
export type BadgeSlot = z.infer<typeof badgeSlotSchema>

/**
 * Minimum shape of a raw badge. Plugin-specific fields are validated by
 * each plugin's own schema; unknown types are skipped, not rejected.
 */
export const rawBadgeSchema = z.looseObject({ type: z.string().min(1) })
export type RawBadge = z.infer<typeof rawBadgeSchema>
