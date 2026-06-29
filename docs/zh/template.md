# Template JSON 说明文档

[English](../en/template.md) | [日本語](../ja/template.md) | [中文](../zh/template.md)

本文档面向**模板（Template）制作者**，介绍 My Ideals 模板 JSON 的结构、每个字段的含义，以及如何从零创建并发布你自己的模板。

## 目录

1. [概述](#1-概述)
2. [快速开始（最小示例）](#2-快速开始最小示例)
3. [核心概念](#3-核心概念)
4. [完整字段参考](#4-完整字段参考)
5. [两种图片模式](#5-两种图片模式)
6. [成员与多成员条目](#6-成员与多成员条目)
7. [布局与显示](#7-布局与显示)
8. [搜索关键词](#8-搜索关键词)
9. [版本与迁移](#9-版本与迁移)
10. [创建你自己的模板（分步）](#10-创建你自己的模板分步)
11. [托管与发布](#11-托管与发布)
12. [校验规则与常见错误](#12-校验规则与常见错误)
13. [技术附录（开发者）](#13-技术附录开发者)
14. [完整示例](#14-完整示例)

---

## 1. 概述

**模板（Template）** 是一份描述「某个系列里有哪些照片」的 JSON 文件，例如「2024 夏季演唱会周边」。模板由社区作者维护，用户只需粘贴模板的 URL，就能基于它创建自己的**档案（Profile）**，逐项记录自己持有 / 未持有 / 求收的状态。

层级关系如下：

```
Template（模板，作者维护、所有人共享）
└── members[]      成员列表（如各个偶像）
└── collections[]  合集（如某一期、某次公演）
    └── items[]    条目（一张张具体的照片）

Profile（档案，每个用户私有）
└── 引用某个 Template 的 URL + revision
└── 记录每个 item 的持有状态（已持有 / 数量 / 求收）
```

典型使用流程：

```
作者编写 template.json
        │
        ▼
   托管到公网（如 GitHub raw）
        │
        ▼
   把 URL 分享给用户
        │
        ▼
用户在 App 中「新建档案」并粘贴 URL
        │
        ▼
App 拉取并校验模板 → 用户开始记录收藏
        │
        ▼
作者更新模板（升 revision）→ App 自动检测并提示更新
```

---

## 2. 快速开始（最小示例）

下面是一个**可直接使用**的最小模板：1 个成员、1 个合集、1 个条目，使用 `inline` 图片模式（每个条目直接写完整图片 URL）。

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

把这段 JSON 保存为 `.json` 文件、托管到公网（见[第 11 节](#11-托管与发布)），再把 URL 交给用户即可。

---

## 3. 核心概念

### 3.1 三层结构

- **member（成员）**：收藏的归类维度，通常是团体里的每个人。条目会归属到一个或多个成员，便于按成员筛选。
- **collection（合集）**：一组照片，通常对应一期商品、一次公演、一个系列。
- **item（条目）**：一张具体的照片，是用户实际打勾记录的最小单位。

### 3.2 `id` 是稳定主键

⚠️ App **用 `id` 来定位用户的收藏数据**，因此 `id` 一旦发布就应当保持稳定：

- **模板根 `id`**：永远不能改。用户档案通过 `id` 与模板绑定，App 在更新时会校验拉取到的模板 `id` 是否一致；不一致会报 `id-mismatch` 错误，用户将无法更新。
- **`collection.id` / `item.id`**：尽量不要改。如果改了，用户已记录的状态会「对不上号」而丢失。确有必要重命名时，必须通过 [迁移（migrations）](#9-版本与迁移) 告诉 App 如何把旧 id 映射到新 id。
- **`member.id`**：同理，被档案的「已选成员」引用，改动也需配合迁移。

> 经验法则：`name`（显示名）可以随意改，`id`（标识符）要当成「主键」对待。

### 3.3 `id` 的唯一性范围

- `member.id`：在整个模板内唯一。
- `collection.id`：在整个模板内唯一。
- `item.id`：只需在**所属合集内**唯一。不同合集可以使用相同的 item id（例如两期都有 `nanaka-hiki`），互不影响。

---

## 4. 完整字段参考

> 类型列使用原生类型（`string`、`number`、`boolean`、`array`、`object`），字面量用引号标出。

### 4.1 根对象（Template）

| 字段 | 类型 | 必填 | 默认 | 说明 |
| --- | --- | :---: | --- | --- |
| `magic` | `"my-ideals-template"` | ✅ | — | 固定字面量，用于识别文件类型，必须**精确**等于此值。 |
| `version` | `1` | ✅ | — | Schema 版本，当前固定为数字 `1`。 |
| `revision` | `number` | ✅ | — | 内容修订号（整数）。每次发布更新（增删条目等）应**递增**，App 据此检测更新。 |
| `id` | `string` | ✅ | — | 模板唯一标识，发布后**不可更改**（见 [3.2](#32-id-是稳定主键)）。 |
| `name` | `string` | ✅ | — | 模板显示名称。 |
| `description` | `string` | ❌ | — | 模板描述，可用 `\n` 换行。 |
| `author` | `string` | ❌ | — | 作者署名。 |
| `link` | `string` (URL) | ❌ | — | 模板主页 / 来源链接，必须是合法 URL。 |
| `migrations` | `array` | ❌ | — | 迁移规则列表，用于在 `id` 变更时迁移用户数据（见[第 9 节](#9-版本与迁移)）。 |
| `imageResourceType` | `"inline"` \| `"baseUrl"` | ✅ | — | 图片解析模式（见[第 5 节](#5-两种图片模式)）。 |
| `imageBaseUrl` | `object` | ❌ | — | `baseUrl` 模式下的图片基址配置；`inline` 模式可省略。 |
| `layout` | `object` | ❌ | — | 模板级显示布局（见[第 7 节](#7-布局与显示)）。 |
| `members` | `array` | ✅ | — | 成员列表。 |
| `collections` | `array` | ✅ | — | 合集列表。 |

### 4.2 member（成员）

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | :---: | --- |
| `id` | `string` | ✅ | 成员标识，模板内唯一，发布后尽量不变。 |
| `name` | `string` | ✅ | 成员显示名。 |

> 小技巧：如需为「合影 / 集合」类照片归类，可加入一个伪成员，例如 `{ "id": "all", "name": "集合" }`。

### 4.3 collection（合集）

| 字段 | 类型 | 必填 | 默认 | 说明 |
| --- | --- | :---: | --- | --- |
| `id` | `string` | ✅ | — | 合集标识，模板内唯一。 |
| `name` | `string` | ✅ | — | 合集显示名。 |
| `searchTerms` | `string[]` | ❌ | — | 额外搜索关键词，**若提供则至少 1 项，且每项非空**（见[第 8 节](#8-搜索关键词)）。 |
| `layout` | `object` | ❌ | 继承模板级 | 合集级布局，覆盖模板级 `layout`。 |
| `items` | `array` | ✅ | — | 条目列表。 |

### 4.4 item（条目）

| 字段 | 类型 | 必填 | 默认 | 说明 |
| --- | --- | :---: | --- | --- |
| `id` | `string` | ✅ | — | 条目标识，**所属合集内**唯一。 |
| `member` | `string \| string[]` | ✅ | — | 归属成员。数组时**至少 1 项**（见[第 6 节](#6-成员与多成员条目)）。 |
| `name` | `string` | ✅ | — | 条目显示名。 |
| `image` | `string` | ❌ | — | 图片地址。`inline` 模式必填；`baseUrl` 模式可省略（由基址自动拼接）。 |
| `rotated` | `boolean` | ❌ | `false` | 是否为横向（旋转）图片，显示时占双倍宽度（见 [7.3](#73-rotated-横向条目)）。 |

### 4.5 layout（布局）

| 字段 | 类型 | 必填 | 默认 | 说明 |
| --- | --- | :---: | --- | --- |
| `aspectRatio` | `string` `"x/y"` | ❌ | `"7/10"` | 条目宽高比。格式如 `"7/10"`（也兼容旧的数组写法 `[7, 10]`）。 |
| `columns` | `number[]` | ❌ | `[3, 6, 9]` | 响应式列数 `[手机, 平板, 大屏]`，每个值 ≥ 1（见 [7.2](#72-columns-列数)）。 |

### 4.6 imageBaseUrl（图片基址）

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | :---: | --- |
| `root` | `string` (URL) | ✅ | 图片根地址（不含末尾斜杠），用于拼接图片 URL。 |
| `format` | `"jpg"` \| `"png"` \| `"webp"` | ✅ | 图片扩展名。 |
| `fallback` | `string` (URL) | ❌ | 当某张图片加载失败时显示的占位图地址。 |

### 4.7 migrations（迁移规则）

每条规则：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | :---: | --- |
| `revision` | `number` | ✅ | 该迁移在哪个 revision 引入（整数）。 |
| `operations` | `array` | ✅ | 操作列表，见下。 |

每个 operation：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | :---: | --- |
| `type` | `"replace-in-id"` | ✅ | 目前仅支持「在 id 中替换字符串」。 |
| `from` | `string` | ✅ | 被替换的子串。 |
| `to` | `string` | ✅ | 替换为的子串。 |

---

## 5. 两种图片模式

模板必须通过根字段 `imageResourceType` 声明图片解析方式。

### 5.1 `inline` 模式

每个条目用 `image` 字段直接写出**完整图片 URL**。

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

- **优点**：灵活，每张图可放在不同位置 / 不同命名。
- **缺点**：条目多时 JSON 冗长，每张图都要手写 URL。

### 5.2 `baseUrl` 模式

只配置一次图片基址，App 会按**固定规则**自动拼接每个条目的图片 URL，条目本身**无需写 `image`**。

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

**URL 拼接规则**：

```
{root}/{collectionId}/{itemId}.{format}?rev={revision}
```

上例中 `nanaka-hiki` 的图片地址会被解析为：

```
https://example.com/equal-me/2026-new-year/nanaka-hiki.webp?rev=4
```

因此你的图片文件必须按 `根地址/合集id/条目id.格式` 的目录结构存放。末尾的 `?rev={revision}` 由模板的 `revision` 决定，用于在更新时刷新缓存。

- **`fallback`**：可选。当某张图加载失败时，显示该占位图。
- **优点**：JSON 极简，条目只需 `id` / `member` / `name`；图片统一管理。
- **缺点**：图片必须严格按命名规则存放，URL 不能随意自定义。

### 5.3 该选哪种？

| 场景 | 推荐 |
| --- | --- |
| 图片数量多、可统一上传到一个目录、命名可控 | **`baseUrl`** |
| 你能控制 CDN / 服务器目录结构 | **`baseUrl`** |
| 图片来源零散（不同站点 / 不同命名） | `inline` |
| 只是快速试做一个小模板 | `inline` |

总体建议：**条目较多、追求可维护性时优先用 `baseUrl`**；图片来源杂乱或仅做小型模板时用 `inline`。

---

## 6. 成员与多成员条目

`item.member` 既可以是**单个成员 id**（`string`），也可以是**多个成员 id**（`string[]`，至少 1 项）。

```json
{ "id": "nanaka-hiki", "member": "noguchi-nanaka", "name": "野口菜々風 ヒキ" }

{ "id": "nanaka-moeko", "member": ["noguchi-nanaka", "yamamoto-moeko"], "name": "野口菜々風 x 山本萌子" }
```

- 用户在 App 里使用**成员筛选**时，只要条目的 `member` **包含**所选成员中的任意一个，该条目就会显示。
- 因此合影 / 双人照写成数组后，在任一相关成员的筛选下都能出现。
- `member` 里的每个 id 都必须能在根 `members[]` 中找到对应项。

---

## 7. 布局与显示

布局可在**模板级**（根 `layout`）或**合集级**（`collection.layout`）声明。合集级存在时**覆盖**模板级；两者都没有时使用默认值。

### 7.1 `aspectRatio` （宽高比）

- `string` 格式 `"宽/高"`，例如 `"7/10"`、`"5/8"`。分子、分母都必须是 ≥ 1 的整数。
- 也兼容旧的数组写法 `[宽, 高]`（如 `[5, 8]`），会被自动转换为 `"5/8"`。
- 默认值：`"7/10"`。

### 7.2 `columns` （列数）

`columns` 是一个**响应式**列数 `number[]`，最多 3 个值，分别对应不同屏幕宽度：

| 索引 | 生效屏幕宽度 | 含义 |
| :---: | --- | --- |
| `columns[0]` | < 768px | 手机 |
| `columns[1]` | 768px – 1535px | 平板 / 普通桌面 |
| `columns[2]` | ≥ 1536px | 大屏桌面 |

省略后面的值时会自动按基准推算：

- 完全不写 `columns` → 默认 `[3, 6, 9]`。
- 只写 `[4]` → 解析为 `[4, 8, 12]`（即 `[base, base×2, base×3]`）。
- 写 `[4, 7]` → 解析为 `[4, 7, 12]`。
- 写 `[4, 7, 9]` → 即 `[4, 7, 9]`。

每个值都必须是 ≥ 1 的整数。

### 7.3 `rotated` （横向条目）

条目设 `"rotated": true` 表示这是一张横向图片，网格中会占用**双倍宽度**（约等于 2 列），适合横构图照片。默认 `false`。

```json
{ "id": "nanaka-yori", "member": "noguchi-nanaka", "name": "野口菜々風 ヨリ", "rotated": true }
```

---

## 8. 搜索关键词

`collection.searchTerms` 为合集提供额外的搜索命中词。用户在搜索框输入时，除了匹配 `name`，还会匹配这些关键词，便于用别名 / 罗马字 / 缩写找到合集。

```json
{
  "id": "2026-new-year",
  "name": "2026年新春",
  "searchTerms": ["new year", "shinshun", "新春"]
}
```

校验要求：若提供 `searchTerms`，则**数组至少 1 项，且每一项都不能是空字符串**。不需要该功能时直接省略此字段即可。

---

## 9. 版本与迁移

### 9.1 `version` vs `revision`

- **`version`**：Schema 结构版本，当前固定为 `1`。只有 App 的模板格式本身升级时才会变化，**模板作者不要改动**。
- **`revision`**：你自己维护的**内容修订号**（`number`，整数）。每当你更新模板内容（新增 / 删除条目、改图等）就把它 +1。

### 9.2 App 如何检测更新

档案里记录了创建时模板的 `revision`。当 App 重新拉取模板，发现模板的 `revision` 比档案记录的更高时，就判定「有更新」，并向用户展示**模板差异（diff）**：哪些条目新增、哪些被移除，让用户选择保留或清理已移除条目对应的数据。

> 因此：**只要更新了内容，务必递增 `revision`**，否则用户端不会感知到更新。

### 9.3 `id` 稳定性与迁移

如[第 3 节](#3-核心概念)所述，用户数据是按 `id` 存储的。如果你在新版本里**重命名了某些 `collection.id` 或 `item.id`**，旧档案里的记录会对不上，导致用户数据「丢失」。

`migrations` 用来解决这个问题：它告诉 App「把旧 id 里的某段字符串替换成新的」，从而把用户已有数据迁移到新 id 上。

目前仅支持一种操作：`replace-in-id`（在 id 中做字符串替换）。

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

含义：当用户档案的 revision 低于 5 时，App 会把其数据中所有 id（包括已选成员、合集 key、条目 key）里出现的 `nanaka` 替换为 `noguchi-nanaka`。

注意要点：

- 迁移规则的 `revision` 应与「引入该改名的那次发布」对应。
- App 只会应用 `revision` **大于**用户当前档案 revision 的规则，并按 revision 从小到大依次应用。
- `replace-in-id` 是**子串替换**，请确保 `from` 足够精确，避免误伤其他 id（例如 `from: "a"` 会替换所有含 `a` 的 id）。
- **根模板 `id` 不能用迁移改**——它必须始终保持不变，否则会触发 `id-mismatch`，用户无法更新。

---

## 10. 创建你自己的模板（分步）

1. **整理成员列表**：列出所有成员，为每人定一个稳定的 `id`（建议用罗马字 / 英文小写加连字符，如 `noguchi-nanaka`）和显示 `name`。
2. **规划合集与条目**：按系列 / 期数划分 `collections`，每个合集列出 `items`。为每个合集和条目定好稳定 `id`。
3. **选择图片模式并准备图片**：
   - 选 `inline`：为每个条目准备好可公开访问的图片 URL，写进 `image`。
   - 选 `baseUrl`：把图片按 `root/合集id/条目id.格式` 的目录结构上传，配置好 `imageBaseUrl`。
4. **填写元数据**：`magic`、`version`（填 `1`）、`revision`（首发填 `1`）、`id`、`name`，可选 `description` / `author` / `link`。
5. **（可选）配置布局**：需要时设置 `layout.aspectRatio` 和 `layout.columns`，可在合集级覆盖。
6. **对照样例校验**：参考仓库里的样例文件（见[第 14 节](#14-完整示例)），逐字段核对类型与必填项。可用任意 JSON 校验器确认语法无误。
7. **托管并分享**：把 JSON 放到公网可访问地址（见[第 11 节](#11-托管与发布)），把 URL 交给用户，在 App「新建档案」处粘贴即可。

---

## 11. 托管与发布

模板 JSON 需要放在**公网可直接访问**的地址，App 才能用 `fetch` 拉取。

### 11.1 GitHub raw 示例

把 `template.json` 推到一个公开仓库后，使用其 raw 地址，例如：

```
https://raw.githubusercontent.com/<用户名>/<仓库>/refs/heads/main/template.json
```

### 11.2 CORS 与可访问性

- 该 URL 必须能被浏览器**跨域**直接请求（响应需允许跨域访问）。GitHub raw、多数对象存储 / CDN 默认满足。
- 确保返回的是**原始 JSON**（`Content-Type` 为 JSON 或纯文本），而不是 HTML 包装页面。
- App 会跟随重定向（`redirect: follow`），但仍建议直接提供最终地址。

### 11.3 发布更新

1. 修改模板内容。
2. **递增 `revision`**。
3. 如有 `id` 改名，补充对应的 `migrations`。
4. 覆盖发布到同一 URL。

用户下次打开时，App 会检测到更高的 `revision` 并提示更新。

---

## 12. 校验规则与常见错误

App 使用严格的 Schema 校验模板，任何不符都会导致**加载失败**。下面是常见约束与对应修复：

| 现象 / 错误 | 原因 | 修复 |
| --- | --- | --- |
| 模板无法识别 | `magic` 不等于 `"my-ideals-template"` | 精确填写该字面量 |
| 版本错误 | `version` 不是数字 `1` | 填 `1`（`number`，不是字符串 `"1"`） |
| `revision` 校验失败 | `revision` 不是整数 | 用整数，如 `1`、`2` |
| `link` / `root` / `fallback` 报错 | 不是合法 URL | 使用完整的 `https://...` 地址 |
| `aspectRatio` 报错 | 格式不符 | 用 `"7/10"` 这类 `"x/y"` 字符串，或数组 `[7, 10]` |
| `columns` 报错 | 含 < 1 的值或超过 3 个元素 | 每个值 ≥ 1，最多 3 个 |
| `searchTerms` 报错 | 是空数组或含空字符串 | 至少 1 项且每项非空；不需要则删除该字段 |
| `member` 报错 | 是空数组 | 用单个 `string`，或至少含 1 个 id 的 `string[]` |
| `baseUrl` 模式图片不显示 | 目录 / 命名不符拼接规则 | 按 `root/合集id/条目id.格式` 存放 |
| 更新时 `id-mismatch` | 改动了根 `id` | 恢复原 `id`，根 id 永不可改 |
| 用户更新后数据「丢失」 | 改了 `collection.id` / `item.id` 但未迁移 | 补 `migrations` 的 `replace-in-id` |

> App 在校验失败时会给出形如 `字段路径: 错误信息` 的提示，可据此定位具体字段。

---

## 13. 技术附录（开发者）

本节面向想了解内部机制的开发者，可对照仓库源码阅读。

### 13.1 Schema 定义

模板的权威类型与校验规则定义在：

- 类型：[`src/domain/template/types.ts`](../../src/domain/template/types.ts)
- Zod 校验：[`src/domain/template/schema.ts`](../../src/domain/template/schema.ts)（导出 `TemplateSchema`）
- 图片基址类型：[`src/domain/template/imageBaseUrl.ts`](../../src/domain/template/imageBaseUrl.ts)

关键约束（来自 `schema.ts`）：

- `magic: z.literal('my-ideals-template')`、`version: z.literal(1)`、`revision: z.int()`。
- `link` / `imageBaseUrl.root` / `imageBaseUrl.fallback` 使用 `z.url()`。
- `aspectRatio` 接受字符串正则 `^[1-9]\d*\/[1-9]\d*$`，或旧的 `[int, int>=1]` 元组并 `transform` 成 `"x/y"`。
- `columns` 为 `[int>=1, (int>=1)?, (int>=1)?]` 元组。
- `searchTerms` 为 `z.array(z.string().min(1)).min(1).optional()`。
- `item.member` 为 `z.string().or(z.array(z.string()).min(1))`。

### 13.2 图片 URL 构造

`baseUrl` 模式的拼接逻辑见 [`src/utils/templateUtils.ts`](../../src/utils/templateUtils.ts) 的 `formatImageUrl`：

```
`${root}/${collectionId}/${itemId}.${format}?rev=${revision}`
```

`inline` 模式直接使用 `item.image`。

### 13.3 布局解析与默认值

见 [`src/utils/layoutUtils.ts`](../../src/utils/layoutUtils.ts)：

- `resolveAspectRatio`：`collection.layout` → `template.layout` → 默认 `"7/10"`。
- `resolveColumns`：`base = columns[0] ?? 3`，返回 `[base, columns[1] ?? base*2, columns[2] ?? base*3]`，故默认 `[3, 6, 9]`。
- `indexByWidth`：`≥1536 → 2(2xl)`、`≥768 → 1(md)`、否则 `0(xs)`，决定当前生效的列数索引。

### 13.4 迁移机制

见 [`src/utils/templateMigration.ts`](../../src/utils/templateMigration.ts) 的 `applyTemplateMigrations`：

- 仅当 `template.migrations` 存在、且 `profile.revision < template.revision`、且 `profile.revision !== 0` 时执行。
- 取 `revision > profile.revision` 的规则，按 `revision` 升序应用。
- `replace-in-id` 通过 `replaceAll(from, to)` 作用于 `profile.selectedMembers`、`profile.collections` 的合集 key 与条目 key。

### 13.5 拉取与校验

见 [`src/utils/fetchTemplate.ts`](../../src/utils/fetchTemplate.ts) 的 `fetchTemplate`，返回的错误类型有四种：

- `network`：网络异常。
- `http`：HTTP 状态非 2xx。
- `parse`：JSON 解析或 Zod 校验失败（逐条以 `path: message` 形式给出）。
- `id-mismatch`：更新已有档案时，拉取到的 `template.id` 与档案绑定的 `id` 不一致。

### 13.6 与 Profile 的关系

档案结构见 [`src/domain/profile`](../../src/domain/profile)。档案以 `collections[collectionId][itemId] = 状态` 的形式存储用户记录（标准模式为 `boolean`，复数模式为 `number`），并通过 `template.{ id, link, revision }` 绑定到某个模板。可参考样例 [`public/sample/profile.json`](../../public/sample/profile.json)。

---

## 14. 完整示例

仓库中提供了一个真实可用的样例文件，建议作为起点：

- **`inline` 模式**：[`public/sample/template.json`](../../public/sample/template.json) —— 含单成员与多成员（双人）条目。

`baseUrl` 模式可参考下方 14.2 的构造示例。

### 14.1 `inline` 模板（含多成员条目）

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

### 14.2 `baseUrl` 模板（含布局）

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

上面 `nanaka-hiki` 解析出的图片地址为：

```
https://example.com/equal-me/2026-new-year/nanaka-hiki.webp?rev=4
```
