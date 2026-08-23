---
name: kaze-ec-screen-review
description: kaze-ec の画面が design/screen-spec.json の宣言どおりに実装されているか、kaze MCP から仕様を引いて照合する。CLI を使わずに叩ける、デザイナー向けのレビュー入口
---

# kaze-ec 画面レビュー

`/kaze-ec-screen-review <画面名>`（例: `CheckoutWalletPage`、省略時は全画面）で、
`design/screen-spec.json` の宣言と実装のドリフトを自然文で報告する。

`tools/drift/check-drift.mjs` と同じ判定基準を使うが、あちらは CI 向けの
機械可読出力、こちらは会話の中で読める説明を返す。エンジニアでなくても
このコマンドを打つだけで結果が読める状態を目指す。

## 手順

1. `design/screen-spec.json` を読み、対象画面（未指定なら全件）の宣言済み
   コンポーネント・トークンを確認する
2. 各コンポーネントは kaze MCP の `get_component`、各トークンは `get_token`
   で現在の仕様を引く。値を思い出しで補わない — 必ず引き直す
3. 対象画面の実装ファイル（`screen.path`）を読む
4. 突き合わせて、次の 4 種類で差分を報告する:
   - **未実装**: 宣言されているが実装に現れないコンポーネント
   - **無申告**: 実装にあるが宣言されていない DS 依存
     （`Box` / `Container` / `Grid` / `Typography` / `Divider` / `Stack` /
     `AppBar` / `Toolbar` などレイアウト原始要素は対象外）
   - **値の不一致**: ハードコードされた色 / borderRadius が、宣言済み
     トークンのどの値とも一致しない
   - **禁止パターン**: `check_rule` に実装ファイルの中身を渡し、返ってきた
     違反をそのまま報告する
5. 差分が無ければ「一致している」とだけ短く報告する。差分があれば
   画面名・種別・該当箇所を列挙する（`tools/drift/check-drift.mjs` の
   出力形式に合わせる）

## 使用する MCP ツール

- `get_component` — コンポーネント仕様（props / a11y / import）
- `get_token` — トークン値
- `check_rule` — 禁止パターン照合

## 参考

- 判定ロジックの機械版: `tools/drift/check-drift.mjs`
- 宣言の単一ソース: `design/screen-spec.json`
- なぜこの仕組みがあるか: `DESIGN.md` §3
