<div align="center">

<img src="../images/logo.svg" width="96" alt="Briefing 標誌">

# Briefing

**你團隊的第二大腦——本機 Markdown 筆記，點對點共享，並可由 Claude 讀取。**

[![CI](https://github.com/renankelm10/briefingMCP/actions/workflows/ci.yml/badge.svg)](https://github.com/renankelm10/briefingMCP/actions/workflows/ci.yml)
[![授權: MIT](https://img.shields.io/badge/license-MIT-e3a43a.svg)](../../LICENSE)
![平台](https://img.shields.io/badge/platforms-Windows%20%7C%20macOS%20%7C%20Linux-555)
![MCP](https://img.shields.io/badge/MCP-Claude%20ready-d97757)

<!-- langs -->
[English](../../README.md) · [Português](README.pt-BR.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Italiano](README.it.md) · [Nederlands](README.nl.md) · [Polski](README.pl.md) · [Русский](README.ru.md) · [Українська](README.uk.md) · [Türkçe](README.tr.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [简体中文](README.zh-CN.md) · **繁體中文** · [日本語](README.ja.md) · [한국어](README.ko.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md)
<!-- /langs -->

<img src="../images/01-editor.png" alt="具備即時預覽、分頁與反向連結的 Briefing 編輯器" width="900">

</div>

---

## Briefing 是什麼？

Briefing 是一款桌面筆記應用程式，專為想要**共享知識庫、但中間不經過任何雲端服務**的團隊打造。

- 📝 **書寫**：筆記就是一般的 Markdown 檔案，存放在你電腦上的普通資料夾（你的「保存庫 vault」）中。
- 🔄 **共享**：把資料夾分享給團隊，每台電腦都保有一份完全相同的副本，修改會**在電腦之間直接傳送**，端對端加密，數秒內送達。
- 🧠 **提問**：每則筆記都由**在你自己電腦上執行**的 AI 模型建立索引；**Claude**（或任何 MCP 用戶端）可以透過內建的 MCP 伺服器搜尋、閱讀與寫入你的筆記。

結果就是：你和同事可以同時各自使用自己的 Claude，基於同一份公司知識工作，而且永遠看到最新版本。

> 目前介面語言為**巴西葡萄牙語**。歡迎協助翻譯——請參閱[貢獻指南](../../CONTRIBUTING.md)。

## 運作方式

<div align="center"><img src="../images/architecture.svg" alt="架構：兩台電腦直接同步，每台都有一個由 Claude 透過 MCP 讀取的本機 AI 索引" width="860"></div>

1. **你建立一個團隊**並選擇資料夾。Briefing 會產生類似 `BRF-7Q2M-…` 的邀請碼。
2. **同事貼上邀請碼。** 兩台電腦透過公開的 [Hyperswarm](https://github.com/holepunchto/hyperswarm) DHT 找到彼此（DHT *僅*用於探索），接著建立一條以 Noise 加密的直接連線。在交換任何檔案之前，雙方都必須證明自己知道邀請碼。
3. **每一處修改都會立即傳送**，無論是你、同事還是某個 Claude 寫的。同時發生的編輯會逐行合併（類似 Git）；若兩人修改了同一行，另一個版本會儲存為*衝突副本*，在每台電腦上都完全相同——不會遺失任何內容。
4. **每台電腦都在本機為筆記建立索引**（多語言向量嵌入 + 關鍵字搜尋）。Claude 透過 MCP 查詢索引，幾毫秒內就能取得最相關的段落。

## 功能

<table>
<tr>
<td width="50%"><img src="../images/02-reading.png" alt="閱讀模式"></td>
<td width="50%"><img src="../images/08-teams.png" alt="團隊資料夾"></td>
</tr>
<tr>
<td><b>寫作。</b>即時預覽編輯器、具自動完成的 <code>[[連結]]</code>、反向連結、標籤、標註區塊、待辦、表格、嵌入、屬性、貼上圖片、範本、每日筆記。</td>
<td><b>團隊資料夾。</b>建立團隊、分享邀請碼，資料夾在每台電腦上保持一致。即時上線狀態、合併、衝突副本、歷史紀錄。</td>
</tr>
<tr>
<td><img src="../images/04-brain-search.png" alt="語意搜尋"></td>
<td><img src="../images/05-brain-claude.png" alt="連接 Claude"></td>
</tr>
<tr>
<td><b>第二大腦。</b><kbd>Ctrl</kbd>+<kbd>J</kbd> 以自然語言提問。混合搜尋（語意 + 精確字詞），首次下載模型後完全離線可用。</td>
<td><b>透過 MCP 使用 Claude。</b>一鍵將 MCP 伺服器註冊到 Claude Code。Claude 會取得 <code>search</code>、<code>read_note</code>、<code>write_note</code> 等工具。</td>
</tr>
<tr>
<td><img src="../images/03-graph.png" alt="關係圖"></td>
<td><img src="../images/06-tasks.png" alt="待辦面板"></td>
</tr>
<tr>
<td><b>關係圖。</b>查看筆記之間的連結；局部圖、篩選、拖曳與縮放。</td>
<td><b>待辦與行事曆。</b>保存庫中所有 <code>- [ ]</code> 集中在一個面板，另有每日筆記行事曆。</td>
</tr>
</table>

<details>
<summary><b>完整功能列表</b></summary>

- 分頁（重新啟動後恢復）、快速切換、命令面板、全文搜尋與 `#標籤` 搜尋
- 即時預覽：正在編輯的那一行以外，Markdown 語法會隱藏；表格、標註區塊、圖片與核取方塊直接呈現
- 滑鼠停留預覽連結內容，未連結的提及可一鍵轉為連結
- 重新命名或移動筆記時，所有指向它的連結都會自動更新
- 支援變數的範本（`{{title}}`、`{{date:DD/MM/YYYY}}`、`{{time}}`），以及現成的**專案簡報**範本
- 每則筆記的版本歷史，可還原；刪除的檔案會進入系統資源回收筒
- 將筆記匯出為 PDF
- 淺色 / 深色 / 跟隨系統主題、強調色、字級、行寬、可調整大小的面板、專注模式
- 相容現有的 Markdown 資料夾（包括 Obsidian 保存庫）

</details>

## 安裝

到 **[Releases](https://github.com/renankelm10/briefingMCP/releases)** 下載適合你系統的最新版本。

| 系統 | 檔案 | 說明 |
|---|---|---|
| Windows 10/11 | `Briefing Setup x.y.z.exe` | 尚未進行程式碼簽章：在 SmartScreen 警告中點選 **其他資訊 → 仍要執行**。 |
| macOS 12+（Apple Silicon） | `Briefing-x.y.z-arm64.dmg` | 尚未公證：在應用程式上按右鍵 → **打開**，或執行 `xattr -dr com.apple.quarantine /Applications/Briefing.app`。Intel 晶片的 Mac：請從原始碼建置。 |
| Linux（x64） | `Briefing-x.y.z.AppImage` / `.deb` | AppImage：`chmod +x Briefing-*.AppImage`。在 Ubuntu 24.04+ 上建議使用 `.deb`（`sudo apt install ./briefing_*.deb`），它會設定 Chromium 沙箱。 |

首次啟動時，Briefing 會在 `文件/Briefing` 建立一個範例保存庫。使用 **Arquivo → Abrir outro vault…** 可開啟任何資料夾。

### 從原始碼建置

需要 [Node.js 22+](https://nodejs.org)。

```bash
git clone https://github.com/renankelm10/briefingMCP.git
cd briefingMCP
npm install
npm start            # 執行應用程式
npm run dist         # 為目前系統建置安裝檔（輸出到 release/）
```

## 三個步驟使用團隊資料夾

1. 把要共享的資料夾以保存庫開啟，然後按 <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd>（**Equipes**）。
2. **Criar equipe** → 邀請碼會被複製。透過私密管道傳給同事。
3. 同事開啟 **Equipes → Entrar numa equipe**，貼上邀請碼並選擇一個空資料夾。只要兩台電腦都在線上，檔案就會送達。

兩台電腦都必須執行 Briefing 才能同步。持有邀請碼的人就是正式成員——請像保管密碼一樣保管它。

## 連接 Claude（MCP）

開啟 **✦ Segundo cérebro → Conectar automaticamente**，或執行：

```bash
claude mcp add briefing --scope user -- node "/path/to/briefingMCP/src/mcp/server.mjs"
```

重新啟動 Claude Code。伺服器會提供目前開啟的保存庫與所有團隊資料夾：

| 工具 | 用途 |
|---|---|
| `search` | 語意 + 關鍵字混合搜尋；回傳最相關的段落及其檔案與行號 |
| `read_note` | 筆記的完整內容（依路徑或僅依名稱） |
| `list_notes` | 某個保存庫或資料夾中的筆記與修改時間 |
| `recent_changes` | 最近修改的筆記——包括來自同事的修改 |
| `write_note` | 建立、覆寫或附加筆記（立即同步給團隊） |
| `vault_info` | 保存庫清單、已索引的筆記/段落數量、語意搜尋狀態 |

任何支援 stdio 伺服器的 MCP 用戶端都能以相同方式使用。用 `BRIEFING_VAULTS="/a;/b"` 可明確指定保存庫。

## 安全與隱私

- 不需帳號，沒有伺服器，沒有遙測。筆記就是你磁碟上的一般檔案。
- 同步連線採端對端加密，並以邀請碼驗證；來自網路的檔案絕不會寫到共享資料夾之外，Briefing 也絕不會開啟他人傳來的可執行檔。
- 向量嵌入在本機計算；模型（`multilingual-e5-small`，約 120 MB）只從 Hugging Face 下載一次。
- MCP 的回應會將筆記內容標示為不受信任的資料，以降低提示注入的風險。

完整的威脅模型請閱讀 **[SECURITY.md](../../SECURITY.md)**。請以私下方式回報安全漏洞。

## 鍵盤快速鍵

| 快速鍵 | 動作 | 快速鍵 | 動作 |
|---|---|---|---|
| <kbd>Ctrl</kbd>+<kbd>O</kbd> | 快速切換 | <kbd>Ctrl</kbd>+<kbd>J</kbd> | 詢問第二大腦 |
| <kbd>Ctrl</kbd>+<kbd>P</kbd> | 命令面板 | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd> | 團隊資料夾 |
| <kbd>Ctrl</kbd>+<kbd>N</kbd> | 新增筆記 | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd> | 新增專案簡報 |
| <kbd>Ctrl</kbd>+<kbd>E</kbd> | 閱讀 / 編輯 | <kbd>Ctrl</kbd>+<kbd>G</kbd> | 關係圖 |
| <kbd>Ctrl</kbd>+<kbd>T</kbd> / <kbd>W</kbd> | 新增 / 關閉分頁 | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd> | 每日筆記 |

在 macOS 上以 <kbd>⌘</kbd> 取代 <kbd>Ctrl</kbd>。

## 常見問題

**這是 Obsidian 嗎？** 不是。Briefing 是從零撰寫的獨立開源專案。它相容一般的 Markdown 資料夾，因此你可以開啟既有的保存庫，但它與 Obsidian 沒有隸屬關係，也未獲其背書。

**需要網路嗎？** 只有在尋找同事（DHT）和首次下載 AI 模型時需要。筆記、搜尋與 Claude 存取都能離線使用。

**兩個人同時編輯同一則筆記會怎樣？** 不同部分會自動合併。如果改的是同一行，兩個版本都會保留：一個在筆記中，另一個在旁邊的 `(conflito de …)` 副本裡。

**我的資料在哪裡？** 在你的保存庫資料夾中（`.md` 檔案）。Briefing 本身的資料位於 `<vault>/.briefing/`（索引、歷史）以及使用者設定資料夾（`%APPDATA%\Briefing`、`~/Library/Application Support/Briefing`、`~/.config/Briefing`）。

## 開發藍圖

- 介面翻譯（i18n）
- 行動裝置配套應用程式
- 為封鎖直接連線的網路提供選用中繼
- 依成員設定權限、輪替團隊金鑰
- 已簽章並公證的安裝檔

## 參與貢獻

歡迎提出 issue 與 pull request。環境設定、測試與專案結構請參閱 **[CONTRIBUTING.md](../../CONTRIBUTING.md)**。

## 授權

[MIT](../../LICENSE) © 2026 Renan Kelm
