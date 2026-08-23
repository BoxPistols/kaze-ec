# DESIGN.md — kaze-ec の設計

kaze-ec は C2C フリマアプリの UI を、外部のデザインシステム（kaze-ux）から
MCP 経由で仕様を引いて再生成した実装。**kaze-ux のコンポーネントは 1 行も
import していない。** トークンやコンポーネント仕様もこのリポジトリには
一切バンドルしていない。

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

実装より先に書く。3 画面それぞれが、どの kaze コンポーネント・トークンに
依存するかを宣言する。`components[].source` が `mui` のものは
`get_component` が `import: '@mui/material'` を返した部品（MUI をそのまま
テーマ経由で使う）。`regenerated` のものは import 先が kaze-ux 内部パス
だったため、props 契約だけを見て `src/components/` に書き直したもの。

| 画面                  | 役割                             | DS 固有の再実装                          |
| --------------------- | -------------------------------- | ----------------------------------------- |
| `ItemListPage`        | 出品一覧                         | —（MUI 直使用のみ）                       |
| `ItemDetailPage`      | 商品詳細・出品者情報             | `UserAvatar`                              |
| `CheckoutWalletPage`  | 決済 × 暗号資産のウォレット UX   | `SettlementToggle`（`ToggleButton` 仕様） |

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
| 未実装       | `screen-spec.json` に宣言されているが実装の JSX に現れないコンポーネント |
| 無申告       | 実装にあるが `screen-spec.json` に宣言されていない DS 依存         |
| 値の不一致   | ハードコードされた色 / borderRadius が、宣言済みトークンのどの値とも一致しない |
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

## 5. Skill（デザイナーの入口）

`.claude/skills/kaze-ec-screen-review/` — `/kaze-ec-screen-review <画面名>`
で、CLI を使わずに `check-drift.mjs` と同じ判定基準を会話の中で確認できる。
判定ロジックの正はスクリプト側にあり、Skill はそれを自然文で説明する手順を
持つだけ（知識を 2 箇所に持たない、という原則は kaze-ux 側と同じ）。

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
