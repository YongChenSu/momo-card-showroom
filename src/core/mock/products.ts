import type { ProductInput } from '../schema/product'
import { placeholderImage } from './placeholder-image'

/**
 * Mock products modelled on observed momo search-result cards (2026-09-29).
 * Includes deliberately unknown / malformed badges to exercise tolerant parsing (D6).
 */
export const mockProducts: readonly ProductInput[] = [
  {
    id: 'p-fan-001',
    title: '【HongXin】獨家販售 正版授權 kitty 冰敷手持風扇 USB 充電',
    imageUrl: placeholderImage('手持扇', 330),
    imageCount: 5,
    url: '#p-fan-001',
    price: 399,
    priceNote: 'discounted',
    promoText: '滿1件折391元',
    badges: [
      { type: 'mo-points', percent: 3 },
      { type: 'free-shipping-coupon' },
      { type: 'store-tag', kind: 'mo-store-plus' },
      { type: 'ad' },
    ],
  },
  {
    id: 'p-fan-002',
    title: '【RHYTHM 麗聲】Silky Wind Mobile 3.2 日本勾扣手持風扇',
    imageUrl: placeholderImage('麗聲', 150),
    imageCount: 4,
    url: '#p-fan-002',
    price: 899,
    promoText: '三用輕巧附掛勾 雙葉強風帶著走',
    rating: { score: 4.5, count: 56 },
    soldCount: 100,
    badges: [
      { type: 'mo-points', percent: 3 },
      { type: 'store-tag', kind: 'mo-store-plus' },
    ],
  },
  {
    id: 'p-fan-003',
    title: '【CW】CW 嚴選雙葉折疊手持隨身電風扇 桌立 夾式',
    imageUrl: placeholderImage('CW', 20),
    url: '#p-fan-003',
    price: 299,
    originalPrice: 490,
    rating: { score: 5, count: 1 },
    badges: [
      { type: 'store-tag', kind: 'mo-store-plus' },
      { type: 'store-tag', kind: 'good-store' },
      { type: 'limited-bonus', percent: 8 },
    ],
  },
  {
    id: 'p-fan-004',
    title: '【LaPO】製冷高速可折疊隨身風扇（松下電芯）',
    imageUrl: placeholderImage('LaPO', 260),
    imageCount: 3,
    url: '#p-fan-004',
    price: 904,
    originalPrice: 1090,
    priceNote: 'discounted',
    promoText: '滿1件享83折',
    soldCount: 500,
    badges: [
      { type: 'limited-bonus', percent: 8 },
      // Unknown type (e.g. shipped by backend before this bundle knows it) → skipped + reported
      { type: 'anniversary', text: '週年慶' },
    ],
  },
  {
    id: 'p-food-005',
    title: '【快車肉乾】原味牛肉乾 不辣 經典款',
    imageUrl: placeholderImage('肉乾', 30),
    url: '#p-food-005',
    price: 270,
    originalPrice: 350,
    priceNote: 'from',
    badges: [
      // Malformed payload (percent must be a number) → skipped + reported, card still renders
      { type: 'mo-points', percent: 'abc' },
      { type: 'store-tag', kind: 'good-store' },
    ],
  },
  {
    id: 'p-toy-006',
    title: '【LEGO 樂高】Friends 高雄天空樹屋 41703',
    imageUrl: placeholderImage('LEGO', 210),
    url: '#p-toy-006',
    price: 2000,
    originalPrice: 2629,
    rating: { score: 4.8, count: 212 },
    soldCount: 1000,
    badges: [{ type: 'ad' }],
  },
]
