# AI / Agent 協作紀錄

> 本文件是**總結**，不是逐字紀錄。完整對話另行分享（Claude Code remote control session）。
> 重點放在：人在哪裡做決策、在哪裡修正 agent、agent 如何查證而非臆測。

- Agent：Claude Code（Claude Opus 5.5）
- 協作模式：Phase 1 以「grilling」方式進行——agent 一次只問一個決策問題並附推薦答案與 tradeoff，由人決定；Phase 2 一次一個 task，人 review 後才 commit。

## Phase 1 — Design / Planning

### 流程

1. Agent 將 PDF 轉貼的題目整理為 `docs/assignment.md`（依 bullet 數量還原條列結構）
2. 依決策依賴順序逐題討論 15 個決策（題目選擇 → 渲染技術 → adapter → 卡片範圍 → schema → plugin → 狀態範圍 → store → 專案結構 → 頁面 → 預覽方式 → 測試 → git → 部署 → 協作紀錄）
3. 產出有優先度的 Task List，人選定排法
4. 產出 `CLAUDE.md`（agent 契約）、`docs/decisions.md`、本文件

### Agent 的查證行為（事實而非記憶）

| 查證項目 | 方法 | 結果 |
|---|---|---|
| 本機環境 | shell | Node v24.14.0、pnpm 10.33.0、git 2.50.1 |
| 套件版本 | `npm view` | zod 4.6.5、react 19.3.0、vite 8.3.1；r2wc 2.1.1 等 |
| r2wc 能力 | 官方 README / API 文件 + npm registry | 發現 README（僅 React 18）與 peerDependencies（18 \|\| 19）**矛盾** → 標為待驗證，不直接採信 |
| momo 商品卡類型 | WebFetch 失敗（頁面為 JS 渲染）→ 改用瀏覽器實際瀏覽首頁與搜尋頁 | 整理出 grid / compact / 行銷 tile 三類與各欄位（見 decisions.md D4） |

### 關鍵轉折點（人的介入）

| # | 情境 | Agent 原建議 | 人的介入 | 結果 |
|---|---|---|---|---|
| 1 | 卡片渲染技術 | Lit Web Components | 「Lit 我不夠熟悉，我熟悉 React」 | 改 React + 自寫 adapter；重新定位為「選擇自己能有效審查 agent 產出的技術」——Agent Supervision 的前提 |
| 2 | Plugin 架構 | 直接給出 A/B/C 選項 | 要求重新解釋 Schema / Plugin Extensibility 的**目的** | 回到真實情境（行銷角標持續增減）說明，再做選擇；決策理由寫進 D6 |
| 3 | 調整介面範圍 | 內容 + 呈現兩者都做 | 以時間為由只做呈現設定 | 範圍收斂；schema 仍切兩份，source of truth 更清楚 |
| 4 | 一致性範圍 | 四層全做 | 只做 ①③④ | 跨分頁同步延後，架構預留 |
| 5 | Store 選型 | 自寫 vs zustand | 追問 zustand 以外的選項；中斷 agent 查詢，改問 `useSyncExternalStore` 原理 | 確認理解後選自寫；agent 如實說明替代方案僅查到版本、未完成比較 |
| 6 | 預覽渲染方式 | custom element，並稱「debug 不方便」 | 質疑 debug 代價 | **Agent 承認講太滿**：DevTools 應能看到獨立 root（推論）→ 改列為 scaffold 後實測項目，並備好退路（ShadowPreview） |
| 7 | 部署 | GitHub Pages + Actions | 改用 Vercel 且排最後；README 本機可啟動優先 | 優先度調整 |
| 8 | 協作紀錄 | 詳細記錄 | 完整對話另行分享 | 本文件改為總結 |
| 9 | T3 review：schema 函式庫 | 維持 Zod（agent 建議，並列出換 yup 的差異與成本） | 「我比較熟悉 yup」；型別改手寫 `type`、放在 import 後邏輯前 | 換 yup（同 D2 原則）。Agent 先寫探針腳本實測 yup 行為（巢狀預設、轉型、null、strict）再改寫，而非憑記憶 |
| 10 | T3 review：badge view 型別 | 泛型 `view: (data) => V`（cards 用 `ReactNode`） | 「看能不能拿掉泛型」，提出 `BadgeView = { label, color }` | 全部角標改宣告式；agent 建議泛型僅保留於 `defineBadge<T>`（否則 view 的 data 變 `unknown`），registry 型別全數去泛型 |

### 標示為「待驗證」的假設（Phase 2 需實測）

- React DevTools 能否看到 shadow root 內的卡片 React 樹（D12）
- React 19 對 custom element property 的傳遞行為（D12）
- embed bundle 體積（React + Zod）（D2、D5）
- `Co-Authored-By` trailer 格式與 Claude Code 官方慣例一致（D14）

## Phase 2 — Implementation

> 每個 task 一行：交給 agent 做什麼、如何驗證、人修正了什麼。

| Task | 交付內容 | 驗證方式 | 人的修正 / 備註 | Commit |
|---|---|---|---|---|
| T0 | First commit：Phase 1 產出（assignment / decisions / ai-collaboration / CLAUDE.md） | 人已於 Phase 1 結束時 review 三份文件 | — | `docs: add assignment and Phase 1 design decisions` |
| T1 | Scaffold：Vite 8 + React 19 + TS 6 strict + Vitest 5 + oxlint；`src/{core,cards,embed,showroom}` 分層目錄 | `typecheck` / `test` / `lint` / `build` 全過；dev server 回應正確 title | 模板預設 oxlint 而非規劃的 ESLint → 採用（更快、零設定），分層規則改用 oxlint 實作；`@types/node` 由 26 降為 24 以對齊 runtime；額外開啟 `noUncheckedIndexedAccess`。驗證 dev server 時 agent 誤用已被佔用的 port（另一個本機服務），改用空閒 port 重驗 | `chore: scaffold Vite + React + TS + Vitest project` |
| T2 | core schemas：`Product`（badges 保持 `unknown[]`）、`BadgeSlot` / `RawBadge`、`CardConfig`（`schemaVersion`、欄位 / slot 開關、標題行數、主題）；6 筆 mock 商品（含刻意的未知 / 壞角標）；本地 SVG placeholder 圖 | 5 個 schema 測試（mock 全合法、預設值、巢狀 prefault、拒絕非法值）；typecheck / lint 通過 | Agent 預先確認 Zod 4 `.default()` 不會套用巢狀預設、需改用 `.prefault()`（查 d.ts 確認 API 存在並以測試驗證）；mock 不外連 momo 圖片 | `feat(core): add Zod schemas and mock products` |
| T3 | `core/report.ts`（`Reporter` 注入）；`core/validation.ts`（`safeValidate`：把 yup 的 throw 轉為結果物件）；`core/badge-registry.ts`：`defineBadge` / `registerBadge`（回傳新 registry、拒絕重複 type）/ `createBadgeRegistry` / `resolveBadges`（逐筆：shape → 是否註冊 → payload）/ `groupBySlot` | 13 個測試（registry 7、schema 6）；typecheck / lint 通過 | 與 D6 差異：view 改為宣告式 `BadgeView`（人提出，去除泛型），core 不依賴 React；重複 type 拒絕並 report。**Review 時人決定 Zod → yup、型別手寫**：T2 schema 一併以 yup 重寫（`ObjectSchema<T>` 標註，tsc 實際抓到 `badges` 型別不符並修正） | `feat(core): add badge registry and switch schemas to yup` |
