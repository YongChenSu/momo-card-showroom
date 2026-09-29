import * as yup from 'yup'
import { badgeSlots, type BadgeSlot } from './badge'

export type CardVariant = 'grid' | 'compact'

/**
 * Presentation settings — the only state the showroom owns and persists (D7). One config per variant.
 */
export type CardConfig = {
  schemaVersion: typeof CARD_CONFIG_SCHEMA_VERSION
  fields: {
    originalPrice: boolean
    promoText: boolean
    rating: boolean
    soldCount: boolean
  }
  slots: Record<BadgeSlot, boolean>
  titleLines: number
  theme: {
    priceColor: string
    radius: number
  }
}

export const CARD_CONFIG_SCHEMA_VERSION = 1

export const cardVariants: readonly CardVariant[] = ['grid', 'compact']

const slotsSchema = yup.object(
  Object.fromEntries(badgeSlots.map((slot) => [slot, yup.boolean().default(true)])),
) as yup.ObjectSchema<Record<BadgeSlot, boolean>>

// yup builds nested object defaults from child defaults, so `{}` yields a fully populated config.
export const cardConfigSchema: yup.ObjectSchema<CardConfig> = yup.object({
  schemaVersion: yup
    .mixed<typeof CARD_CONFIG_SCHEMA_VERSION>()
    .oneOf([CARD_CONFIG_SCHEMA_VERSION])
    .default(CARD_CONFIG_SCHEMA_VERSION),
  fields: yup.object({
    originalPrice: yup.boolean().default(true),
    promoText: yup.boolean().default(true),
    rating: yup.boolean().default(true),
    soldCount: yup.boolean().default(true),
  }),
  slots: slotsSchema,
  titleLines: yup.number().integer().min(1).max(3).default(2),
  theme: yup.object({
    priceColor: yup
      .string()
      .matches(/^#[0-9a-fA-F]{6}$/)
      .default('#e4007f'),
    radius: yup.number().integer().min(0).max(24).default(8),
  }),
})
