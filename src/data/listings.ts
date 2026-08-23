export interface Listing {
  id: string
  title: string
  price: number
  condition: '新品' | '未使用に近い' | '目立った傷や汚れなし' | 'やや傷や汚れあり'
  category: string
  sellerName: string
  swatch: string
  acceptsStablecoin: boolean
  description: string
}

export const LISTINGS: Listing[] = [
  {
    id: 'l-001',
    title: 'フィルムカメラ Vintra PEN-7',
    price: 8200,
    condition: '未使用に近い',
    category: 'カメラ',
    sellerName: 'kaze_seller_01',
    swatch: '#0057B8',
    acceptsStablecoin: true,
    description:
      '動作確認済みです。フィルム室のモルトも張り替え済みで、すぐに撮影を始められます。付属品は本体のみです。',
  },
  {
    id: 'l-002',
    title: '北欧食器 プレート 5枚セット',
    price: 3400,
    condition: '目立った傷や汚れなし',
    category: '食器',
    sellerName: 'nordic_home',
    swatch: '#eb8117',
    acceptsStablecoin: false,
    description:
      '来客用に購入しましたが使用頻度が低く出品します。5枚すべて同柄で、目立つ欠けはありません。',
  },
  {
    id: 'l-003',
    title: 'メカニカルキーボード（茶軸・US配列）',
    price: 12000,
    condition: 'やや傷や汚れあり',
    category: 'PC周辺機器',
    sellerName: 'kaze_seller_01',
    swatch: '#46ab4a',
    acceptsStablecoin: true,
    description:
      '天面に軽い使用感があります。打鍵に問題はなく、キーキャップは清掃済みです。',
  },
]

export const findListing = (id: string): Listing | undefined =>
  LISTINGS.find((listing) => listing.id === id)
