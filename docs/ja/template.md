# Template JSON ガイド

[English](../en/template.md) | [日本語](../ja/template.md) | [中文](../zh/template.md)

このドキュメントは**テンプレート（Template）作成者**向けに、My Ideals テンプレート JSON の構造、各フィールドの意味、そして自分のテンプレートをゼロから作成・公開する方法を説明します。

## 目次

1. [概要](#1-概要)
2. [クイックスタート（最小例）](#2-クイックスタート最小例)
3. [基本概念](#3-基本概念)
4. [フィールドリファレンス](#4-フィールドリファレンス)
5. [二つの画像モード](#5-二つの画像モード)
6. [メンバーと複数メンバー項目](#6-メンバーと複数メンバー項目)
7. [レイアウトと表示](#7-レイアウトと表示)
8. [検索キーワード](#8-検索キーワード)
9. [バージョンとマイグレーション](#9-バージョンとマイグレーション)
10. [自分のテンプレートを作る（手順）](#10-自分のテンプレートを作る手順)
11. [ホスティングと公開](#11-ホスティングと公開)
12. [検証ルールとよくあるエラー](#12-検証ルールとよくあるエラー)
13. [技術付録（開発者向け）](#13-技術付録開発者向け)
14. [完全な例](#14-完全な例)

---

## 1. 概要

**テンプレート（Template）** は「あるセットにどんな写真があるか」を記述した JSON ファイルです（例：「2024 年夏コンサートグッズ」）。テンプレートはコミュニティの作成者が管理し、ユーザーはテンプレート URL を貼り付けるだけで自分の**プロファイル（Profile）**を作成し、所持 / 未所持 / 求を 1 件ずつ記録できます。

階層関係は次のとおりです：

```
Template（テンプレート。作成者が管理・全員で共有）
└── members[]      メンバー一覧（各アイドルなど）
└── collections[]  コレクション（ある回、ある公演など）
    └── items[]    項目（1 枚 1 枚の写真）

Profile（プロファイル。ユーザーごとに非公開）
└── ある Template の URL + revision を参照
└── 各 item の所持状態を記録（所持 / 数量 / 求）
```

典型的な流れ：

```
作成者が template.json を作る
        │
        ▼
   公開ホスティング（GitHub raw など）
        │
        ▼
   URL をユーザーに共有
        │
        ▼
ユーザーが「新規プロファイル」で URL を貼り付け
        │
        ▼
アプリがテンプレートを取得・検証 → 記録開始
        │
        ▼
作成者が更新（revision を上げる）→ アプリが自動検知
```

---

## 2. クイックスタート（最小例）

以下は**そのまま使える**最小テンプレートです。メンバー 1・コレクション 1・項目 1 で、`inline` 画像モード（各項目に完全な画像 URL を書く）を使用します。

```json
{
  "magic": "my-ideals-template",
  "version": 1,
  "revision": 1,
  "id": "equal-me",
  "name": "=ME 生写真",
  "imageResourceType": "inline",
  "members": [
    { "id": "noguchi-nanaka", "name": "野口 菜々風" }
  ],
  "collections": [
    {
      "id": "2026-new-year",
      "name": "2026年新春",
      "items": [
        {
          "id": "nanaka-hiki",
          "member": "noguchi-nanaka",
          "name": "野口菜々風 ヒキ",
          "image": "https://raw.githubusercontent.com/monaka-ikonoi/my-ideals/refs/heads/main/public/sample/sample-image.webp"
        }
      ]
    }
  ]
}
```

この JSON を `.json` ファイルとして保存し、公開ホスティングして（[第 11 節](#11-ホスティングと公開)）、URL をユーザーに渡せば完了です。

---

## 3. 基本概念

### 3.1 三層構造

- **member（メンバー）**：分類軸。通常はグループの各人。項目は 1 人以上のメンバーに属し、メンバー絞り込みに使えます。
- **collection（コレクション）**：写真のまとまり。通常は 1 つの商品・公演・シリーズに対応。
- **item（項目）**：具体的な 1 枚の写真。ユーザーが実際にチェックする最小単位。

### 3.2 `id` は安定した主キー

⚠️ アプリは **`id` でユーザーの収集データを特定**するため、`id` は一度公開したら安定させてください：

- **テンプレートのルート `id`**：絶対に変更不可。プロファイルは `id` でテンプレートに紐づき、更新時に取得したテンプレートの `id` が一致するか検証します。不一致だと `id-mismatch` エラーになり、ユーザーは更新できません。
- **`collection.id` / `item.id`**：できるだけ変えない。変えると記録済みの状態が一致せず失われます。改名が必要なら [マイグレーション](#9-バージョンとマイグレーション) で旧 id → 新 id の対応を伝えます。
- **`member.id`**：同様にプロファイルの「選択メンバー」が参照するため、変更にはマイグレーションが必要です。

> 原則：`name`（表示名）は自由に変更可、`id`（識別子）は「主キー」として扱う。

### 3.3 `id` の一意性の範囲

- `member.id`：テンプレート全体で一意。
- `collection.id`：テンプレート全体で一意。
- `item.id`：**所属コレクション内**で一意であれば十分。別コレクションでは同じ item id を再利用可（例：両方の回に `nanaka-hiki`）で、互いに干渉しません。

---

## 4. フィールドリファレンス

> 型の列はネイティブ型（`string`、`number`、`boolean`、`array`、`object`）を使い、リテラルは引用符で示します。

### 4.1 ルートオブジェクト（Template）

| フィールド | 型 | 必須 | 既定 | 説明 |
| --- | --- | :---: | --- | --- |
| `magic` | `"my-ideals-template"` | ✅ | — | ファイル種別を識別する固定リテラル。**完全一致**が必要。 |
| `version` | `1` | ✅ | — | スキーマバージョン。現在は数値 `1` 固定。 |
| `revision` | `number` | ✅ | — | コンテンツ改訂番号（整数）。更新のたびに**インクリメント**、アプリは更新検知に使用。 |
| `id` | `string` | ✅ | — | テンプレート一意 ID。公開後は**変更不可**（[3.2](#32-id-は安定した主キー) 参照）。 |
| `name` | `string` | ✅ | — | テンプレート表示名。 |
| `description` | `string` | ❌ | — | 説明。`\n` で改行可。 |
| `author` | `string` | ❌ | — | 作成者名。 |
| `link` | `string` (URL) | ❌ | — | ホームページ / 出典リンク。正しい URL が必要。 |
| `migrations` | `array` | ❌ | — | `id` 変更時にユーザーデータを移行するルール（[第 9 節](#9-バージョンとマイグレーション)）。 |
| `imageResourceType` | `"inline"` \| `"baseUrl"` | ✅ | — | 画像解決モード（[第 5 節](#5-二つの画像モード)）。 |
| `imageBaseUrl` | `object` | ❌ | — | `baseUrl` モードの画像基準設定。`inline` では省略可。 |
| `layout` | `object` | ❌ | — | テンプレート級レイアウト（[第 7 節](#7-レイアウトと表示)）。 |
| `members` | `array` | ✅ | — | メンバー一覧。 |
| `collections` | `array` | ✅ | — | コレクション一覧。 |

### 4.2 member

| フィールド | 型 | 必須 | 説明 |
| --- | --- | :---: | --- |
| `id` | `string` | ✅ | メンバー ID。テンプレート内で一意、公開後は変えない。 |
| `name` | `string` | ✅ | メンバー表示名。 |

> ヒント：「集合 / 全体」写真の分類用に擬似メンバーを追加できます。例：`{ "id": "all", "name": "集合" }`。

### 4.3 collection

| フィールド | 型 | 必須 | 既定 | 説明 |
| --- | --- | :---: | --- | --- |
| `id` | `string` | ✅ | — | コレクション ID。テンプレート内で一意。 |
| `name` | `string` | ✅ | — | コレクション表示名。 |
| `searchTerms` | `string[]` | ❌ | — | 追加検索キーワード。**指定する場合は 1 件以上、各要素は空不可**（[第 8 節](#8-検索キーワード)）。 |
| `layout` | `object` | ❌ | テンプレート継承 | コレクション級レイアウト。テンプレート級 `layout` を上書き。 |
| `items` | `array` | ✅ | — | 項目一覧。 |

### 4.4 item

| フィールド | 型 | 必須 | 既定 | 説明 |
| --- | --- | :---: | --- | --- |
| `id` | `string` | ✅ | — | 項目 ID。**所属コレクション内**で一意。 |
| `member` | `string \| string[]` | ✅ | — | 所属メンバー。配列なら**1 件以上**（[第 6 節](#6-メンバーと複数メンバー項目)）。 |
| `name` | `string` | ✅ | — | 項目表示名。 |
| `image` | `string` | ❌ | — | 画像 URL。`inline` では必須、`baseUrl` では省略可（自動生成）。 |
| `rotated` | `boolean` | ❌ | `false` | 横向き（回転）画像かどうか。2 倍幅で表示（[7.3](#73-rotated) 参照）。 |

### 4.5 layout

| フィールド | 型 | 必須 | 既定 | 説明 |
| --- | --- | :---: | --- | --- |
| `aspectRatio` | `string` `"x/y"` | ❌ | `"7/10"` | 縦横比。例 `"7/10"`（旧配列形式 `[7, 10]` も可）。 |
| `columns` | `number[]` | ❌ | `[3, 6, 9]` | レスポンシブ列数 `[モバイル, タブレット, 大画面]`、各値 ≥ 1（[7.2](#72-columns) 参照）。 |

### 4.6 imageBaseUrl

| フィールド | 型 | 必須 | 説明 |
| --- | --- | :---: | --- |
| `root` | `string` (URL) | ✅ | 画像ルート（末尾スラッシュなし）。URL 生成に使用。 |
| `format` | `"jpg"` \| `"png"` \| `"webp"` | ✅ | 画像拡張子。 |
| `fallback` | `string` (URL) | ❌ | 読み込み失敗時のプレースホルダー画像。 |

### 4.7 migrations

各ルール：

| フィールド | 型 | 必須 | 説明 |
| --- | --- | :---: | --- |
| `revision` | `number` | ✅ | この移行を導入する revision（整数）。 |
| `operations` | `array` | ✅ | 操作一覧（下記）。 |

各 operation：

| フィールド | 型 | 必須 | 説明 |
| --- | --- | :---: | --- |
| `type` | `"replace-in-id"` | ✅ | 現状は「id 内の文字列置換」のみ対応。 |
| `from` | `string` | ✅ | 置換対象の部分文字列。 |
| `to` | `string` | ✅ | 置換後の部分文字列。 |

---

## 5. 二つの画像モード

テンプレートはルートフィールド `imageResourceType` で画像解決方式を宣言します。

### 5.1 `inline` モード

各項目の `image` に**完全な画像 URL**を直接書きます。

```json
{
  "imageResourceType": "inline",
  "collections": [
    {
      "id": "2026-new-year",
      "name": "2026年新春",
      "items": [
        {
          "id": "nanaka-hiki",
          "member": "noguchi-nanaka",
          "name": "野口菜々風 ヒキ",
          "image": "https://raw.githubusercontent.com/monaka-ikonoi/my-ideals/refs/heads/main/public/sample/sample-image.webp"
        }
      ]
    }
  ]
}
```

- **長所**：柔軟。各画像を任意の場所・名前で配置可。
- **短所**：項目が多いと JSON が冗長、URL を手書き。

### 5.2 `baseUrl` モード

画像の基準を一度だけ設定すると、アプリが**固定ルール**で各項目の URL を生成するため、項目に **`image` 不要**。

```json
{
  "imageResourceType": "baseUrl",
  "revision": 4,
  "imageBaseUrl": {
    "root": "https://example.com/equal-me",
    "format": "webp"
  },
  "collections": [
    {
      "id": "2026-new-year",
      "name": "2026年新春",
      "items": [
        { "id": "nanaka-hiki", "member": "noguchi-nanaka", "name": "野口菜々風 ヒキ" }
      ]
    }
  ]
}
```

**URL 生成ルール**：

```
{root}/{collectionId}/{itemId}.{format}?rev={revision}
```

上例で `nanaka-hiki` は次のように解決されます：

```
https://example.com/equal-me/2026-new-year/nanaka-hiki.webp?rev=4
```

よって画像は `root/コレクションid/項目id.format` の構造で配置が必要。末尾の `?rev={revision}` はテンプレートの `revision` 由来で、更新時のキャッシュ更新に使用。

- **`fallback`**：任意。読み込み失敗時に表示。
- **長所**：JSON が最小限、項目は `id` / `member` / `name` のみ。画像を一元管理。
- **短所**：命名規則の厳守が必要、URL は自由化不可。

### 5.3 どちらを選ぶ？

| シナリオ | 推奨 |
| --- | --- |
| 画像が多く、1 ディレクトリに揃え、命名を統一できる | **`baseUrl`** |
| CDN / サーバーの構造を自分で管理できる | **`baseUrl`** |
| 画像の出所がバラバラ（別サイト・別命名） | `inline` |
| 小さなテンプレートを手早く試す | `inline` |

総じて：**多くの項目で保守性を求めるなら `baseUrl`**、出所が雑多か小規模なら `inline`。

---

## 6. メンバーと複数メンバー項目

`item.member` は**単一メンバー id**（`string`）でも、**複数**（`string[]`、1 件以上）でも可。

```json
{ "id": "nanaka-hiki", "member": "noguchi-nanaka", "name": "野口菜々風 ヒキ" }

{ "id": "nanaka-moeko", "member": ["noguchi-nanaka", "yamamoto-moeko"], "name": "野口菜々風 x 山本萌子" }
```

- ユーザーが**メンバー絞り込み**を使うと、項目の `member` が選択メンバーのいずれかを**含む**場合に表示。
- 集合 / 2 ショット写真を配列で書けば、関連メンバーのどの絞り込みでも表示。
- `member` の各 id はルート `members[]` に存在する必要があります。

---

## 7. レイアウトと表示

レイアウトは**テンプレート級**（ルート `layout`）か**コレクション級**（`collection.layout`）で宣言。コレクション級があれば**上書き**、どちらも無ければ既定値。

### 7.1 `aspectRatio`

- `string` 形式 `"幅/高さ"`、例 `"7/10"`、`"5/8"`。分子・分母とも ≥ 1 の整数。
- 旧配列形式 `[幅, 高さ]`（例 `[5, 8]`）も可、自動的に `"5/8"` に変換。
- 既定値：`"7/10"`。

### 7.2 `columns`

`columns` はレスポンシブな `number[]`、最大 3 値で画面幅に対応：

| インデックス | 画面幅 | 意味 |
| :---: | --- | --- |
| `columns[0]` | < 768px | モバイル |
| `columns[1]` | 768px – 1535px | タブレット / デスクトップ |
| `columns[2]` | ≥ 1536px | 大画面 |

後方の値を省くと基準から推定：

- `columns` 無し → 既定 `[3, 6, 9]`。
- `[4]` → `[4, 8, 12]`（`[base, base×2, base×3]`）。
- `[4, 7]` → `[4, 7, 12]`。
- `[4, 7, 9]` → `[4, 7, 9]`。

各値は ≥ 1 の整数。

### 7.3 `rotated`

`"rotated": true` は横向き画像で、**2 倍幅**（約 2 列分）を占有。横構図向け。既定 `false`。

```json
{ "id": "nanaka-yori", "member": "noguchi-nanaka", "name": "野口菜々風 ヨリ", "rotated": true }
```

---

## 8. 検索キーワード

`collection.searchTerms` はコレクションに追加の検索ヒットを与えます。`name` に加えこれらにもマッチし、別名 / ローマ字 / 略称で探せます。

```json
{
  "id": "2026-new-year",
  "name": "2026年新春",
  "searchTerms": ["new year", "shinshun", "新春"]
}
```

検証：`searchTerms` を指定する場合、**配列は 1 件以上、各要素は空文字不可**。不要なら省略します。

---

## 9. バージョンとマイグレーション

### 9.1 `version` と `revision`

- **`version`**：スキーマバージョン。現在 `1` 固定。アプリの形式自体が上がる時のみ変化し、**作成者は変更しない**。
- **`revision`**：自分で管理する**コンテンツ改訂番号**（`number`、整数）。内容更新（項目の増減、画像差し替え等）のたびに +1。

### 9.2 アプリの更新検知

プロファイルは作成時のテンプレート `revision` を記録。再取得で `revision` がより高いと「更新あり」と判定し、**差分（diff）**を表示：追加 / 削除された項目を示し、削除データを残すか整理するか選べます。

> よって：**内容を更新したら必ず `revision` を上げる**、さもないと更新が伝わりません。

### 9.3 `id` の安定性とマイグレーション

[第 3 節](#3-基本概念)のとおり、ユーザーデータは `id` で保存されます。新版で **`collection.id` や `item.id` を改名**すると、旧プロファイルが一致せずデータが「消失」します。

`migrations` はこれを解決：「旧 id 内の部分文字列を置換」し、既存データを新 id に移行します。

対応操作は `replace-in-id`（id 内の文字列置換）のみ。

```json
{
  "revision": 5,
  "migrations": [
    {
      "revision": 5,
      "operations": [
        { "type": "replace-in-id", "from": "nanaka", "to": "noguchi-nanaka" }
      ]
    }
  ]
}
```

意味：プロファイルの revision が 5 未満なら、全 id（選択メンバー、コレクション key、項目 key）内の `nanaka` を `noguchi-nanaka` に置換。

注意：

- ルールの `revision` は改名を導入したリリースに合わせる。
- アプリは `revision` がプロファイルの現値**より大きい**ルールのみ、昇順で適用。
- `replace-in-id` は**部分文字列**置換。`from` は十分に具体的にし、無関係な id を巻き込まない（例：`from: "a"` は `a` を含む全 id を置換）。
- **ルートの `id` はマイグレーションで変更不可**——常に同一に保つ。さもないと `id-mismatch` で更新不可。

---

## 10. 自分のテンプレートを作る（手順）

1. **メンバー一覧**：全員を列挙し、安定した `id`（ローマ字 / 英小文字 + ハイフン、例 `noguchi-nanaka`）と表示 `name` を決める。
2. **コレクションと項目を設計**：シリーズ / 回ごとに `collections` を分け、各コレクションに `items` を列挙、安定 `id` を付与。
3. **画像モードを選び準備**：
   - `inline`：各項目に公開アクセス可能な画像 URL を用意し `image` に書く。
   - `baseUrl`：画像を `root/コレクションid/項目id.format` 構造でアップロードし `imageBaseUrl` を設定。
4. **メタデータ記入**：`magic`、`version`（`1`）、`revision`（初回 `1`）、`id`、`name`、任意で `description` / `author` / `link`。
5. **（任意）レイアウト**：必要なら `layout.aspectRatio` と `layout.columns` を設定、コレクション級で上書き可。
6. **サンプルで検証**：サンプルファイル（[第 14 節](#14-完全な例)）と照合し、JSON バリデーターで構文確認。
7. **公開・共有**：公開 URL に置き（[第 11 節](#11-ホスティングと公開)）、「新規プロファイル」で貼り付けてもらう。

---

## 11. ホスティングと公開

テンプレート JSON は、アプリが `fetch` できる**公開アクセス可能**な URL に置きます。

### 11.1 GitHub raw の例

公開リポジトリに `template.json` を push 後、raw URL を使用：

```
https://raw.githubusercontent.com/<user>/<repo>/refs/heads/main/template.json
```

### 11.2 CORS とアクセス性

- ブラウザから**クロスオリジン**で直接取得可能であること。GitHub raw や多くのストレージ / CDN は既定で満たします。
- **生の JSON**（`Content-Type` が JSON か plain text）を返すこと。HTML ページは不可。
- アプリはリダイレクトに追従（`redirect: follow`）しますが、最終 URL の提供を推奨。

### 11.3 更新の公開

1. 内容を編集。
2. **`revision` を上げる**。
3. `id` 改名があれば `migrations` を追加。
4. 同じ URL に上書き。

次回起動時、アプリが高い `revision` を検知し更新を促します。

---

## 12. 検証ルールとよくあるエラー

アプリはテンプレートを厳格に検証し、不一致は**読み込み失敗**になります。代表的な制約と修正：

| 症状 / エラー | 原因 | 修正 |
| --- | --- | --- |
| テンプレート未認識 | `magic` が `"my-ideals-template"` 以外 | リテラルを正確に |
| バージョンエラー | `version` が数値 `1` 以外 | `1`（`number`、文字列 `"1"` 不可） |
| `revision` 無効 | 整数でない | `1`、`2` など整数 |
| `link` / `root` / `fallback` エラー | URL 不正 | 完全な `https://...` |
| `aspectRatio` エラー | 形式不正 | `"7/10"` 等の `"x/y"`、または `[7, 10]` |
| `columns` エラー | 1 未満や 3 超 | 各 ≥ 1、最大 3 |
| `searchTerms` エラー | 空配列や空文字 | 1 件以上で空無し、不要なら削除 |
| `member` エラー | 空配列 | 単一 `string` か 1 件以上の `string[]` |
| `baseUrl` で画像なし | 構造 / 命名不一致 | `root/コレクションid/項目id.format` で配置 |
| 更新時 `id-mismatch` | ルート `id` 変更 | 元の `id` に戻す。ルート id は不変 |
| 更新後データ消失 | `collection.id` / `item.id` 改名で移行なし | `replace-in-id` を追加 |

> 失敗時は `field.path: message` 形式のヒントが出るので、該当フィールドを特定できます。

---

## 13. 技術付録（開発者向け）

内部を知りたい方向けに、ソースと対照して読めます。

### 13.1 スキーマ定義

正規の型と検証は以下にあります：

- 型：[`src/domain/template/types.ts`](../../src/domain/template/types.ts)
- Zod スキーマ：[`src/domain/template/schema.ts`](../../src/domain/template/schema.ts)（`TemplateSchema` を export）
- 画像基準型：[`src/domain/template/imageBaseUrl.ts`](../../src/domain/template/imageBaseUrl.ts)

主な制約（`schema.ts`）：

- `magic: z.literal('my-ideals-template')`、`version: z.literal(1)`、`revision: z.int()`。
- `link` / `imageBaseUrl.root` / `imageBaseUrl.fallback` は `z.url()`。
- `aspectRatio` は文字列正規表現 `^[1-9]\d*\/[1-9]\d*$`、または旧 `[int, int>=1]` タプルを `transform` で `"x/y"` に。
- `columns` は `[int>=1, (int>=1)?, (int>=1)?]` タプル。
- `searchTerms` は `z.array(z.string().min(1)).min(1).optional()`。
- `item.member` は `z.string().or(z.array(z.string()).min(1))`。

### 13.2 画像 URL の構築

`baseUrl` モードは [`src/utils/templateUtils.ts`](../../src/utils/templateUtils.ts) の `formatImageUrl` で結合：

```
`${root}/${collectionId}/${itemId}.${format}?rev=${revision}`
```

`inline` モードは `item.image` をそのまま使用。

### 13.3 レイアウト解決と既定値

[`src/utils/layoutUtils.ts`](../../src/utils/layoutUtils.ts)：

- `resolveAspectRatio`：`collection.layout` → `template.layout` → 既定 `"7/10"`。
- `resolveColumns`：`base = columns[0] ?? 3`、`[base, columns[1] ?? base*2, columns[2] ?? base*3]` を返すため既定 `[3, 6, 9]`。
- `indexByWidth`：`≥1536 → 2 (2xl)`、`≥768 → 1 (md)`、それ以外 `0 (xs)`。

### 13.4 マイグレーション機構

[`src/utils/templateMigration.ts`](../../src/utils/templateMigration.ts) の `applyTemplateMigrations`：

- `template.migrations` あり、`profile.revision < template.revision`、`profile.revision !== 0` の時のみ実行。
- `revision > profile.revision` のルールを昇順で適用。
- `replace-in-id` は `profile.selectedMembers` と `profile.collections` のコレクション key / 項目 key に `replaceAll(from, to)`。

### 13.5 取得と検証

[`src/utils/fetchTemplate.ts`](../../src/utils/fetchTemplate.ts) の `fetchTemplate`、4 つのエラー型：

- `network`：ネットワーク障害。
- `http`：2xx 以外。
- `parse`：JSON 解析 or Zod 検証失敗（各 issue を `path: message`）。
- `id-mismatch`：更新時、取得 `template.id` が紐づけ id と不一致。

### 13.6 Profile との関係

プロファイル構造は [`src/domain/profile`](../../src/domain/profile)。`collections[collectionId][itemId] = 状態` 形式で記録（標準モードは `boolean`、複数モードは `number`）、`template.{ id, link, revision }` でテンプレートに紐づき。サンプル [`public/sample/profile.json`](../../public/sample/profile.json)。

---

## 14. 完全な例

リポジトリには実用サンプルが 1 つあります。出発点にどうぞ：

- **`inline` モード**：[`public/sample/template.json`](../../public/sample/template.json) —— 単一・複数メンバー（2 ショット）項目を含む。

`baseUrl` モードは下記 14.2 の構成例を参照。

### 14.1 `inline` テンプレート（複数メンバー項目）

```json
{
  "magic": "my-ideals-template",
  "version": 1,
  "revision": 1,
  "id": "equal-me",
  "name": "=ME 生写真",
  "description": "=ME (イコールミー) 生写真",
  "author": "Example Author",
  "link": "https://github.com/monaka-ikonoi/my-ideals",
  "imageResourceType": "inline",
  "members": [
    { "id": "noguchi-nanaka", "name": "野口 菜々風" },
    { "id": "yamamoto-moeko", "name": "山本 萌子" }
  ],
  "collections": [
    {
      "id": "2026-new-year",
      "name": "2026年新春",
      "searchTerms": ["new year", "新春"],
      "items": [
        {
          "id": "nanaka-hiki",
          "member": "noguchi-nanaka",
          "name": "野口菜々風 ヒキ",
          "image": "https://raw.githubusercontent.com/monaka-ikonoi/my-ideals/refs/heads/main/public/sample/sample-image.webp"
        },
        {
          "id": "nanaka-moeko",
          "member": ["noguchi-nanaka", "yamamoto-moeko"],
          "name": "野口菜々風 x 山本萌子",
          "image": "https://raw.githubusercontent.com/monaka-ikonoi/my-ideals/refs/heads/main/public/sample/sample-image.webp"
        }
      ]
    }
  ]
}
```

### 14.2 `baseUrl` テンプレート（レイアウト付き）

```json
{
  "magic": "my-ideals-template",
  "version": 1,
  "revision": 4,
  "id": "equal-me-baseurl",
  "name": "=ME 生写真（baseUrl）",
  "author": "Example Author",
  "imageResourceType": "baseUrl",
  "imageBaseUrl": {
    "root": "https://example.com/equal-me",
    "format": "webp"
  },
  "layout": {
    "aspectRatio": "5/8",
    "columns": [3, 5, 10]
  },
  "members": [
    { "id": "noguchi-nanaka", "name": "野口 菜々風" },
    { "id": "yamamoto-moeko", "name": "山本 萌子" }
  ],
  "collections": [
    {
      "id": "2026-new-year",
      "name": "2026年新春",
      "items": [
        { "id": "nanaka-hiki", "member": "noguchi-nanaka", "name": "野口菜々風 ヒキ" },
        { "id": "moeko-hiki", "member": "yamamoto-moeko", "name": "山本萌子 ヒキ" }
      ]
    }
  ]
}
```

上の `nanaka-hiki` が解決する画像 URL：

```
https://example.com/equal-me/2026-new-year/nanaka-hiki.webp?rev=4
```
