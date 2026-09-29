import { createRoot, type Root } from 'react-dom/client'
import { cardVariants, type CardVariant } from '../core/schema/card-config'
import { productSchema, type Product } from '../core/schema/product'
import { safeValidate } from '../core/validation'
import { CardHost } from './CardHost'
import { report } from './runtime'

type ParsedJson = { ok: true; value: unknown } | { ok: false }

export const TAG_NAME = 'momo-product-card'

const DEFAULT_VARIANT: CardVariant = 'grid'

const parseJson = (attribute: string, text: string): ParsedJson => {
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch (error) {
    report({ code: 'element.invalid-json', message: `"${attribute}" attribute is not valid JSON`, detail: error })
    return { ok: false }
  }
}

const parseVariant = (text: string | null): CardVariant => {
  if (text === null) return DEFAULT_VARIANT
  if ((cardVariants as readonly string[]).includes(text)) return text as CardVariant
  report({ code: 'element.unknown-variant', message: `unknown variant "${text}"; falling back to "${DEFAULT_VARIANT}"` })
  return DEFAULT_VARIANT
}

/** The card cannot render without a product, so an invalid one renders nothing (reported). */
const parseProduct = (text: string | null): Product | undefined => {
  if (text === null) return undefined
  const json = parseJson('product', text)
  if (!json.ok) return undefined
  const result = safeValidate(productSchema, json.value)
  if (result.ok) return result.value
  report({ code: 'element.invalid-product', message: 'invalid "product" attribute', detail: result.errors })
  return undefined
}

/** Invalid JSON is dropped here; resolveCardConfig validates and reports the rest. */
const parseConfig = (text: string | null): unknown => {
  if (text === null) return undefined
  const json = parseJson('config', text)
  return json.ok ? json.value : undefined
}

/**
 * Thin platform adapter (D3) — the only class in the codebase, because customElements requires one.
 * Contract: attributes in (variant / product / config, JSON strings), cards rendered in a shadow root.
 * Attributes are parsed only when they change, then handed to React.
 */
export class MomoProductCardElement extends HTMLElement {
  static observedAttributes = ['variant', 'product', 'config']

  #root: Root | undefined
  #variant: CardVariant = DEFAULT_VARIANT
  #product: Product | undefined
  #config: unknown

  attributeChangedCallback(name: string, _previous: string | null, next: string | null) {
    if (name === 'variant') this.#variant = parseVariant(next)
    if (name === 'product') this.#product = parseProduct(next)
    if (name === 'config') this.#config = parseConfig(next)
    this.#render()
  }

  connectedCallback() {
    this.#root ??= createRoot(this.shadowRoot ?? this.attachShadow({ mode: 'open' }))
    this.#render()
  }

  disconnectedCallback() {
    // Deferred: the element may be removed during another React root's commit (showroom),
    // and a move (remove + re-insert) should keep the root.
    queueMicrotask(() => {
      if (this.isConnected || !this.#root) return
      this.#root.unmount()
      this.#root = undefined
    })
  }

  #render() {
    if (!this.#root) return
    this.#root.render(
      this.#product ? <CardHost variant={this.#variant} product={this.#product} attributeConfig={this.#config} /> : null,
    )
  }
}

/** Idempotent so the bundle can be loaded twice (e.g. showroom + sample script) without throwing. */
export const defineProductCard = () => {
  if (!customElements.get(TAG_NAME)) customElements.define(TAG_NAME, MomoProductCardElement)
}
