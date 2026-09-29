# momo Card Showroom

分析 momo 商品卡並建立**可調整、可嵌入**的商品卡系統（Frontend Take Home 題目 B，題目原文見 [`docs/assignment.md`](docs/assignment.md)）。

- **Showroom**：列出所有商品卡、展示單一商品卡，並以調整面板修改卡片呈現，設定持久化於 localStorage
- **嵌入**：任何頁面載入一支 script，即可使用 `<momo-product-card>`（Custom Element + Shadow DOM）
- Showroom 與嵌入頁**渲染同一個 custom element**——預覽所見即嵌入效果

> 本 README 以「此系統的長期維護者」角度撰寫：先說如何跑起來，再說為什麼這樣設計、刻意不做什麼、下一步往哪走。
> 完整決策紀錄：[`docs/decisions.md`](docs/decisions.md)｜AI 協作紀錄：[`docs/ai-collaboration.md`](docs/ai-collaboration.md)｜Agent 工作契約：[`CLAUDE.md`](CLAUDE.md)

---

## 快速開始

### 需求

| 工具 | 版本 | 備註 |
|---|---|---|
| Node.js | **24** 以上 | `package.json` 的 `engines` 已標註 |
| pnpm | 10 以上 | 未安裝：`corepack enable`（Node 內建）或 `npm i -g pnpm` |

### 啟動

```bash
git clone https://github.com/YongChenSu/momo-card-showroom.git
cd momo-card-showroom
pnpm install
pnpm dev
```

開啟終端機顯示的網址（預設 http://localhost:5173 ）：

| 網址 | 內容 |
|---|---|
| `/` | 列表頁：每種卡片 variant × 全部 mock 商品 |
| `/#/cards/grid` | 單卡頁：切換預覽商品 + 調整面板（重新整理後設定保留） |
| `/sample.html` | 嵌入範例：只載入 `embed/momo-cards.js`，以 HTML 屬性宣告卡片 |

> `pnpm dev` 會先打包嵌入用的 `public/embed/momo-cards.js`（約 1 秒）再啟動 dev server。
> Showroom 直接使用原始碼（有 HMR）；`sample.html` 使用打包後的檔案——**修改卡片後若要在 sample 看到，需重新執行 `pnpm build:embed`**。

### 指令

| 指令 | 說明 |
|---|---|
| `pnpm dev` | 打包 embed bundle + 啟動 showroom dev server |
| `pnpm test` | Vitest（`src/core/**/*.test.ts`） |
| `pnpm typecheck` | `tsc -b`（strict、`noUncheckedIndexedAccess`） |
| `pnpm lint` | oxlint |
| `pnpm build` | typecheck → embed bundle → showroom，輸出 `dist/`（含 `sample.html` 與 `embed/momo-cards.js`） |
| `pnpm build:embed` | 只打包 `public/embed/momo-cards.js` |
| `pnpm preview` | 預覽 `dist/` |

`pnpm build` 之後，`dist/sample.html` 也可以**直接雙擊開啟**（`file://`）——嵌入 bundle 是一般 `<script>`（IIFE），不受 ES module 的 CORS 限制。

---

## 嵌入用法

```html
<script src="momo-cards.js" defer></script>

<momo-product-card
  variant="grid"
  product='{"id":"p1","title":"【品牌】商品名稱","imageUrl":"...","url":"...","price":499,
            "badges":[{"type":"mo-points","percent":5},{"type":"ad"}]}'
  config='{"theme":{"priceColor":"#1565c0"},"fields":{"rating":false}}'
></momo-product-card>
```

| 屬性 | 必填 | 說明 |
|---|---|---|
| `variant` | 否 | 卡片類型，預設 `grid`；未知值退回 `grid` 並回報 |
| `product` | 是 | 商品資料 JSON，由元件以 schema 驗證；不合法則不渲染並回報 |
| `config` | 否 | 單張卡片覆寫呈現設定（部分欄位即可），優先於 showroom 儲存的設定 |

JavaScript API：`window.MomoCards.configStore`（`getSnapshot` / `subscribe` / `update` / `reset`），與 showroom 調整面板是同一份 store。完整示範見 [`public/sample.html`](public/sample.html)。

---

## 架構

