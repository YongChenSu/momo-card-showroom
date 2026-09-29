import { z } from 'zod'
import { badgeSlots, type BadgeSlot } from './badge'

export const cardVariants = ['grid', 'compact'] as const
export const cardVariantSchema = z.enum(cardVariants)
export type CardVariant = z.infer<typeof cardVariantSchema>

export const CARD_CONFIG_SCHEMA_VERSION = 1

const slotVisibilityShape = Object.fromEntries(
  badgeSlots.map((slot) => [slot, z.boolean().default(true)]),
) as Record<BadgeSlot, z.ZodDefault<z.ZodBoolean>>

/**
 * Presentation settings — the only state the showroom owns and persists (D7).
 * One config per variant. `.prefault({})` (not `.default({})`) so nested defaults
 * are still applied when a whole section is missing (Zod 4 semantics).
 */
export const cardConfigSchema = z.object({
  schemaVersion: z.literal(CARD_CONFIG_SCHEMA_VERSION).default(CARD_CONFIG_SCHEMA_VERSION),
  fields: z
    .object({
      originalPrice: z.boolean().default(true),
      promoText: z.boolean().default(true),
      rating: z.boolean().default(true),
      soldCount: z.boolean().default(true),
    })
    .prefault({}),
  slots: z.object(slotVisibilityShape).prefault({}),
  titleLines: z.number().int().min(1).max(3).default(2),
  theme: z
    .object({
      priceColor: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .default('#e4007f'),
      radius: z.number().int().min(0).max(24).default(8),
    })
    .prefault({}),
})

export type CardConfig = z.infer<typeof cardConfigSchema>
export type CardConfigInput = z.input<typeof cardConfigSchema>
