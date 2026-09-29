# 設計決策紀錄（Phase 1）

> Phase 1（Design / Planning）與 Claude Code 討論的結果。每條決策記錄：決策、理由、捨棄的選項、代價。
> 標示「**待驗證**」者為推論或尚未實測的假設，Phase 2 會以實測確認。

## 架構總覽

```
                    ┌──────────────────────── core/（純 TS，無 React）────────────────────────┐
                    │  yup schemas: Product / Badge / CardConfig(schemaVersion)               │
                    │  badge registry（逐筆容錯解析）   config store（subscribe/getSnapshot）   │
                    │  report()（降級事件出口）         config 優先序解析                        │
                    └──────────────▲──────────────────────────────▲───────────────────────────┘
                                   │                              │
                    cards/（React 卡片：variants + 內建 badge plugins + slots）
                                   ▲
                    embed/（Custom Element adapter：<momo-product-card>、Shadow DOM、registerBadge）
                          ▲                                   ▲
              showroom/（React app，渲染 custom element）   sample.html（<script type="module">）
```

資料流：調整面板 → `store.update(variant, patch)` → yup 驗證 → 寫入 localStorage → 通知訂閱者 → custom element 重繪。
Showroom 與嵌入卡片共用**同一個 store instance**（同一 bundle）。

---

## D1. 題目選 B：Merchant Card Showroom

- **理由**：2 小時實作預算下，B 的問題邊界清楚，時間可投入架構而非 UI 還原度；A 把「與真實網站的差異」列為考核重點，與「不需追求 UI 精緻度」相衝。B 的 bonus（Reusable / Schema-Plugin / State Consistency）直接對應評估目的；web component 嵌入需求天然帶出 production 議題（發佈、樣式隔離、宿主契約）。
- **捨棄**：A — 適合展示 routing / rendering strategy / CWV，但易陷入 CSS 還原。
- **代價**：B 容易過度設計（做出框架卻沒幾張卡），以嚴格的優先度與時間盒控制。

## D2. 卡片用 React 實作，包成 Custom Element

- **理由**：原本建議 Lit（原生 web component、~5KB）。但候選人熟悉 React、不熟 Lit。題目評估 **Agent Supervision**——用不熟的技術將削弱審查 agent 產出的能力，因此選「自己能有效 review 的技術」。
- **分層**：`core`（純 TS）→ `cards`（React）→ `embed`（Custom Element adapter）。宿主只看到 `<momo-product-card>`，不需知道內部是 React。
- **捨棄**：Lit（不熟，監督力下降）；純 HTML string render（無封裝、互動要自接）。
- **代價**：宿主頁需載入 React runtime（體積約數十 KB gzip，**待驗證**：build 後量測）；每張卡一個 React root。演進方向：`preact/compat` alias 縮小體積。

## D3. Custom Element adapter 自己寫（評估過 r2wc）

- **理由**：adapter 就是「宿主 ↔ 卡片」契約（attribute→props、JSON 解析失敗降級、shadow root 樣式注入、store 訂閱）。自寫約數十行、每行可解釋。
- **評估 r2wc**（`@r2wc/react-to-web-component`，查證於 2026-09-29）：v2.1.1、gzip ~1.36KB；支援 `string/number/boolean/json/function/method` 型別轉換與 `events` 選項派發 DOM event；**不處理 shadow root 樣式注入**（官方建議繼承後於 `connectedCallback` 自行注入）。README 寫僅支援 React 18，但 npm peerDependencies 為 `^18 || ^19`——文件與套件資訊矛盾，React 19 相容性**待驗證**。
- **演進**：卡片種類與 prop 型別增加、轉換邏輯變重時，可換用 r2wc 處理型別轉換。

## D4. 卡片範圍：一份 `Product` schema × 兩種 variant

實際觀察 momo（2026-09-29 首頁與搜尋頁）：

| 卡片 | 觀察到的欄位 |
|---|---|
| 搜尋結果卡（grid） | 多圖輪播；圖上角標（`mo點3%`、`免運券`、`$190超取免運`、`Ad`、`官方`、`限時加碼 8%`）；活動外框（`9/29限定`）；紅字促銷文案（`滿1件折391元`）；標題前徽章（`店+`、`好店`）；兩行標題 `【品牌】…`；價格 + `(售價已折)` / `起`；星等 + 評論數；`總銷量>100` |
| 首頁「降價好貨」卡（compact） | 圖、兩行標題（可含 `店+`/`好店`）、售價 + 劃線原價 |
| 行銷 tile | 活動入口（非商品卡） |

