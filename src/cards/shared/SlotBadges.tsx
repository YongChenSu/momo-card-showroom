import type { CSSProperties } from 'react'
import type { BadgesBySlot } from '../../core/badge-registry'
import type { BadgeSlot } from '../../core/schema/badge'
import type { CardConfig } from '../../core/schema/card-config'

type SlotBadgesProps = {
  slot: BadgeSlot
  badges: BadgesBySlot
  config: CardConfig
  className: string
}

/** Renders whatever plugins resolved into a slot; the card never knows which badge types exist. */
export const SlotBadges = ({ slot, badges, config, className }: SlotBadgesProps) => {
  const items = badges[slot]
  if (!config.slots[slot] || !items?.length) return null
  return (
    <span className={className} data-slot={slot}>
      {items.map(({ type, view }, index) => (
        <span
          key={`${type}-${index}`}
          className="badge"
          data-badge={type}
          style={{ '--badge-color': view.color } as CSSProperties}
        >
          {view.label}
        </span>
      ))}
    </span>
  )
}
