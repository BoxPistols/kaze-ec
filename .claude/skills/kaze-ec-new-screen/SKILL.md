---
name: kaze-ec-new-screen
description: kaze-ec に新しい画面を仕様ファーストで追加する手順。「新しい画面を作って」「◯◯ページを追加して」で使う。実装より先に design/screen-spec.json へ依存を宣言し、kaze MCP から仕様を引いてから画面を書く
---

# kaze-ec 新規画面の追加

kaze-ec は「実装が先、仕様は後から書く」を禁止する。**必ず仕様が先。**
理由は `DESIGN.md` §1〜2 — `design/screen-spec.json` が単一ソースで、
`tools/drift/check-drift.mjs` はここに宣言の無い依存を「無申告」として
検出する。実装だけ書くと、書いた瞬間に自分の書いたコードがドリフトになる。

## 手順

1. **画面の役割を決める。** ルート（例: `/items/:id/edit`）、目的、
   参考にする既存画面（`ItemListPage` / `ItemDetailPage` /
   `CheckoutWalletPage` / `ComponentCatalogPage`）を 1 つ選ぶ

2. **使う部品を kaze MCP で確認する。** 思いつきで部品名を書かない。
   `get_component('<camelCase 名>')` を実際に呼び、無ければ
   `search(query, scope: 'components')` で近い名前を探す。返ってきた
   `import` が `@mui/material` なら MUI をそのまま使う（`source: "mui"`）。
   kaze-ux 内部パスなら import できないので、props 契約だけを見て
   `src/components/` に再実装する（`source: "regenerated"`、既存の
   `UserAvatar.tsx` / `SettlementToggle.tsx` / `AppIconButton.tsx` を
   実装パターンの参考にする）

3. **使う色・寸法トークンを kaze MCP で確認する。** `get_token(path)` で
   `color.light.*` / `color.dark.*` の両方の値を引く。ダークモード対応が
   前提なので片方だけ確認しない

4. **`design/screen-spec.json` の `screens[]` に追記する。** 画面名・
   `path`・`components[]`（`kaze` / `as` / `source` / 該当すれば
   `localPath`）・`tokens[]`（このステップで確認した値の出どころとなる
   トークンパス）を書く

5. **画面を実装する。** ステップ 2〜3 で確認した部品・トークンだけを使う。
   色・角丸は原則トークン参照（`color="primary"` 等）か
   `theme.shape.borderRadius` の倍数（`borderRadius: 1.5` など）で書き、
   ハードコード hex は書かない — 書くなら `src/theme/theme.ts` 側に
   閉じ込め、`design/screen-spec.json` の `foundations[]` で検査対象にする

6. **`App.tsx` にルートを追加する。**

7. **検証する:**

   ```bash
   pnpm lint && pnpm build && pnpm test
   node tools/drift/check-drift.mjs
   ```

   ドリフトが出たら、まず「宣言を実装に合わせる」か「実装を宣言に合わせる」
   かを考える。新しい DS 依存が本当に必要なら前者、そうでなければ後者。

8. **`pnpm catalog:generate` を実行する**（新しい部品を使った場合）。
   `/kaze-ec-catalog-sync` を参照。
