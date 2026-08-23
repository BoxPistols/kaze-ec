# DESIGN.md — kaze-ec の設計

kaze-ec は C2C フリマアプリの UI を、外部のデザインシステム（kaze-ux）から
MCP 経由で仕様を引いて再生成した実装。**kaze-ux のコンポーネントは 1 行も
import していない。**

トークンの**具体値**（`src/theme/theme.ts` の hex 等）はブラウザで動かす以上
コードの中に置かざるを得ない — MUI のテーマは実行時に MCP を呼べない。
バンドルしていないのは仕様そのもの（tokens.json / components.json /
prohibited.md）で、これらは常に kaze-ux 本体から都度引く。代わりに
`theme.ts` を含む「値を持つファイル」は `design/screen-spec.json` の
`foundations` に登録し、`tools/drift/check-drift.mjs` が毎回その値を
kaze-ux の今の仕様と突き合わせる。**値は手元にあるが、常に検証されている。**

> デザインシステムを機械可読な粒度で文書化すれば、AI はそこから UI を
> 再生成できる。そしてその再生成が仕様に忠実かどうかも、同じ粒度の
> 文書があれば機械的に検証できる。kaze-ec はその主張を実物で確かめるための
> リポジトリ。

## 1. 全体図

```
┌──────────────────────── kaze-ec（このリポジトリ）───────────────────────┐
│                                                                          │
│  design/screen-spec.json          ← 画面ごとの依存を宣言（単一ソース）   │
│    │                                                                     │
│    │  実装前に参照                          実装後に照合                 │
│    ▼                                              ▼                     │
│  src/pages/*.tsx  ─────────────────────  tools/drift/check-drift.mjs    │
│  src/components/*.tsx（DS固有部品の再実装）        │                     │
│                                                     │ stdio (MCP)        │
└─────────────────────────────────────────────────────┼─────────────────┘
                                                        ▼
                                    kaze-ux/mcp（別リポジトリ、都度 clone / spawn）
                                    get_token / get_component / check_rule
                                              │
                                              ▼
                                    design-tokens/tokens.json
                                    metadata/components.json    ← 単一ソースは常にここ
                                    foundations/prohibited.md
```

トークン・コンポーネント仕様をこちらにコピーしない理由は 1 つ:
**コピーした瞬間、それは古びて、比較対象として意味を失う。** ドリフト検出は
毎回 kaze-ux 本体（CI では PR ごとに checkout）に問い合わせて成立している。

## 2. 画面と依存の宣言（`design/screen-spec.json`）

実装より先に書く。各画面がどの kaze コンポーネント・トークンに依存するかを
宣言する。`components[].source` は 3 種類:

| source                  | 意味                                                                 |
| ----------------------- | ---------------------------------------------------------------------- |
| `mui`                   | `get_component` が `import: '@mui/material'` を返した部品。MUI をテーマ適用してそのまま使う |
| `regenerated`           | import 先が kaze-ux 内部パスで持って来られないため、props 契約だけを見て再実装（MUI をベースに使う） |
| `regenerated-tailwind`  | 同じく再実装だが、**MUI をまったく使わず** Tailwind + CVA で書いたもの |

### 2.1 なぜ `regenerated-tailwind` があるか

`get_component('button')` / `('card')` / `('chip')` は `import: '@mui/material'`
を返す。つまり kaze-ux はこれらの部品について「MUI をテーマ適用して使う」と
定義している。ここだけを見ると **「DS と言いながら実体は MUI」** に見える —
実際その指摘は正しい。仕様（props 契約・a11y・variant）と実装技術が
区別できていない。

kaze-ec はその区別を実物で示すために、**同じ kaze 仕様に対して意図的に
2 通りの実装を並べている**:

| kaze 仕様          | 実装 A（MUI）  | 実装 B（Tailwind + CVA） |
| ------------------ | -------------- | -------------------------- |
| `Chip`             | `Chip`         | `TagChip`                  |
| `CustomTextField`  | —              | `SearchField`              |
| `Select`           | —              | `SortSelect`               |

`/components` ではこの 2 実装が並んで表示される。同じ props 契約が、
まったく違う実装技術で満たせている状態が目で見える。

