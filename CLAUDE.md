# CLAUDE.md — Agent 工作契約

本檔是給 AI agent（Claude Code 等）的專案規則，也是人類 reviewer 理解「agent 被如何約束」的入口。
設計決策的完整理由見 [`docs/decisions.md`](docs/decisions.md)；題目見 [`docs/assignment.md`](docs/assignment.md)。

## 專案概要

momo **Merchant Card Showroom**（題目 B）：分析 momo 商品卡並建立可調整、可嵌入的商品卡系統。

- 卡片以 **React** 實作，透過**自寫的 Custom Element adapter** 包成 `<momo-product-card>`（Shadow DOM）
- Showroom（列表 / 單卡 + 調整面板）與 `sample.html` **都渲染同一個 custom element**
- 可調整、可持久化的只有**卡片呈現設定 `CardConfig`**（以 variant 為單位），商品內容固定為 mock

## 指令

> Scaffold（T1）完成後以實際 `package.json` 為準更新本段。

```bash
pnpm install
pnpm dev          # showroom dev server
pnpm test         # vitest（僅 core/）
pnpm lint
pnpm typecheck    # tsc --noEmit
pnpm build        # showroom app
pnpm build:embed  # momo-cards.js（Vite library mode）
```

## 架構分層與 import 規則（必須遵守）

```
src/
  core/      schema、config store、badge registry、report()   —— 純 TS，禁止 import React
  cards/     React 卡片元件、variants、內建 badge plugins      —— 只能 import core
  embed/     custom element adapter、registerBadge 公開 API   —— 可 import core、cards
  showroom/  showroom app                                     —— 可 import core、cards、embed
examples/ 或 public/
  sample.html
```

- `core` 不得 import `cards` / `embed` / `showroom`，也不得 import `react`
- `cards` 只能 import `core`
- `embed` 不得 import `showroom`；`showroom` 使用卡片時一律透過 `<momo-product-card>`，**不直接渲染卡片 React 元件**
- 新增依賴前先說明理由，不要自行加狀態管理 / UI / CSS 框架套件

## 程式碼風格

- 一律 **arrow function**，不使用 `function` 宣告
- 型別一律用 **`type`**，不使用 `interface`；組合用 `&`
- 偏好 functional style：純函式、immutable 更新（spread / 新物件），避免 class（Custom Element 因平台要求必須是 class，是唯一例外，且保持為薄 adapter）
- 資料型別由 Zod 推導：`type X = z.infer<typeof xSchema>`，不要手寫重複型別

## 資料與狀態規則

- **Zod 驗證只放在邊界**：localStorage 讀寫、custom element attribute 解析、`registerBadge` 輸入。邊界內信任型別，不做重複的防禦性檢查
- **Badge 逐筆容錯解析**：未註冊 type 或不合 schema 的 badge 跳過並 `report()`，不可讓整張卡失敗
- **Config 優先序**：attribute `config` > store 中該 variant 的設定 > schema 預設值
- **Config store**（`core/`）：自寫、框架無關，提供 `subscribe` / `getSnapshot` / `update` / `reset`
  - `getSnapshot` 在 state 未變時**必須回傳同一參照**；只有 `update` / `reset` 可產生新 state
  - React 端用 `useSyncExternalStore`；selector 不可在 getSnapshot 內產生新物件；`subscribe` 必須是穩定參照
  - `storage` 以參數注入，測試使用 in-memory fake
- **所有降級行為必須經過 `report()`**（config 驗證失敗、JSON attribute 解析失敗、badge 被跳過），不可靜默失敗

## 樣式

- 卡片 CSS 用一般 `.css` 檔，以 `?inline` 匯入後注入 shadow root；不用 CSS Modules / Tailwind
- 主題值（`CardConfig` 中的色彩、圓角等）轉為 **CSS custom properties** 設在 host element
- Showroom UI 用簡單 CSS 即可，不追求精緻

## 測試

- 只測 `core/`（Vitest）：config load / migration、store 參照穩定性與訂閱、config 優先序、badge 容錯解析與註冊
- 修改 `core/` 必須附對應測試；先寫測試再實作
- 不寫 E2E / 元件測試 / visual regression（刻意不做，見 decisions.md）

## Git / Commit

- 訊息用**英文**、Conventional Commits（`feat(core): ...`、`test(core): ...`、`docs: ...`）
- **一個 task 一個 commit**（task 編號見 decisions.md 的 Task List）
- Agent 參與的 commit 結尾加：
  ```
  Co-Authored-By: Claude <noreply@anthropic.com>
  Claude-Session: <session url>
  ```
- 純人工修正 agent 產出的 commit **不加** Co-Authored-By，並在訊息中說明修正原因
- 未經人類 review 不得 commit

## 工作流程

- 一次只做一個 task，依 decisions.md 的優先度順序；**不得自行擴大範圍**（P2 項目一律不做）
- 每個 task 完成後回報：做了什麼、如何驗證、有哪些未驗證的假設
- 遇到與本檔或 decisions.md 衝突的情況，停下來詢問，不要自行決定
- 時間盒：Phase 2 第 95 分鐘停止功能開發，轉寫 README
