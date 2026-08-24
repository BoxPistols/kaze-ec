# design/ — 設計ドキュメントの読み方と書き順

このディレクトリは**画面を作る前に決めることを置く場所**。
デザイナー・ディレクターがここを書き、AI と実装がここを参照する。

---

## 1. 何がどこにあるか

| ファイル | 何を決めるか | 誰が書くか |
| -------- | ------------ | ---------- |
| [`personas.md`](personas.md) | 誰のために作るか | デザイナー / PdM |
| [`journey-map.md`](journey-map.md) | どこが繋がっていて、どこが切れているか | デザイナー / PdM |
| [`decisions/`](decisions/) | 迷った分岐で何を選び、何を捨てたか | 決めた人 |
| [`screen-spec.json`](screen-spec.json) | 画面がどの部品・トークンに依存するか | デザイナー + 実装者 |

**上から下へ流れる。** ペルソナが困りごとを定め、ジャーニーが切れている区間を
特定し、決定記録が分岐を固定し、spec が実装に渡す。

---

## 2. 書き順（新しい画面を作るとき）

これは手順であると同時に、**AI に何をさせるかの順序**でもある。

### Step 1 — 誰の、どの場面か（人が決める）

[`personas.md`](personas.md) と [`journey-map.md`](journey-map.md) を読む。

- どのペルソナの、どの役割か
- ジャーニーのどの段階を埋めるか
- **その段階が表に無いなら、まず表に足す。** 足せないなら作らない

> ここを飛ばすと「作れるから作った」画面ができる。
> ジャーニーのどの段階を埋めるか言えない機能は作らない。

### Step 2 — 分岐があるなら決定記録を書く（人が決める）

選択肢が 2 つ以上あって、どちらでも動くなら [`decisions/`](decisions/) に書く。

書く内容は 4 つだけ。**問題 / 決定 / 理由 / 捨てた選択肢**。
「トレードオフとして受け入れたこと」を必ず書く（書かないと、後から
「考慮漏れ」と「意図的な割り切り」が区別できない）。

### Step 3 — 部品を kaze MCP に問い合わせる（AI にやらせる）

**記憶で部品名を書かない。** 実際に引く。

| 聞くこと | ツール |
| -------- | ------ |
| この部品はあるか | `search('タブ')` |
| props は何か | `get_component('tabs')` |
| 色・寸法の値は | `get_token('color.light.primary.main')` |

`import` が `@mui/material` なら MUI をそのまま使う。kaze-ux の内部パスなら
持って来られないので、**props 契約だけを見て再実装**する。

**無ければ、無いことを確認した記録を残す。**
（実例: `ImageGallery` は `search('image')` `search('gallery carousel')` で
該当なしを確認してから作り、カタログにその旨を明記している）

### Step 4 — `screen-spec.json` に宣言する（実装より先）

画面名・パス・使う部品（`kaze` / `as` / `source`）・使うトークンを書く。

**実装より先に書く。** 後で書くと、書いた瞬間に自分のコードが「無申告」になり、
検査の意味が消える。

### Step 5 — 実装する

宣言した部品とトークンだけを使う。色・角丸はトークン参照か
`theme.shape.borderRadius` の倍数で書き、ハードコードしない。

### Step 6 — 検査する

```bash
pnpm lint && pnpm build && pnpm test
node tools/drift/check-drift.mjs
```

ドリフトが出たら、**宣言を実装に合わせるか、実装を宣言に合わせるか**を
判断する。新しい DS 依存が本当に必要なら前者、そうでなければ後者。

### Step 7 — ジャーニーの表を更新する

[`journey-map.md`](journey-map.md) の「状況」列を ❌ → ✅ にする。
**🚧 のまま放置しない。**

---

## 3. 実際にこの順で作った例

`CheckoutWalletPage`（決済 × 暗号資産）が Step 1〜7 を通った唯一の完全な例。

| Step | 実物 |
| ---- | ---- |
| 1 | [`personas.md`](personas.md) §1「取引の安全 > 速さ」 |
| 2 | [`decisions/0001`](decisions/0001-wallet-hybrid-settlement.md) 円とステーブルコインを 1 つのウォレットに |
| 3 | `get_component('toggleButton')` → import が内部パス → 再実装と判断 |
| 4 | `screen-spec.json` の `CheckoutWalletPage` |
| 5 | `src/pages/CheckoutWalletPage.tsx` + `src/components/SettlementToggle.tsx` |
| 6 | 検査で 1 件検出（ハードコード色）→ 修正（`931a586` → `34da328`） |
| 7 | ジャーニー購入 5・6 が ✅ |

**Step 6 で実際に止まった**のが重要。止まらない検査は動いている証拠にならない。

---

## 4. デザイナーがコマンドを打たずにできること

`pnpm` も `node` も要らない。Claude Code に日本語で聞くだけ。

| やりたいこと | 打つもの |
| ------------ | -------- |
| 今の色・部品仕様を知りたい | 「primary の色は？」「Chip の props は？」 |
| この画面が仕様どおりか見たい | `/kaze-ec-screen-review` |
| 新しい画面を作りたい | `/kaze-ec-new-screen` |
| カタログを最新にしたい | `/kaze-ec-catalog-sync` |

前提: kaze MCP が接続されていること（[README](../README.md) のセットアップ参照）。

---

## 5. 次に埋めるもの

[`journey-map.md`](journey-map.md) §4 の優先順位表が単一ソース。
現時点の先頭は **マイページ（購入履歴 / 出品管理のタブ）**
（[`decisions/0002`](decisions/0002-role-switching.md) で設計済み・実装未着手）。