**色の単一ソースは両者で共通。** MUI テーマの値を `src/theme/cssVars.ts` が
CSS 変数へ流し、`tailwind.config.js` はその変数だけを参照する（設定ファイルに
hex を書かない）。だから Tailwind 側の部品も、kaze MCP から引いた同じ
トークンを見ている。

| 画面                  | 役割                                      |
| --------------------- | ------------------------------------------- |
| `ItemListPage`        | 出品一覧・キーワード検索・カテゴリ/タグ絞り込み・並び替え |
| `ItemDetailPage`      | 商品詳細・画像ギャラリー・出品者情報・関連商品 |
| `CheckoutWalletPage`  | 決済 × 暗号資産のウォレット UX             |
| `ComponentCatalogPage`| 使用部品・トークンの一覧（§4.7）           |

検索・絞り込み・並び替えのロジックは `src/hooks/useListingFilters.ts` に
純粋関数（`applyListingFilters`）として分離してあり、UI を起動せずに
テストできる。

配色は `ColorModeContext`（`src/theme/`）でライト/ダークを切替できる。
値は `color.light.*` / `color.dark.*` の両方を kaze MCP から引いており、
`foundations[]` での検査対象も両方含む（§4 参照）。

## 3. 決済 × 暗号資産の UX 設計

`CheckoutWalletPage` だけは、既存の DS 部品を組み合わせるだけでは決まらない
UX 判断を含む。判断とその理由は決定記録として残す:

- [`design/decisions/0001-wallet-hybrid-settlement.md`](design/decisions/0001-wallet-hybrid-settlement.md) —
  円とステーブルコインをなぜ別画面ではなく 1 つのウォレットのトグルにしたか

## 4. ドリフト検出（`tools/drift/`）

`pnpm ds:adoption`（kaze-ux 側にある仕組み）は import 準拠率の計測で、
「宣言した仕様と実装が食い違っていないか」は見ない。ここで作った
`check-drift.mjs` はそこを見る:

| 種別         | 見るもの                                                         |
| ------------ | ------------------------------------------------------------------ |
| 未実装       | `screens[]` に宣言されているが実装の JSX に現れないコンポーネント  |
| 無申告       | 実装にあるが `screens[]` に宣言されていない DS 依存                |
| 値の不一致   | ハードコードされた色 / borderRadius が、宣言済みトークンのどの値とも一致しない（`screens[]` の画面ファイルと `foundations[]` の `src/theme/theme.ts` 両方が対象） |
| 禁止パターン | `check_rule` によるコード片照合                                    |

「値の不一致」は kaze-ux の `foundations/prohibited.md` で K01
（ハードコード色値）が「強制: なし」と明記されている領域まで踏み込む —
kaze-ux 自身が機械検査していない範囲を、消費側であるここで検査する。

**実際に検出した例**（git 履歴に残る 2 コミット）:

- `931a586` — 保留中バッジの背景色をハードコードした
- `34da328` — drift-check がそれを検出し、トークン参照に戻した

実装:

- `tools/drift/mcp-client.mjs` — kaze-mcp と stdio 越しに JSON-RPC で話す
  最小クライアント（SDK 非依存、自前実装）
- `tools/drift/check-drift.mjs` — TypeScript の AST で JSX 要素名を拾い、
  正規表現でハードコード値を拾い、両方を kaze MCP から引いた現在の仕様と
  突き合わせる
- CI（`.github/workflows/drift-check.yml`）は PR ごとに `BoxPistols/kaze-ux`
  を checkout し、その時点の仕様と比較する

## 4.5 Figma（code → design）