```
                    ┌──────────────────────── core/（純 TS，無 React）────────────────────────┐
                    │  yup schemas: Product / Badge / CardConfig(schemaVersion)               │
                    │  badge registry（逐筆容錯解析）   config store（subscribe/getSnapshot）   │
                    │  report()（降級事件出口）         config 優先序解析                        │
                    └──────────────▲──────────────────────────────▲───────────────────────────┘
                                   │                              │
                    cards/（React 卡片：variants + 內建 badge plugins + slots）
                                   ▲
                    embed/（Custom Element adapter：<momo-product-card>、Shadow DOM）
                          ▲                                   ▲
              showroom/（React app，渲染 custom element）   sample.html（<script> 載入 bundle）
```

| 層 | 職責 | 可 import |
|---|---|---|
| `src/core/` | schema、config store、badge registry、`report()`、mock 資料 | —（禁止 React） |
| `src/cards/` | React 卡片元件、variant registry、內建角標 | `core` |
| `src/embed/` | `<momo-product-card>` adapter、共用 runtime（store 單例） | `core`、`cards` |
| `src/showroom/` | 列表 / 單卡頁、調整面板（hash router） | `core`、`cards`、`embed`；**卡片一律經 custom element 渲染** |

**資料流**：調整面板 → `configStore.update(variant, patch)` → yup 驗證 → 寫入 localStorage → 通知訂閱者 → 所有同 variant 的卡片重繪。

**Config 優先序**：`config` 屬性 > store 中該 variant 的設定 > schema 預設值。

### 對應題目 Bonus

| Bonus | 實作 |
|---|---|
| **Reusable Card Architecture** | 兩種 variant——`grid`（搜尋結果卡）與 `compact`（首頁「降價好貨」卡）——共用同一份 `Product` 資料與 `CardProps` 契約，只有呈現不同。`cardDefinitions` 為 variant registry：每個 variant 宣告元件、樣式與**實際支援的欄位 / 角標 slot**，showroom 遍歷 registry 而非寫死，調整面板只顯示該 variant 有作用的選項。新增 variant = 一個元件 + 一份 CSS + registry 一筆 |
| **Schema / Plugin Extensibility** | 角標是 plugin：`{ type, slot, schema, view }`，`view` 回傳宣告式 `{ label, color }`，不綁 React。新增角標 = 新增一個定義，卡片本體零修改。`badges` **逐筆容錯**：未註冊或 payload 不合 schema 的角標被跳過並回報，不影響整張卡。`CardConfig` 帶 `schemaVersion` 預留 migration |
| **State Consistency Strategy** | ① 同頁單一 store（面板 / 預覽 / 列表 / 所有嵌入卡）② 跨分頁：未做（見下）③ 明確優先序 ④ 所有邊界（localStorage、attribute、面板輸入）經 yup 驗證，失敗套預設並回報 |

### Observability：不可靜默失敗

所有降級行為集中經 `report(event)`（`src/core/report.ts`），目前輸出 `console.warn`，前綴 `[momo-cards]`，是日後接 Sentry / Rollbar 的單一接入點。事件代碼：

`badge.invalid-shape` · `badge.unknown-type` · `badge.invalid-payload` · `badge.duplicate-type` · `config.invalid-json` · `config.invalid-stored` · `config.unknown-variant` · `config.invalid-update` · `config.invalid-attribute` · `config.persist-failed` · `element.invalid-json` · `element.invalid-product` · `element.unknown-variant`

Mock 資料**刻意**含未註冊角標（`anniversary`）與格式錯誤的角標（`mo-points` 的 `percent: "abc"`），開啟 console 即可看到容錯行為。

---

## 關鍵決策與 Tradeoff

完整理由、捨棄方案與代價見 [`docs/decisions.md`](docs/decisions.md)（D1–D15）。摘要：

| 決策 | 選擇 | 主要代價 |
|---|---|---|
| 卡片技術（D2） | **React**，自寫薄 adapter 包成 Custom Element | 嵌入 bundle 含 React：**272 KB / gzip 85 KB**（實測）；每張卡一個 React root。原本建議 Lit（~5 KB），但選擇「自己能有效審查 agent 產出的技術」 |
| Adapter（D3） | 自寫（評估過 `@r2wc/react-to-web-component`） | 型別轉換自己處理；r2wc 不處理 shadow root 樣式注入 |
| Schema（D5） | **yup**，型別手寫 `type`，schema 標註 `ObjectSchema<T>` 讓編譯器檢查一致 | 型別與 schema 寫兩次；yup 預設會轉型（`"3"`→`3`），轉型不經過 `report()` |
| Store（D9） | 自寫、框架無關（約 100 行），React 端 `useSyncExternalStore` | 需自守規則：snapshot 參照穩定、selector 不產生新物件 |
| 可調整範圍（D7） | 只調「呈現設定」`CardConfig`（per variant），商品內容固定 mock | 無法在 showroom 編輯商品 |
| 預覽方式（D12） | Showroom 也渲染 custom element | 預覽與嵌入同一路徑；React DevTools 可見性待實測 |
| Embed 格式 | **IIFE**（`window.MomoCards`）而非 ES module | Vite 對 ES library build 強制不壓縮空白（364 KB → 272 KB）；IIFE 佔用一個全域名稱、使用端不能 `import` |
| 路由（D11） | React Router **hash** 模式 | 網址帶 `#`；換來本機、靜態託管、直接開檔都不需 rewrite 設定 |
| 測試（D13） | 只測 `core/`（29 個測試）；UI 以瀏覽器實測 | 無 E2E / visual regression |