- **決策**：做 `grid` + `compact` 兩種 variant，共用同一份 `Product` schema。證明「資料與呈現分離」。
- **推論（未驗證）**：兩種卡可能共用同一份商品資料，momo 內部實作無法得知。
- **刻意不做**：圖片輪播（第一張圖 + dot 示意）、list variant、行銷 tile、活動外框。

## D5. Schema 以 yup 定義；型別手寫 `type`，schema 標註 `ObjectSchema<T>`

> 原決策為 Zod（T2、T3 以 Zod 實作），T3 review 時改為 yup。

- **理由**：有三個不受信任的輸入邊界——localStorage（舊版 / 壞資料 / 被竄改）、宿主 attribute（手寫 JSON）、調整面板輸入。TS 型別無 runtime 防線，需要 schema 驗證。
- **改用 yup 的原因**：候選人較熟悉 yup——與 D2（Lit → React）同一原則：選擇自己能有效審查 agent 產出的工具。
- **型別寫法**：手寫明確 `type`（一眼可讀結構），schema 以 `yup.ObjectSchema<T>` 標註，由編譯器檢查一致（實測：`badges` 型別不符時 tsc 確實報錯）。檔案順序為 import → type → 邏輯。
- **實測過的 yup 行為**（yup 1.7.1）：
  - 巢狀 object 預設值由子欄位自動組出（Zod 4 需 `.prefault()`）
  - 預設會轉型：`"3"`→`3`、`"false"`→`false`；`.strict()` 可關閉。**採用預設（非 strict）**：資料來源皆為 JSON，轉型風險低；代價是轉型不經過 `report()`
  - `validateSync` 失敗會 throw → 集中在 `core/validation.ts` 的 `safeValidate` 轉為 `{ ok, value | errors }`
  - 未知 key 預設保留
- **捨棄**：Zod（`safeParse` 不 throw、input/output 型別分離較佳，但候選人較不熟）；純 TS type（無 runtime 驗證）；JSON Schema + ajv。
- **代價**：型別與 schema 欄位需寫兩次（由 `ObjectSchema<T>` 標註防止漂移）；embed bundle 帶入 yup runtime（體積**待驗證**）；切換成本約 15 分鐘。
- 版本參考（npm，2026-09-29）：yup 1.7.1、react 19.3.0、vite 8.3.1。

## D6. Badge Plugin 架構：slot + 註冊制 + 逐筆容錯

**目的**：角標幾乎都是行銷活動產物，會持續新增與下架。若無擴充機制，每加一種角標都要改型別、改卡片 if/else、重新 build 所有嵌入頁。
- **Schema Extensibility**：資料演進——新角標自帶 schema，不動核心 `Product`；舊前端遇到新角標自動略過；localStorage 舊資料可 migration。
- **Plugin Extensibility**：功能演進與責任邊界——卡片只定義 slot（放哪），plugin 決定放什麼；新增角標 = 新增一個檔案，卡片本體零修改。

```ts
type BadgeView = { label: string; color: string }   // 宣告式、純資料、不綁框架
type BadgePlugin = {
  type: string
  slot: BadgeSlot            // "image-top-left" | "image-bottom-left" | "image-bottom-right" | "title-prefix"
  schema: Schema<unknown>    // 此角標自己的 payload schema（yup）
  view: (data: unknown) => BadgeView
}
// 泛型只留在 defineBadge<T>()：定義當下讓 view 的 data 依 schema 推導型別；registry / 解析結果皆無泛型
```

- **全部角標都是宣告式**（T3 review 時由人提出，取代原本「內建可自訂 render、對外才宣告式」）：內建與外部 `registerBadge` 走同一介面，T11 不需轉換層；`BadgeView` 可序列化、可測試，cards 以單一 `<Badge>` 元件渲染。
- **代價**：表達力受限（如 momo 的紅色三角「限時加碼」、帶 logo 的 mo點）。演進方式：`BadgeView` 加選填欄位（`shape?`、`icon?`），而非回到 `ReactNode`。

- **容錯**：`badges` 陣列逐筆解析；未註冊或不合 schema → 跳過 + `report()`，其他照常顯示。
- **對外擴充（選項 A）**：對外 `registerBadge()` 只收宣告式資料，不綁 React——維持「宿主不需知道內部是 React」。（T3 後內建角標也改為宣告式，見上）
- **捨棄**：B（對外也收 `ReactNode`，宿主須寫 React）；C（只允許 build-time 註冊）。
- **重複 type**（T3）：拒絕並 `report()`，保留既有 plugin——外部擴充不可靜默覆蓋內建角標。
- **代價**：registry 需共享可變參照。處理方式：registry 本身 immutable，全系統只有一個受控可變點（module 層級 current registry），已渲染卡片需訂閱變更。

