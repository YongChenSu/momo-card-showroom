import { cardDefinitions, type CardField } from '../../cards'
import type { BadgeSlot } from '../../core/schema/badge'
import type { CardVariant } from '../../core/schema/card-config'
import { configStore } from '../../embed'
import type { ProductCoverage } from '../product-coverage'
import { useCardConfig } from '../use-card-config'

type ConfigPanelProps = {
  variant: CardVariant
  /** What the previewed product has data for; toggles outside it are marked, since they show no change. */
  coverage?: ProductCoverage
}

const NO_DATA_HINT = '（預覽商品無此資料）'

const FIELD_LABELS: Record<CardField, string> = {
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

/**
 * Writes go through store.update (validated + persisted); the panel re-reads the store,
 * so what it shows is always what was accepted — never local component state.
 */
export const ConfigPanel = ({ variant, coverage }: ConfigPanelProps) => {
  const config = useCardConfig(variant)
  // Only offer what this variant renders, so no toggle is a silent no-op.
  const { fields, slots } = cardDefinitions[variant]

  return (
    <aside className="panel">
      <h2>調整（{variant}）</h2>

      <fieldset>
        <legend>顯示欄位</legend>
        {fields.map((key) => (
          <label key={key} className="check">
            <input
              type="checkbox"
              checked={config.fields[key]}
              onChange={(event) => configStore.update(variant, { fields: { [key]: event.target.checked } })}
            />
            {FIELD_LABELS[key]}
            {coverage && !coverage.fields.has(key) && <span className="hint">{NO_DATA_HINT}</span>}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>角標位置</legend>
        {slots.map((slot) => (
          <label key={slot} className="check">
            <input
              type="checkbox"
              checked={config.slots[slot]}
              onChange={(event) => configStore.update(variant, { slots: { [slot]: event.target.checked } })}
            />
            {SLOT_LABELS[slot]}
            {coverage && !coverage.slots.has(slot) && <span className="hint">{NO_DATA_HINT}</span>}
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
