import { badgeSlots, type BadgeSlot } from '../../core/schema/badge'
import type { CardConfig, CardVariant } from '../../core/schema/card-config'
import { configStore } from '../../embed'
import { useCardConfig } from '../use-card-config'

type ConfigPanelProps = {
  variant: CardVariant
}

type FieldKey = keyof CardConfig['fields']

const FIELD_LABELS: Record<FieldKey, string> = {
  originalPrice: '原價',
  promoText: '促銷文案',
  rating: '評分',
  soldCount: '總銷量',
}

const SLOT_LABELS: Record<BadgeSlot, string> = {
  'image-top-left': '圖片左上角標',
  'image-bottom-left': '圖片左下角標',
  'image-bottom-right': '圖片右下角標（Ad）',
  'title-prefix': '標題前綴（店+ / 好店）',
}

const fieldKeys = Object.keys(FIELD_LABELS) as FieldKey[]

/**
 * Writes go through store.update (validated + persisted); the panel re-reads the store,
 * so what it shows is always what was accepted — never local component state.
 */
export const ConfigPanel = ({ variant }: ConfigPanelProps) => {
  const config = useCardConfig(variant)

  return (
    <aside className="panel">
      <h2>調整（{variant}）</h2>

      <fieldset>
        <legend>顯示欄位</legend>
        {fieldKeys.map((key) => (
          <label key={key} className="check">
            <input
              type="checkbox"
              checked={config.fields[key]}
              onChange={(event) => configStore.update(variant, { fields: { [key]: event.target.checked } })}
            />
            {FIELD_LABELS[key]}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>角標位置</legend>
        {badgeSlots.map((slot) => (
          <label key={slot} className="check">
            <input
              type="checkbox"
              checked={config.slots[slot]}
              onChange={(event) => configStore.update(variant, { slots: { [slot]: event.target.checked } })}
            />
            {SLOT_LABELS[slot]}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>版面</legend>
        <label className="field">
          標題行數：{config.titleLines}
          <input
            type="range"
            min={1}
            max={3}
            value={config.titleLines}
            onChange={(event) => configStore.update(variant, { titleLines: Number(event.target.value) })}
          />
        </label>
        <label className="field">
          圓角：{config.theme.radius}px
          <input
            type="range"
            min={0}
            max={24}
            value={config.theme.radius}
            onChange={(event) => configStore.update(variant, { theme: { radius: Number(event.target.value) } })}
          />
        </label>
        <label className="field">
          價格顏色
          <input
            type="color"
            value={config.theme.priceColor}
            onChange={(event) => configStore.update(variant, { theme: { priceColor: event.target.value } })}
          />
        </label>
      </fieldset>

      <button type="button" onClick={() => configStore.reset(variant)}>
        還原預設
      </button>
      <p className="hint">設定存於 localStorage（以 variant 為單位），重新整理後保留。</p>
    </aside>
  )
}