実装済みの 3 画面から、Figma Plugin API（`use_figma`）で code → design 方向に
フレームを生成した: [kaze-ec — 3 screens](https://www.figma.com/design/9ztuT70cTV8eZot8P02Rlp)。

実装のトークン・レイアウトをそのまま Figma のノードに落としている
（色は `src/theme/theme.ts` / スペーシングは `screen-spec.json` の
宣言と同じ値）。design → code（Figma を起点にコードを書く）は本リポジトリの
主眼ではなく、実装が既に kaze MCP から仕様を引いて成立しているため、
ここでは逆方向（実装の忠実な可視化）だけを扱った。

## 4.7 コンポーネントカタログ（`/components`）

「kaze-ec の画面は kaze MCP から仕様を引いて再生成されている」という主張を、
画面単位ではなく部品単位でもう一度見せるページ。

- `tools/catalog/generate-catalog.mjs` が kaze MCP に実際に接続し、
  `screen-spec.json` の `screens[].components[]` で宣言された部品を
  `get_component` で、主要トークンを `get_token` で引いて
  `src/data/componentCatalog.generated.json` に書き出す（生成物、手で
  編集しない — `pnpm catalog:generate` で再生成）
- `ComponentCatalogPage` はこの生成物と、実際にこのリポジトリで使っている
  実装（`UserAvatar` / `AppIconButton` / `SettlementToggle` 含む）を並べて
  表示する。仕様と実装が同じ画面に並ぶので、ズレがあれば一目で分かる

ブラウザは MCP に直接繋げない（drift 検出と同じ制約）ため、カタログは
「ビルド時に生成 → 静的データとして表示」という構成になっている。

## 5. Skill / SubAgent / Hook（kaze-ux と同じ役割分担）

kaze-ux の DESIGN.md §1 の役割表（データ層 / 強制層 / 知識層）を、
消費側であるこのリポジトリでも同じ配分で持つ。**判定ロジックは
`tools/drift/check-drift.mjs` 1 箇所だけに置き、Skill・SubAgent・Hook は
それを「いつ・誰が・どう使うか」の違いでしかない** — 同じ判定を 3 箇所に
書いた時点で、どれか 1 つが古びる。

| 種類     | 名前                       | 使う人           | 何をするか                                                        |
| -------- | -------------------------- | ---------------- | -------------------------------------------------------------------- |
| Skill    | `kaze-ec-screen-review`    | 人（対話）        | 指定画面のドリフトを自然文で説明する                              |
| Skill    | `kaze-ec-new-screen`       | 人・AI（実装前）  | 新画面を仕様ファーストで追加する手順（`get_component`/`get_token` を先に引かせる） |
| Skill    | `kaze-ec-catalog-sync`     | 人・AI（実装後）  | `/components` の生成物を再生成する手順                            |
| SubAgent | `kaze-ec-design-reviewer`  | AI（自動委譲）    | 大きな UI 差分でメイン会話を汚さずにドリフト審査だけを返す         |
| Hook     | `PostToolUse`（`.claude/settings.json`） | AI（強制）| `src/pages/**` / `src/theme/**` の Write・Edit 直後に `check-drift.mjs` を実行し、違反があれば exit 2 で差し戻す |

Hook はこのリポジトリ専用のプロジェクトローカル設定
（`.claude/settings.json`）。kaze-ux 側の `hooks/hooks.json` は
Plugin 配布用（消費側リポジトリに入る）で、kaze-ec は Plugin を配布しない
消費側そのものなので同じ形式は使わない。

## 6. 導入（このリポジトリ自身の開発時）

```
/plugin marketplace add BoxPistols/kaze-ux
/plugin install kaze-design@kaze-ux
```

kaze MCP（`get_token` / `get_component` / `check_rule` / `search`）に加えて、
kaze-ux 側の DS 準拠レビュー SubAgent・Hook も入る。`.mcp.json` は
`KAZE_UX_PATH` 環境変数でリポジトリの場所を差し替えられる（既定は隣の
`../kaze-ux`）。

## 7. スコープ外

- iOS / Android ネイティブアプリ — レスポンシブ Web で代表させている
- 実決済・実暗号資産連携 — UI/UX の実演が目的で、モックデータのみ
- `kaze-mcp` の npm 公開への依存 — Claude Code Plugin 経由の導入で足りる

## 8. 検証

| コマンド                          | 保証すること                          |
| ---------------------------------- | -------------------------------------- |
| `pnpm lint`                        | ESLint（React.FC 禁止 / any 禁止 等）  |
| `pnpm test`                        | Vitest                                 |
| `pnpm build`                       | 型検査 + 本番ビルド                    |
| `node tools/drift/check-drift.mjs` | 仕様↔実装のドリフト（`KAZE_UX_PATH` で参照先を指定可能） |