### 已知限制（事實）

- **localStorage 以 origin 隔離**：真實第三方宿主讀不到 showroom 的設定。本專案中 showroom 與 `sample.html` 同源所以共用；production 應改為「showroom 發佈 config 至 API、卡片從 API 讀取」。
- 主題 CSS 變數目前設在卡片根元素，而非 `CLAUDE.md` 所寫的 host element（效果相同，文件與實作待統一）。

---

## 刻意不做 / 尚未完成

依優先度排程（P0 → P1 → P2），詳見 [`docs/decisions.md`](docs/decisions.md) 的 Task List。

| 項目 | 狀態 | 說明 |
|---|---|---|
| 對外 `registerBadge()` API + sample 自訂角標 | ⏳ P1 | core 的 `registerBadge` 已完成並測試（拒絕重複 type）；尚未經 embed 對外公開 |
| `schemaVersion` migration | ⏳ P1 | 欄位已存在；目前版本不符即視為非法、套預設並回報 |
| React DevTools 實測、分層 lint（`no-restricted-imports`） | ⏳ P1 | 分層目前由 `CLAUDE.md` 規範與 review 把關 |
| 跨分頁同步（`storage` event） | ✗ 刻意延後 | store 架構已預留，約數行可補 |
| E2E / 元件測試 / visual regression | ✗ 刻意不做 | 時間投入 core 測試；UI 以瀏覽器實測 |
| 圖片輪播、list variant、行銷 tile、活動外框 | ✗ 刻意不做 | 以第一張圖 + 圖數點示意 |
| 商品內容編輯、具名 preset | ✗ 刻意不做 | 見 D7、D11 |

## 後續演進方向

1. **Config 發佈至 API**：取代 localStorage，解決跨網域嵌入讀不到設定的問題；加上版本與發佈流程
2. **CI**：GitHub Actions 跑 typecheck / test / lint / build
3. **縮小 bundle**：`preact/compat` alias（預期大幅縮小，待量測）
4. **Visual regression**：Playwright 對 `sample.html` 截圖比對——嵌入卡片的主要風險在視覺
5. **跨分頁同步**（D8 ②）、具名 preset（如「雙 11 版 grid」）
6. **BadgeView 擴充**：`shape?`、`icon?` 等選填欄位，表達 momo 的紅色三角、帶 logo 的角標，而不回到 `ReactNode`
7. **拆 monorepo**：資料夾邊界已按 package 設計（`core` / `cards` / `embed` / `showroom`），可直接搬移
8. **評估 r2wc**：卡片屬性型別變多、轉換邏輯變重時再考慮
9. **部署**：Vercel（`pnpm build` 產出的 `dist/` 為純靜態，hash 路由無需 rewrite）

---

## AI / Agent 協作

本專案與 Claude Code 協作完成。流程與約束：

- **Phase 1**：以「逐題 grilling」方式討論 15 個決策——agent 每題附推薦答案與 tradeoff，由人決定；產出 [`CLAUDE.md`](CLAUDE.md)（agent 工作契約：分層、風格、驗證邊界、git 規則）與 [`docs/decisions.md`](docs/decisions.md)
- **Phase 2**：一次一個 task；agent 回報「做了什麼 / 如何驗證 / 未驗證的假設」→ 人 review → 人 commit
- **Commit**：agent 參與者帶 `Co-Authored-By: Claude` 與 `Claude-Session` trailer；純人工修正不帶
- 人修正 agent 的關鍵轉折（Lit → React、Zod → yup、去除泛型、agent 講太滿時被要求改為待驗證……）與每個 task 的驗證方式，記錄於 [`docs/ai-collaboration.md`](docs/ai-collaboration.md)