## D7. 調整介面只調「呈現設定」`CardConfig`

- **決策**：採解讀 2——調整 variant 的呈現（欄位顯示開關、slot 開關、標題行數、主題色、圓角等）；商品內容固定為 mock。
- **理由**：`Product` 由商品系統擁有，卡片不該改；`CardConfig` 才是 showroom 擁有、應持久化的狀態。切開兩份 schema，source of truth 清楚；兩者變動頻率與生命週期不同。
- **捨棄**：同時可編輯商品內容（解讀 1+2）——時間不足。
- **Plugin 仍可展示**：mock 準備多筆帶不同角標的商品；`CardConfig` 含 slot 顯示開關。

## D8. State Consistency：做 ①③④，② 延後

| 層次 | 內容 | 狀態 |
|---|---|---|
| ① 同頁 | 調整面板、預覽、列表共用單一 store | ✅ 做 |
| ② 跨分頁 | `storage` event 同步 | ⏸ 不做（架構預留，約 5 行即可補上） |
| ③ 優先序 | attribute `config` > store 中該 variant 設定 > schema 預設值 | ✅ 做 |
| ④ 正確性 | 讀寫皆 yup 驗證；失敗套預設 + `report()`；`schemaVersion` migration | ✅ 做 |

- **限制（事實）**：localStorage 以 origin 隔離；真實第三方宿主讀不到 showroom 的設定。Production 應改為「showroom 發佈 config 至 API、卡片從 API 讀取」，localStorage 為 demo 替身。

## D9. Store 自己寫，React 端用 `useSyncExternalStore`

- **理由**：store 須同時服務 React（showroom）與非 React（custom element）。自寫、框架無關，約 50 行，一致性的每個環節（驗證邊界、immutable 更新、訂閱）攤在程式碼中。
- **為何 `useSyncExternalStore`**：避免 concurrent rendering 下的 tearing；避免 `useEffect` 訂閱前的更新遺漏。
- **必守規則**：`getSnapshot` 未變時回同一參照；selector 不在 getSnapshot 內產生新物件；`subscribe` 為穩定參照。Custom element 端直接 `store.subscribe`，於 `disconnectedCallback` 取消。
- **捨棄**：zustand（候選人使用經驗短；其本質即此模式的包裝）；nanostores / jotai / @xstate/store 僅查到版本，未深入比較。

## D10. 單一 Vite 專案 + 資料夾分層

- **決策**：不拆 monorepo。`vite build`（showroom）+ `vite build --config vite.embed.config.ts`（library mode → `momo-cards.js`，React 打包進去）。
- **分層規則**：見 `CLAUDE.md`；時間允許以 lint 的 `no-restricted-imports` 自動檢查（實作時改用 oxlint，見 T1 備註）。
- **捨棄**：pnpm workspace monorepo（package.json 邊界更硬，但設定成本 20~30 分鐘）。資料夾邊界設計成未來可直接搬為 package。

## D11. Showroom 以 variant 為單位；頁面與路由

```
/                 列表頁：遍歷 card registry，每個 variant 一區塊 × 多筆 mock 商品
/cards/:variant   單卡頁：預覽（可切換 mock 商品）+ 調整面板
```

- embed：`<momo-product-card variant="grid" product='{...}' config='{...}'>`（`config` 選填）
- card registry 僅內部物件，不對外開放註冊（避免範圍膨脹）
- 路由：React Router hash 模式——本機、Vercel、直接開檔皆無需額外設定
- **捨棄**：具名 preset（如「雙11版 grid」）——需 CRUD UI，列入演進方向

## D12. Showroom 預覽也渲染 custom element（選項 A）

- **理由**：單一渲染路徑——預覽即真實嵌入效果；adapter 在開發中持續被執行；store 自然共用。
- **樣式**：一般 CSS + `?inline` 注入 shadow root；主題以 CSS custom properties 設在 host element。
- **捨棄**：B `<ShadowPreview>`（createPortal 至 shadow root，樣式一致但 adapter 未被覆蓋）；C 直接渲染 React 元件（兩條樣式路徑、預覽可能不可信）。
- **待驗證**：React DevTools 是否能看到 shadow root 內的卡片 React 樹（推論：會以獨立 root 出現）。Scaffold 後實測；若不可見，退回 B（卡片元件不需改）。
- **待驗證**：React 19 對 custom element property 傳遞的支援行為。

