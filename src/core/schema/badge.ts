import * as yup from 'yup'

/**
 * Slots are the only badge concept the card layout knows about.
 * Which badge goes into which slot is decided by badge plugins (see badge-registry).
 * Derived from observed momo search-result cards (docs/decisions.md D4).
 */
export type BadgeSlot =
  | 'image-top-left' //     e.g. 限時加碼 8%
  | 'image-bottom-left' //  e.g. mo點3%、免運券、$190超取免運 (stacked)
  | 'image-bottom-right' // e.g. Ad、官方
  | 'title-prefix' //       e.g. 店+、好店

/** Minimum shape of a raw badge; plugin-specific fields are validated by each plugin's own schema. */
export type RawBadge = {
  type: string
}

export const badgeSlots: readonly BadgeSlot[] = [
  'image-top-left',
  'image-bottom-left',
  'image-bottom-right',
  'title-prefix',
]

export const rawBadgeSchema: yup.ObjectSchema<RawBadge> = yup.object({
  type: yup.string().required(),
})
