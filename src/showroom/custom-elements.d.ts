import type { DetailedHTMLProps, HTMLAttributes } from 'react'

type MomoProductCardAttributes = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  variant?: string
  /** JSON string; the element validates it. */
  product: string
  /** JSON string (CardConfigPatch); overrides the stored config. */
  config?: string
}

// Declaration merging requires `interface` here (the one place `type` cannot be used).
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'momo-product-card': MomoProductCardAttributes
    }
  }
}