## D13. 驗證策略：只測 `core/`

- Vitest 測：config load / migration、store 參照穩定性與訂閱、優先序解析、badge 容錯解析與註冊。
- 測試同時是**監督 agent 的工具**：人定義 / review 測試案例，agent 實作至通過。
- 靜態防線：TS strict、分層 lint。
- **Observability**：所有降級集中經 `report(event)`（目前 `console.warn` + 統一前綴），預留接 Sentry / Rollbar 的接入點。
- **刻意不做**：E2E、元件測試、visual regression（演進：Playwright 對 sample.html 做 visual regression）。

## D14. Git / Commit 策略

- Phase 1 **不 commit**（計時以 First Commit 起算）。Phase 2 第一個 commit 放 Phase 1 產出（題目、本文件、協作紀錄、CLAUDE.md）。
- 一個 task 一個 commit；Conventional Commits；英文。
- Agent 參與的 commit 加 `Co-Authored-By: Claude <noreply@anthropic.com>` 與 `Claude-Session:` trailer（trailer 格式**待確認**與 Claude Code 官方慣例一致）。
- 純人工修正 agent 產出的 commit 不加 Co-Authored-By，並註明原因——git log 即可看出人類介入點。
- 交付：GitHub repo。

## D15. 部署與文件優先度

- **README 優先**：確保他人可於本機依 README 啟動（在乾淨目錄實際照做驗證）。
- **Vercel 部署排最後**（P2，有空才做）。
- AI 協作：完整對話由候選人另行分享（Claude remote control 紀錄）；`docs/ai-collaboration.md` 只做總結。

---

## Task List（Phase 2，預算 120 分鐘）

**硬規則：第 95 分鐘停止功能開發，轉寫 README。** 排法採「A：P0 穩定交付，bonus 能做多少算多少」——T3/T4/T5 已將 plugin 與 store 一致性機制放入 P0，P1 未完成時三個 bonus 的核心機制仍存在。

### P0：基本需求 + 架構骨架

| # | Task | 預估（分） | 驗證 |
|---|---|---|---|
| T0 | First commit：assignment / decisions / ai-collaboration / CLAUDE.md | 2 | — |
| T1 | Scaffold：Vite + React 19 + TS strict + Vitest + oxlint（原規劃 ESLint，改用模板預設） | 8 | `pnpm dev` / `pnpm test` 可跑 |
| T2 | core：`Product` / `Badge` / `CardConfig` schema（含 `schemaVersion`）+ mock 商品 4~6 筆（實作 Zod，T3 review 後改 yup） | 10 | 手寫 type + `ObjectSchema<T>` 標註 |
| T3 | core：badge registry + 逐筆容錯解析 + `report()` + 測試 | 15 | 未知 / 不合法 badge 被跳過並 warn |
| T4 | core：config store（load / update / reset）+ 優先序解析 + 測試 | 15 | 參照穩定、壞資料回預設、優先序正確 |
| T5 | cards：grid variant + 3 個內建 badge plugin + slot 版面 + `?inline` CSS + CSS 變數主題 | 20 | 目視 |
| T6 | embed：custom element adapter（attribute 解析、shadow root、樣式注入、store 訂閱 / 取消） | 15 | showroom 使用即驗證 |
| T7 | showroom：列表頁 + 單卡頁 + 調整面板（hash router） | 15 | 即時更新、重新整理後保留 |
| T8 | `sample.html` + embed build 設定 | 5 | preview server 開啟 |
| T9 | README：本機啟動、架構圖、tradeoff、刻意不做、演進方向 | 15 | 乾淨目錄照做一次 |

### P1：補齊 Bonus（依序）

| # | Task | 預估（分） | 對應 |
|---|---|---|---|
| T10 | compact variant + card registry（列表頁遍歷） | 10 | Reusable Card Architecture |
| T11 | 對外宣告式 `registerBadge` + sample.html 自訂角標示範 | 10 | Plugin Extensibility |
| T12 | `schemaVersion` migration + 測試 | 8 | Schema Extensibility / State ④ |
| T13 | 實測 React DevTools（D12）；`no-restricted-imports` 分層檢查 | 5 | 驗證決策 / 架構約束 |

### P2：不做，列入 README 演進方向

Vercel 部署（最後有空才做）、CI（tsc / vitest / lint）、跨分頁同步（D8 ②）、具名 preset、`preact/compat` 縮小體積、拆 monorepo、Playwright visual regression、圖片輪播、list variant、活動外框角標、config 發佈至 API（取代 localStorage）、評估改用 r2wc。
