# kaze-ec

C2C フリマアプリの UI を、外部のデザインシステム（[kaze-ux](https://github.com/BoxPistols/kaze-ux)）
から MCP 経由で仕様を引いて再生成した実装。トークン・コンポーネント仕様は
このリポジトリにバンドルせず、実装が仕様からドリフトしていないかを
機械的に検証する仕組みまで含めている。

設計の詳細・なぜこの構成にしたかは [`DESIGN.md`](DESIGN.md) を参照。

## 画面

| 画面                 | 内容                                             |
| --------------------- | ------------------------------------------------ |
| 出品一覧               | `/`                                              |
| 商品詳細               | `/items/:id`                                     |
| 決済（円 × ステーブルコイン ウォレット） | `/checkout/:id`                     |

## セットアップ

```bash
pnpm install
pnpm dev
```

kaze MCP（`get_token` / `get_component` / `check_rule` / `search`）を
このリポジトリでも使う場合は、隣に [kaze-ux](https://github.com/BoxPistols/kaze-ux)
を clone するか、Claude Code Plugin で導入する:

```
/plugin marketplace add BoxPistols/kaze-ux
/plugin install kaze-design@kaze-ux
```

## コマンド

| コマンド                          | 内容                       |
| ----------------------------------- | -------------------------- |
| `pnpm dev`                          | 開発サーバー起動           |
| `pnpm build`                        | 型検査 + 本番ビルド        |
| `pnpm test`                         | Vitest                     |
| `pnpm lint`                         | ESLint                     |
| `node tools/drift/check-drift.mjs`  | 仕様↔実装のドリフト検出   |

## ライセンス

MIT
