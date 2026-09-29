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
