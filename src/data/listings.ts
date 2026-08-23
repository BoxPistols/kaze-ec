export type Condition =
  | '新品'
  | '未使用に近い'
  | '目立った傷や汚れなし'
  | 'やや傷や汚れあり'

export const CATEGORIES = [
  'カメラ',
  '食器',
  'PC周辺機器',
  '本',
  '楽器',
  'アウトドア',
] as const

export type Category = (typeof CATEGORIES)[number]

export interface Listing {
  id: string
  title: string
  price: number
  condition: Condition
  category: Category
  /** 検索・絞り込み用の自由タグ */
  tags: string[]
  sellerName: string
  /** 実写真は無いため、単色をベースにギャラリー側で見た目を作り分ける */
  swatch: string
  /** 出品写真の枚数（1〜4想定） */
  imageCount: number
  acceptsStablecoin: boolean
  /** 出品日（新着順の基準）。モックなので固定値 */
  listedAt: string
  likeCount: number
  description: string
}

export const LISTINGS: Listing[] = [
  {
    id: 'l-001',
    title: 'フィルムカメラ Vintra PEN-7',
    price: 8200,
    condition: '未使用に近い',
    category: 'カメラ',
    tags: ['フィルム', 'コンパクト', 'レトロ'],
    sellerName: 'kaze_seller_01',
    swatch: '#0057B8',
    imageCount: 4,
    acceptsStablecoin: true,
    listedAt: '2026-08-20',
    likeCount: 28,
    description:
      '動作確認済みです。フィルム室のモルトも張り替え済みで、すぐに撮影を始められます。付属品は本体のみです。',
  },
  {
    id: 'l-002',
    title: '北欧食器 プレート 5枚セット',
    price: 3400,
    condition: '目立った傷や汚れなし',
    category: '食器',
    tags: ['北欧', 'セット', '来客用'],
    sellerName: 'nordic_home',
    swatch: '#eb8117',
    imageCount: 2,
    acceptsStablecoin: false,
    listedAt: '2026-08-18',
    likeCount: 12,
    description:
      '来客用に購入しましたが使用頻度が低く出品します。5枚すべて同柄で、目立つ欠けはありません。',
  },
  {
    id: 'l-003',
    title: 'メカニカルキーボード（茶軸・US配列）',
    price: 12000,
    condition: 'やや傷や汚れあり',
    category: 'PC周辺機器',
    tags: ['メカニカル', '茶軸', 'US配列'],
    sellerName: 'kaze_seller_01',
    swatch: '#46ab4a',
    imageCount: 3,
    acceptsStablecoin: true,
    listedAt: '2026-08-22',
    likeCount: 45,
    description:
      '天面に軽い使用感があります。打鍵に問題はなく、キーキャップは清掃済みです。',
  },
  {
    id: 'l-004',
    title: 'デザイン理論の入門書 3冊セット',
    price: 2800,
    condition: '目立った傷や汚れなし',
    category: '本',
    tags: ['デザイン', 'セット', '入門'],
    sellerName: 'book_shelf_22',
    swatch: '#696881',
    imageCount: 2,
    acceptsStablecoin: false,
    listedAt: '2026-08-15',
    likeCount: 7,
    description:
      '書き込みはありません。カバーに軽いスレがありますが、本文はきれいな状態です。',
  },
  {
    id: 'l-005',
    title: 'アコースティックギター（初心者向け）',
    price: 15800,
    condition: 'やや傷や汚れあり',
    category: '楽器',
    tags: ['ギター', '初心者', 'ソフトケース付き'],
    sellerName: 'nordic_home',
    swatch: '#da3737',
    imageCount: 4,
    acceptsStablecoin: true,
    listedAt: '2026-08-21',
    likeCount: 33,
    description:
      '数年前に購入し、しばらく弾いていませんでした。ボディに小傷がありますが音は問題ありません。ソフトケースを付けます。',
  },
  {
    id: 'l-006',
    title: '軽量テント（2人用・未使用）',
    price: 21000,
    condition: '新品',
    category: 'アウトドア',
    tags: ['テント', '2人用', '軽量'],
    sellerName: 'trail_kit',
    swatch: '#0057B8',
    imageCount: 3,
    acceptsStablecoin: true,
    listedAt: '2026-08-23',
    likeCount: 51,
    description:
      '購入したものの予定が合わず未使用のままです。箱・説明書つき、一度も屋外で使用していません。',
  },
  {
    id: 'l-007',
    title: 'ホーロー鍋 20cm',
    price: 5600,
    condition: '未使用に近い',
    category: '食器',
    tags: ['ホーロー', '調理器具'],
    sellerName: 'book_shelf_22',
    swatch: '#eb8117',
    imageCount: 1,
    acceptsStablecoin: false,
    listedAt: '2026-08-12',
    likeCount: 4,
    description: '数回のみ使用しました。焦げ付きや色移りはありません。',
  },
  {
    id: 'l-008',
    title: '単焦点レンズ 35mm F1.8',
    price: 18500,
    condition: '目立った傷や汚れなし',
    category: 'カメラ',
    tags: ['単焦点', '35mm', 'レンズ'],
    sellerName: 'trail_kit',
    swatch: '#46ab4a',
    imageCount: 4,
    acceptsStablecoin: true,
    listedAt: '2026-08-19',
    likeCount: 39,
    description:
      'カビ・クモリなし。前後キャップとフードが付属します。動作確認済みです。',
  },
]

export const findListing = (id: string): Listing | undefined =>
  LISTINGS.find((listing) => listing.id === id)

export const ALL_TAGS: string[] = [
  ...new Set(LISTINGS.flatMap((listing) => listing.tags)),
].sort()
