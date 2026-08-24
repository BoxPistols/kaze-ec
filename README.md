# kaze-ec

C2C フリマアプリの UI を、外部のデザインシステム（[kaze-ux](https://github.com/BoxPistols/kaze-ux)）
から MCP 経由で仕様を引いて再生成した実装。実装が仕様からドリフトしていないかを
機械的に検証する仕組みまで含めている。

デモ: **https://kaze-ec.vercel.app/**

> **これはモックアップです。** 実在する企業・サービス・個人とは一切関係
> ありません。商品・出品者・残高はすべて架空のデモデータで、決済・暗号資産
> 機能は UI のみ（実際の送金や課金は発生しません）。

---

## 何から読むか

**目的別に入口を分けている。** 上から順に読む必要はない。

| 知りたいこと | 読むもの |
| ------------ | -------- |
| **設計の進め方**（デザイナー / ディレクター向け） | [`design/README.md`](design/README.md) — 何をどの順で決めるか |
| 誰のために作っているか | [`design/personas.md`](design/personas.md) |
| どこが繋がっていて、どこが切れているか | [`design/journey-map.md`](design/journey-map.md) |
| 迷った分岐で何を選んだか | [`design/decisions/`](design/decisions/) |
| **アーキテクチャ**（エンジニア向け） | [`DESIGN.md`](DESIGN.md) — MCP・ドリフト検出・Skills の構造 |
| この仕組みは実際に効いたのか | [`docs/design-md-report.md`](docs/design-md-report.md) — 効果測定 |
| 使っている部品とトークン | [/components](https://kaze-ec.vercel.app/components)（生成物） |

**先に 1 つだけ読むなら** [`design/README.md`](design/README.md)。
このリポジトリが「画面を作る前に何を決めているか」がそこに集約されている。

---

## 何が特殊か

kaze-ux の**コンポーネントを import していない**。
kaze MCP（`get_token` / `get_component` / `check_rule` / `search`）で仕様を引き、
その仕様どおりに再生成している。

そのうえで、実装が仕様とずれていないかを CI で検査している。

| | 他の Kaze プロダクト | kaze-ec |
| --- | --- | --- |
| DS の取り込み方 | `workspace:*` で直接 import | MCP で仕様を引いて再生成 |
| リポジトリ | kaze-ux 内の `apps/` | **別リポジトリ** |
| ドリフト検査 | なし（同じコードなので不要） | **あり**（CI で毎回） |

---

## 画面

| 画面 | パス | ジャーニー上の位置 |
| ---- | ---- | ------------------ |
| 出品一覧 | `/` | 購入 1〜2（探索・比較） |
| 商品詳細 | `/items/:id` | 購入 3（検討） |
| 決済ウォレット | `/checkout/:id` | 購入 5〜7（決済・待機・完了） |
| コンポーネントカタログ | `/components` | — （MCP から生成した部品一覧） |

未実装の区間は [`design/journey-map.md`](design/journey-map.md) の表に
❌ / 🚧 で明示している。

---

## セットアップ

```bash
pnpm install
pnpm dev
```

kaze MCP をこのリポジトリでも使う場合は、隣に
[kaze-ux](https://github.com/BoxPistols/kaze-ux) を clone するか、
Claude Code Plugin で導入する:

```
/plugin marketplace add BoxPistols/kaze-ux
/plugin install kaze-design@kaze-ux
```

---

## コマンド

| コマンド | 内容 |
| -------- | ---- |
| `pnpm dev` | 開発サーバー起動 |
| `pnpm build` | 型検査 + 本番ビルド |
| `pnpm test` | Vitest |
| `pnpm lint` | ESLint |
| `pnpm drift:check` | 仕様↔実装のドリフト検出 |
| `pnpm catalog:generate` | `/components` の生成物を MCP から再生成 |

### Claude Code から（コマンド不要）

| やりたいこと | 打つもの |
| ------------ | -------- |
| 画面が仕様どおりか見る | `/kaze-ec-screen-review` |
| 新しい画面を作る | `/kaze-ec-new-screen` |
| カタログを更新する | `/kaze-ec-catalog-sync` |

---

## ライセンス

MIT
