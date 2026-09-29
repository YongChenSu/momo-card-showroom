import * as yup from 'yup'
import { createBadgeRegistry, defineBadge, type BadgePlugin } from '../../core/badge-registry'

type StoreTagKind = 'mo-store-plus' | 'good-store'

const STORE_TAG_VIEW: Record<StoreTagKind, { label: string; color: string }> = {
  'mo-store-plus': { label: '店+', color: '#5b5ea6' },
  'good-store': { label: '好店', color: '#e60012' },
}

/** mo點3% — cashback in momo points */
const moPoints = defineBadge({
  type: 'mo-points',
  slot: 'image-bottom-left',
  schema: yup.object({ percent: yup.number().positive().max(100).required() }),
  view: ({ percent }) => ({ label: `mo點${percent}%`, color: '#f39800' }),
})

/** 免運券 */
const freeShippingCoupon = defineBadge({
  type: 'free-shipping-coupon',
  slot: 'image-bottom-left',
  schema: yup.object({}),
  view: () => ({ label: '免運券', color: '#f39800' }),
})

/** 限時加碼 8% */
const limitedBonus = defineBadge({
  type: 'limited-bonus',
  slot: 'image-top-left',
  schema: yup.object({ percent: yup.number().positive().max(100).required() }),
  view: ({ percent }) => ({ label: `限時加碼 ${percent}%`, color: '#e60012' }),
})

/** Ad */
const ad = defineBadge({
  type: 'ad',
  slot: 'image-bottom-right',
  schema: yup.object({}),
  view: () => ({ label: 'Ad', color: '#9e9e9e' }),
})

/** 店+ / 好店 — prefix before the title */
const storeTag = defineBadge({
  type: 'store-tag',
  slot: 'title-prefix',
  schema: yup.object({
    kind: yup.string().oneOf(['mo-store-plus', 'good-store'] as const).required(),
  }),
  view: ({ kind }) => STORE_TAG_VIEW[kind],
})

export const builtinBadges: readonly BadgePlugin[] = [moPoints, freeShippingCoupon, limitedBonus, ad, storeTag]

export const builtinBadgeRegistry = createBadgeRegistry(builtinBadges)
