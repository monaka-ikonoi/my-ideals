# Template JSON Guide

[English](../en/template.md) | [日本語](../ja/template.md) | [中文](../zh/template.md)

This guide is for **template creators**. It explains the structure of a My Ideals template JSON, the meaning of every field, and how to build and publish your own template from scratch.

## Table of Contents

1. [Overview](#1-overview)
2. [Quick Start (Minimal Example)](#2-quick-start-minimal-example)
3. [Core Concepts](#3-core-concepts)
4. [Field Reference](#4-field-reference)
5. [Two Image Modes](#5-two-image-modes)
6. [Members and Multi-Member Items](#6-members-and-multi-member-items)
7. [Layout and Display](#7-layout-and-display)
8. [Search Terms](#8-search-terms)
9. [Versioning and Migrations](#9-versioning-and-migrations)
10. [Create Your Own Template (Step by Step)](#10-create-your-own-template-step-by-step)
11. [Hosting and Publishing](#11-hosting-and-publishing)
12. [Validation Rules and Common Errors](#12-validation-rules-and-common-errors)
13. [Technical Appendix (Developers)](#13-technical-appendix-developers)
14. [Full Examples](#14-full-examples)

---

## 1. Overview

A **Template** is a JSON file that describes "which photos exist in a set" — for example "2024 Summer Concert Goods". Templates are maintained by community authors. A user just pastes the template URL to create their own **Profile**, then tracks each item as owned / unowned / wanted.

The hierarchy looks like this:

```
Template (maintained by author, shared by everyone)
└── members[]      member list (e.g. each idol)
└── collections[]  collections (e.g. a release, a live show)
    └── items[]    items (individual photos)

Profile (private to each user)
└── references a Template URL + revision
└── records each item's status (owned / quantity / wanted)
```

Typical workflow:

```
Author writes template.json
        │
        ▼
   Host it publicly (e.g. GitHub raw)
        │
        ▼
   Share the URL with users
        │
        ▼
User clicks "New Profile" and pastes the URL
        │
        ▼
App fetches & validates the template → user starts tracking
        │
        ▼
Author updates the template (bump revision) → app auto-detects the update
```

---

## 2. Quick Start (Minimal Example)

Below is a **ready-to-use** minimal template: 1 member, 1 collection, 1 item, using the `inline` image mode (each item writes its full image URL).

```json
{
  "magic": "my-ideals-template",
  "version": 1,
  "revision": 1,
  "id": "equal-me",
  "name": "=ME Namashashin",
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

Save this as a `.json` file, host it publicly (see [Section 11](#11-hosting-and-publishing)), and give the URL to your users.

---

## 3. Core Concepts

### 3.1 Three-Level Structure

- **member**: the categorization axis, usually each person in a group. Items belong to one or more members, enabling member filtering.
- **collection**: a group of photos, usually a release, a live show, or a series.
- **item**: a single photo, the smallest unit a user actually checks off.

### 3.2 `id` is a stable primary key

⚠️ The app **uses `id` to locate a user's collection data**, so once published, an `id` must stay stable:

- **Template root `id`**: never change it. A profile is bound to a template by `id`; on update the app checks that the fetched template's `id` matches. A mismatch raises an `id-mismatch` error and the user cannot update.
- **`collection.id` / `item.id`**: avoid changing them. If you do, the user's recorded status no longer matches and is effectively lost. If you must rename, use [migrations](#9-versioning-and-migrations) to tell the app how to map old ids to new ones.
- **`member.id`**: likewise referenced by a profile's "selected members"; changing it also requires a migration.

> Rule of thumb: `name` (display text) can change freely; `id` (identifier) must be treated as a primary key.

### 3.3 Uniqueness Scope of `id`

- `member.id`: unique within the whole template.
- `collection.id`: unique within the whole template.
- `item.id`: only needs to be unique **within its collection**. Different collections may reuse the same item id (e.g. both releases have `nanaka-hiki`) without conflict.

---

## 4. Field Reference

> The Type column uses native types (`string`, `number`, `boolean`, `array`, `object`); literals are shown in quotes.

### 4.1 Root object (Template)

| Field | Type | Required | Default | Description |
| --- | --- | :---: | --- | --- |
| `magic` | `"my-ideals-template"` | ✅ | — | Fixed literal used to identify the file type; must match **exactly**. |
| `version` | `1` | ✅ | — | Schema version, currently fixed to the number `1`. |
| `revision` | `number` | ✅ | — | Content revision (integer). **Increment** on every release; the app uses it to detect updates. |
| `id` | `string` | ✅ | — | Unique template id; **never change** after publishing (see [3.2](#32-id-is-a-stable-primary-key)). |
| `name` | `string` | ✅ | — | Template display name. |
| `description` | `string` | ❌ | — | Template description; `\n` for line breaks. |
| `author` | `string` | ❌ | — | Author credit. |
| `link` | `string` (URL) | ❌ | — | Homepage / source link; must be a valid URL. |
| `migrations` | `array` | ❌ | — | Migration rules for moving user data when `id`s change (see [Section 9](#9-versioning-and-migrations)). |
| `imageResourceType` | `"inline"` \| `"baseUrl"` | ✅ | — | Image resolution mode (see [Section 5](#5-two-image-modes)). |
| `imageBaseUrl` | `object` | ❌ | — | Image base config for `baseUrl` mode; omit in `inline` mode. |
| `layout` | `object` | ❌ | — | Template-level display layout (see [Section 7](#7-layout-and-display)). |
| `members` | `array` | ✅ | — | Member list. |
| `collections` | `array` | ✅ | — | Collection list. |

### 4.2 member

| Field | Type | Required | Description |
| --- | --- | :---: | --- |
| `id` | `string` | ✅ | Member id, unique in the template; keep stable after publishing. |
| `name` | `string` | ✅ | Member display name. |

> Tip: to categorize group / "all members" shots, add a pseudo-member like `{ "id": "all", "name": "All" }`.

### 4.3 collection

| Field | Type | Required | Default | Description |
| --- | --- | :---: | --- | --- |
| `id` | `string` | ✅ | — | Collection id, unique in the template. |
| `name` | `string` | ✅ | — | Collection display name. |
| `searchTerms` | `string[]` | ❌ | — | Extra search keywords; **if present, at least 1 item and each non-empty** (see [Section 8](#8-search-terms)). |
| `layout` | `object` | ❌ | inherits template | Collection-level layout; overrides template-level `layout`. |
| `items` | `array` | ✅ | — | Item list. |

### 4.4 item

| Field | Type | Required | Default | Description |
| --- | --- | :---: | --- | --- |
| `id` | `string` | ✅ | — | Item id, unique **within its collection**. |
| `member` | `string \| string[]` | ✅ | — | Owning member(s). When an array, **at least 1 element** (see [Section 6](#6-members-and-multi-member-items)). |
| `name` | `string` | ✅ | — | Item display name. |
| `image` | `string` | ❌ | — | Image URL. Required in `inline` mode; optional in `baseUrl` mode (built automatically). |
| `rotated` | `boolean` | ❌ | `false` | Whether it's a landscape (rotated) image, shown at double width (see [7.3](#73-rotated)). |

### 4.5 layout

| Field | Type | Required | Default | Description |
| --- | --- | :---: | --- | --- |
| `aspectRatio` | `string` `"x/y"` | ❌ | `"7/10"` | Item aspect ratio, e.g. `"7/10"` (also accepts the legacy array form `[7, 10]`). |
| `columns` | `number[]` | ❌ | `[3, 6, 9]` | Responsive columns `[mobile, tablet, large]`, each ≥ 1 (see [7.2](#72-columns)). |

### 4.6 imageBaseUrl

| Field | Type | Required | Description |
| --- | --- | :---: | --- |
| `root` | `string` (URL) | ✅ | Image root (no trailing slash), used to build image URLs. |
| `format` | `"jpg"` \| `"png"` \| `"webp"` | ✅ | Image extension. |
| `fallback` | `string` (URL) | ❌ | Placeholder shown when an image fails to load. |

### 4.7 migrations

Each rule:

| Field | Type | Required | Description |
| --- | --- | :---: | --- |
| `revision` | `number` | ✅ | The revision that introduces this migration (integer). |
| `operations` | `array` | ✅ | List of operations, see below. |

Each operation:

| Field | Type | Required | Description |
| --- | --- | :---: | --- |
| `type` | `"replace-in-id"` | ✅ | Currently only "replace a substring inside ids" is supported. |
| `from` | `string` | ✅ | Substring to replace. |
| `to` | `string` | ✅ | Replacement substring. |

---

## 5. Two Image Modes

A template must declare its image resolution mode via the root field `imageResourceType`.

### 5.1 `inline` mode

Each item writes its **full image URL** directly in the `image` field.

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

- **Pros**: flexible; each image can live anywhere with any name.
- **Cons**: verbose for many items; every URL is written by hand.

### 5.2 `baseUrl` mode

Configure the image base once; the app builds each item's image URL by a **fixed rule**, so items need **no `image` field**.

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

**URL build rule**:

```
{root}/{collectionId}/{itemId}.{format}?rev={revision}
```

In the example above, `nanaka-hiki` resolves to:

```
https://example.com/equal-me/2026-new-year/nanaka-hiki.webp?rev=4
```

So your image files must be stored in a `root/collectionId/itemId.format` directory structure. The trailing `?rev={revision}` comes from the template `revision` and busts the cache on updates.

- **`fallback`**: optional; shown when an image fails to load.
- **Pros**: minimal JSON; items only need `id` / `member` / `name`; images managed uniformly.
- **Cons**: images must follow the naming rule strictly; URLs cannot be customized.

### 5.3 Which one to choose?

| Scenario | Recommended |
| --- | --- |
| Many images, uploadable to one directory, controllable naming | **`baseUrl`** |
| You control the CDN / server directory structure | **`baseUrl`** |
| Scattered image sources (different sites / names) | `inline` |
| Just a quick small template | `inline` |

Overall: **prefer `baseUrl` for larger, maintainable sets**; use `inline` when sources are scattered or for small templates.

---

## 6. Members and Multi-Member Items

`item.member` can be a **single member id** (`string`) or **multiple member ids** (`string[]`, at least 1).

```json
{ "id": "nanaka-hiki", "member": "noguchi-nanaka", "name": "野口菜々風 ヒキ" }

{ "id": "nanaka-moeko", "member": ["noguchi-nanaka", "yamamoto-moeko"], "name": "野口菜々風 x 山本萌子" }
```

- When a user applies the **member filter**, an item shows if its `member` **contains** any of the selected members.
- So group / two-shot photos written as arrays appear under any related member's filter.
- Every id in `member` must exist in the root `members[]`.

---

## 7. Layout and Display

Layout can be declared at **template level** (root `layout`) or **collection level** (`collection.layout`). Collection level **overrides** template level; defaults apply when neither is set.

### 7.1 `aspectRatio`

- `string` of the form `"width/height"`, e.g. `"7/10"`, `"5/8"`. Both numerator and denominator must be integers ≥ 1.
- Also accepts the legacy array form `[width, height]` (e.g. `[5, 8]`), auto-converted to `"5/8"`.
- Default: `"7/10"`.

### 7.2 `columns`

`columns` is a **responsive** `number[]`, up to 3 values, for different screen widths:

| Index | Screen width | Meaning |
| :---: | --- | --- |
| `columns[0]` | < 768px | mobile |
| `columns[1]` | 768px – 1535px | tablet / desktop |
| `columns[2]` | ≥ 1536px | large desktop |

Omitted trailing values are derived from the base:

- No `columns` at all → default `[3, 6, 9]`.
- `[4]` → resolves to `[4, 8, 12]` (i.e. `[base, base×2, base×3]`).
- `[4, 7]` → resolves to `[4, 7, 12]`.
- `[4, 7, 9]` → stays `[4, 7, 9]`.

Each value must be an integer ≥ 1.

### 7.3 `rotated`

An item with `"rotated": true` is a landscape image and occupies **double width** (about 2 columns), ideal for landscape shots. Default `false`.

```json
{ "id": "nanaka-yori", "member": "noguchi-nanaka", "name": "野口菜々風 ヨリ", "rotated": true }
```

---

## 8. Search Terms

`collection.searchTerms` provides extra search hits for a collection. Besides matching `name`, user input also matches these terms, helping users find a collection by alias / romaji / abbreviation.

```json
{
  "id": "2026-new-year",
  "name": "2026年新春",
  "searchTerms": ["new year", "shinshun", "新春"]
}
```

Validation: if `searchTerms` is present, the **array must have at least 1 element and no empty strings**. Omit the field if unused.

---

## 9. Versioning and Migrations

### 9.1 `version` vs `revision`

- **`version`**: schema version, currently fixed to `1`. It only changes when the app's template format itself upgrades; **creators must not change it**.
- **`revision`**: your own **content revision** (`number`, integer). Bump it by 1 whenever you update the content (add / remove items, swap images, etc.).

### 9.2 How the app detects updates

A profile records the template `revision` at creation time. When the app re-fetches the template and finds a higher `revision`, it treats it as "updated" and shows a **template diff**: which items were added / removed, letting the user keep or clean up removed data.

> Therefore: **always increment `revision` after any content change**, or clients won't notice the update.

### 9.3 `id` stability and migrations

As covered in [Section 3](#3-core-concepts), user data is stored by `id`. If a new version **renames some `collection.id` or `item.id`**, old profiles no longer match and data is "lost".

`migrations` solve this: they tell the app to "replace a substring inside old ids", migrating existing user data to the new ids.

Only one operation is supported: `replace-in-id` (substring replacement in ids).

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

Meaning: when a user's profile revision is below 5, the app replaces `nanaka` with `noguchi-nanaka` in all ids (selected members, collection keys, item keys).

Notes:

- A rule's `revision` should match the release that introduced the rename.
- The app only applies rules with `revision` **greater than** the profile's current revision, in ascending order.
- `replace-in-id` is **substring** replacement; keep `from` specific to avoid hitting unrelated ids (e.g. `from: "a"` replaces every id containing `a`).
- **The root template `id` cannot be changed via migration** — it must always stay the same, or it triggers `id-mismatch` and users cannot update.

---

## 10. Create Your Own Template (Step by Step)

1. **List members**: enumerate all members, giving each a stable `id` (romaji / lowercase with hyphens, e.g. `noguchi-nanaka`) and a display `name`.
2. **Plan collections and items**: split `collections` by series / release, list `items` per collection, and assign stable `id`s.
3. **Pick an image mode and prepare images**:
   - `inline`: prepare a publicly accessible image URL per item and put it in `image`.
   - `baseUrl`: upload images in the `root/collectionId/itemId.format` structure and configure `imageBaseUrl`.
4. **Fill metadata**: `magic`, `version` (`1`), `revision` (`1` for first release), `id`, `name`; optional `description` / `author` / `link`.
5. **(Optional) configure layout**: set `layout.aspectRatio` and `layout.columns` as needed; override at collection level.
6. **Validate against samples**: compare with the sample files (see [Section 14](#14-full-examples)) field by field; use any JSON validator to confirm syntax.
7. **Host and share**: put the JSON at a public URL (see [Section 11](#11-hosting-and-publishing)) and have users paste it in "New Profile".

---

## 11. Hosting and Publishing

The template JSON must be at a **publicly reachable** URL so the app can `fetch` it.

### 11.1 GitHub raw example

After pushing `template.json` to a public repo, use its raw URL, e.g.:

```
https://raw.githubusercontent.com/<user>/<repo>/refs/heads/main/template.json
```

### 11.2 CORS and accessibility

- The URL must be directly requestable **cross-origin** by the browser. GitHub raw and most object storage / CDNs satisfy this by default.
- Ensure it returns **raw JSON** (`Content-Type` JSON or plain text), not an HTML wrapper page.
- The app follows redirects (`redirect: follow`), but prefer the final URL.

### 11.3 Publishing updates

1. Edit the content.
2. **Increment `revision`**.
3. Add matching `migrations` for any `id` renames.
4. Overwrite at the same URL.

Next time users open the app, it detects the higher `revision` and prompts to update.

---

## 12. Validation Rules and Common Errors

The app validates templates strictly; any mismatch causes a **load failure**. Common constraints and fixes:

| Symptom / error | Cause | Fix |
| --- | --- | --- |
| Template not recognized | `magic` not equal to `"my-ideals-template"` | Use the exact literal |
| Version error | `version` not the number `1` | Use `1` (`number`, not string `"1"`) |
| `revision` invalid | `revision` not an integer | Use integers like `1`, `2` |
| `link` / `root` / `fallback` error | Not a valid URL | Use a full `https://...` address |
| `aspectRatio` error | Wrong format | Use a `"x/y"` string like `"7/10"`, or array `[7, 10]` |
| `columns` error | Values < 1 or more than 3 elements | Each ≥ 1, max 3 |
| `searchTerms` error | Empty array or empty strings | ≥ 1 item, none empty; or drop the field |
| `member` error | Empty array | Use a single `string` or a `string[]` with ≥ 1 id |
| Images missing in `baseUrl` mode | Directory / naming off | Store as `root/collectionId/itemId.format` |
| `id-mismatch` on update | Root `id` changed | Restore the original `id`; root id is immutable |
| Data "lost" after update | Renamed `collection.id` / `item.id` without migration | Add a `replace-in-id` migration |

> On failure the app reports hints like `field.path: message`, helping you locate the offending field.

---

## 13. Technical Appendix (Developers)

For those who want to understand the internals, alongside the source.

### 13.1 Schema definition

Authoritative types and validation live in:

- Types: [`src/domain/template/types.ts`](../../src/domain/template/types.ts)
- Zod schema: [`src/domain/template/schema.ts`](../../src/domain/template/schema.ts) (exports `TemplateSchema`)
- Image base type: [`src/domain/template/imageBaseUrl.ts`](../../src/domain/template/imageBaseUrl.ts)

Key constraints (from `schema.ts`):

- `magic: z.literal('my-ideals-template')`, `version: z.literal(1)`, `revision: z.int()`.
- `link` / `imageBaseUrl.root` / `imageBaseUrl.fallback` use `z.url()`.
- `aspectRatio` accepts string regex `^[1-9]\d*\/[1-9]\d*$`, or the legacy `[int, int>=1]` tuple `transform`ed to `"x/y"`.
- `columns` is a `[int>=1, (int>=1)?, (int>=1)?]` tuple.
- `searchTerms` is `z.array(z.string().min(1)).min(1).optional()`.
- `item.member` is `z.string().or(z.array(z.string()).min(1))`.

### 13.2 Image URL construction

`baseUrl` mode joins via `formatImageUrl` in [`src/utils/templateUtils.ts`](../../src/utils/templateUtils.ts):

```
`${root}/${collectionId}/${itemId}.${format}?rev=${revision}`
```

`inline` mode uses `item.image` directly.

### 13.3 Layout resolution and defaults

See [`src/utils/layoutUtils.ts`](../../src/utils/layoutUtils.ts):

- `resolveAspectRatio`: `collection.layout` → `template.layout` → default `"7/10"`.
- `resolveColumns`: `base = columns[0] ?? 3`, returns `[base, columns[1] ?? base*2, columns[2] ?? base*3]`, hence default `[3, 6, 9]`.
- `indexByWidth`: `≥1536 → 2 (2xl)`, `≥768 → 1 (md)`, else `0 (xs)`, picking the active column index.

### 13.4 Migration mechanism

See `applyTemplateMigrations` in [`src/utils/templateMigration.ts`](../../src/utils/templateMigration.ts):

- Runs only when `template.migrations` exists, `profile.revision < template.revision`, and `profile.revision !== 0`.
- Applies rules with `revision > profile.revision`, in ascending order.
- `replace-in-id` runs `replaceAll(from, to)` over `profile.selectedMembers` and the collection keys / item keys of `profile.collections`.

### 13.5 Fetch and validation

See `fetchTemplate` in [`src/utils/fetchTemplate.ts`](../../src/utils/fetchTemplate.ts), which returns four error types:

- `network`: network failure.
- `http`: non-2xx HTTP status.
- `parse`: JSON parse or Zod validation failure (each issue as `path: message`).
- `id-mismatch`: when updating, the fetched `template.id` differs from the bound id.

### 13.6 Relationship with Profile

Profile structure is in [`src/domain/profile`](../../src/domain/profile). A profile stores records as `collections[collectionId][itemId] = status` (`boolean` in standard mode, `number` in count mode), bound to a template via `template.{ id, link, revision }`. See sample [`public/sample/profile.json`](../../public/sample/profile.json).

---

## 14. Full Examples

The repo ships one real, usable sample file; use it as a starting point:

- **`inline` mode**: [`public/sample/template.json`](../../public/sample/template.json) — has single- and multi-member (two-shot) items.

For `baseUrl` mode, see the constructed example in 14.2 below.

### 14.1 `inline` template (with multi-member item)

```json
{
  "magic": "my-ideals-template",
  "version": 1,
  "revision": 1,
  "id": "equal-me",
  "name": "=ME Namashashin",
  "description": "=ME (Equal Me) photos",
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

### 14.2 `baseUrl` template (with layout)

```json
{
  "magic": "my-ideals-template",
  "version": 1,
  "revision": 4,
  "id": "equal-me-baseurl",
  "name": "=ME Namashashin (baseUrl)",
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

The image URL resolved for `nanaka-hiki` above is:

```
https://example.com/equal-me/2026-new-year/nanaka-hiki.webp?rev=4
```
