---
name: kaze-ec-catalog-sync
description: /components（ComponentCatalogPage）が表示する部品カタログを kaze MCP から再生成する。design/screen-spec.json の components[] を変更した後、または kaze-ux 側のトークン・部品仕様が変わったと思われるときに使う
---

# コンポーネントカタログの同期

`src/data/componentCatalog.generated.json` は生成物。手で編集しない。
古いまま放置すると `/components` が実際の仕様と違うものを表示し、
「kaze MCP から生成している」という主張そのものが嘘になる。

## いつ実行するか

- `design/screen-spec.json` の `screens[].components[]` に部品を足した/消した
- kaze-ux 側でトークン・コンポーネント仕様が変わったはず、と思ったとき
  （`pnpm catalog:generate` は毎回 kaze MCP に問い合わせるので、
  古い値を思い出しで判断するより速くて正確）
- `/components` の表示が実装と食い違って見えるとき

## 手順

```bash
pnpm catalog:generate
```

kaze-ux（既定は隣の `../kaze-ux`。違う場所なら `KAZE_UX_PATH` 環境変数）に
実際に接続し、`get_component` / `get_token` を呼んで
`src/data/componentCatalog.generated.json` を書き直す。

生成後:

1. `git diff src/data/componentCatalog.generated.json` で何が変わったかを見る
   （props が増えた、トークン値が変わった等 — kaze-ux 側の変更点の記録になる）
2. `ComponentCatalogPage`（`src/pages/ComponentCatalogPage.tsx`）の
   `SAMPLES` に、新しく増えた部品のライブサンプルが無ければ追加する
3. `node tools/drift/check-drift.mjs` を実行し、`ComponentCatalogPage` の
   `screen-spec.json` 宣言と実装が一致しているか確認する
4. 生成物をコミットする（`.gitignore` 対象ではない — 見た目に反映される
   実データなので、レビューできる状態でリポジトリに残す）
