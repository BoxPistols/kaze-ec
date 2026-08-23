# kaze-ec

## 基本方針

- kaze-ux のコンポーネントは import しない。UI 実装・変更時は kaze MCP
  （`get_token` / `get_component` / `check_rule` / `search`）を参照し、
  仕様を引いてから書く
- 新しい画面・コンポーネントを追加したら `design/screen-spec.json` に
  依存を宣言してから実装する（仕様が先、実装が後）
- `React.FC` / `any` / セミコロン / `export default` は禁止（ESLint で検査）
- 変更後は `node tools/drift/check-drift.mjs` でドリフトが無いか確認する

## コマンド

`pnpm dev` / `pnpm build` / `pnpm test` / `pnpm lint` /
`node tools/drift/check-drift.mjs` / `pnpm catalog:generate`

## Skill / SubAgent / Hook

- 新しい画面を作るときは `/kaze-ec-new-screen` に従う（仕様ファースト）
- 画面のドリフトを確認したいときは `/kaze-ec-screen-review`
- `/components` の生成物を更新したいときは `/kaze-ec-catalog-sync`
- 大きな UI 差分は `kaze-ec-design-reviewer` SubAgent に自動委譲される
- `src/pages/**` / `src/theme/**` への Write・Edit は Hook
  （`.claude/settings.json`）が `check-drift.mjs` を自動実行し、
  違反があればその場で差し戻す

## 詳細

設計の背景は [`DESIGN.md`](DESIGN.md)。決済 × 暗号資産の UX 判断は
[`design/decisions/`](design/decisions/) を参照。
