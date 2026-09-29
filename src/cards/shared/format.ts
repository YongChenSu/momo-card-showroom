const priceFormatter = new Intl.NumberFormat('zh-TW')

export const formatPrice = (value: number): string => priceFormatter.format(value)

export const formatStars = (score: number): string => {
  const filled = Math.round(score)
  return '★'.repeat(filled) + '☆'.repeat(5 - filled)
}
