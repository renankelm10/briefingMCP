<div align="center">

<img src="../images/logo.svg" width="96" alt="Briefing 标志">

# Briefing

**你团队的第二大脑——本地 Markdown 笔记，点对点共享，并可被 Claude 读取。**

[![CI](https://github.com/renankelm10/briefingMCP/actions/workflows/ci.yml/badge.svg)](https://github.com/renankelm10/briefingMCP/actions/workflows/ci.yml)
[![许可证: MIT](https://img.shields.io/badge/license-MIT-e3a43a.svg)](../../LICENSE)
![平台](https://img.shields.io/badge/platforms-Windows%20%7C%20macOS%20%7C%20Linux-555)
![MCP](https://img.shields.io/badge/MCP-Claude%20ready-d97757)

<!-- langs -->
[English](../../README.md) · [Português](README.pt-BR.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Italiano](README.it.md) · [Nederlands](README.nl.md) · [Polski](README.pl.md) · [Русский](README.ru.md) · [Українська](README.uk.md) · [Türkçe](README.tr.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · **简体中文** · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md)
<!-- /langs -->

<img src="../images/01-editor.png" alt="带实时预览、标签页和反向链接的 Briefing 编辑器" width="900">

</div>

---

## Briefing 是什么？

Briefing 是一款桌面笔记应用，面向希望拥有**共享知识库、但中间不经过任何云服务**的团队。

- 📝 **书写**：笔记就是普通的 Markdown 文件，存放在你电脑上的一个普通文件夹（你的"仓库 vault"）里。
- 🔄 **共享**：把一个文件夹分享给团队，每台电脑都保存一份完全相同的副本，修改会**在电脑之间直接传输**，端到端加密，几秒内到达。
- 🧠 **提问**：每条笔记都由**在你自己电脑上运行**的 AI 模型建立索引；**Claude**（或任何 MCP 客户端）可以通过内置的 MCP 服务器搜索、读取和写入你的笔记。

结果是：你和同事可以同时各自使用自己的 Claude，基于同一份公司知识工作，并且始终看到最新版本。

> 目前界面语言为**巴西葡萄牙语**。欢迎贡献翻译——参见[贡献指南](../../CONTRIBUTING.md)。

## 工作原理

<div align="center"><img src="../images/architecture.svg" alt="架构：两台电脑直接同步，每台都有一个由 Claude 通过 MCP 读取的本地 AI 索引" width="860"></div>

1. **你创建一个团队**并选择一个文件夹。Briefing 会生成类似 `BRF-7Q2M-…` 的邀请码。
2. **同事粘贴邀请码。** 两台电脑通过公共的 [Hyperswarm](https://github.com/holepunchto/hyperswarm) DHT 找到彼此（DHT *仅*用于发现），然后建立一条使用 Noise 加密的直连通道。在交换任何文件之前，双方都要证明自己知道邀请码。
3. **每一处修改都会立即发送**，无论是你、同事还是某个 Claude 写的。同时发生的编辑会逐行合并（类似 Git）；如果两人改了同一行，另一个版本会保存为*冲突副本*，在每台电脑上都完全相同——不会丢失任何内容。
4. **每台电脑都在本地为笔记建立索引**（多语言向量嵌入 + 关键词搜索）。Claude 通过 MCP 查询索引，几毫秒内就能拿到最相关的段落。

## 功能

<table>
<tr>
<td width="50%"><img src="../images/02-reading.png" alt="阅读模式"></td>
<td width="50%"><img src="../images/08-teams.png" alt="团队文件夹"></td>
</tr>
<tr>
<td><b>写作。</b>实时预览编辑器、带自动补全的 <code>[[链接]]</code>、反向链接、标签、标注块、任务、表格、嵌入、属性、粘贴图片、模板、每日笔记。</td>
<td><b>团队文件夹。</b>创建团队、分享邀请码，文件夹在每台电脑上保持一致。实时在线状态、合并、冲突副本、历史记录。</td>
</tr>
<tr>
<td><img src="../images/04-brain-search.png" alt="语义搜索"></td>
<td><img src="../images/05-brain-claude.png" alt="连接 Claude"></td>
</tr>
<tr>
<td><b>第二大脑。</b><kbd>Ctrl</kbd>+<kbd>J</kbd> 用自然语言提问。混合搜索（语义 + 精确词），首次下载模型后完全离线可用。</td>
<td><b>通过 MCP 使用 Claude。</b>一键把 MCP 服务器注册到 Claude Code。Claude 将获得 <code>search</code>、<code>read_note</code>、<code>write_note</code> 等工具。</td>
</tr>
<tr>
<td><img src="../images/03-graph.png" alt="关系图"></td>
<td><img src="../images/06-tasks.png" alt="任务面板"></td>
</tr>
<tr>
<td><b>关系图。</b>查看笔记之间的联系；局部图、筛选、拖动和缩放。</td>
<td><b>任务与日程。</b>仓库中所有 <code>- [ ]</code> 集中在一个面板，另有每日笔记日历。</td>
</tr>
</table>

<details>
<summary><b>完整功能列表</b></summary>

- 标签页（重启后恢复）、快速切换、命令面板、全文搜索和 `#标签` 搜索
- 实时预览：正在编辑的行之外，Markdown 语法会被隐藏；表格、标注块、图片和复选框直接渲染显示
- 悬停预览链接内容，未链接提及可一键转为链接
- 重命名或移动笔记时，所有指向它的链接都会自动更新
- 带变量的模板（`{{title}}`、`{{date:DD/MM/YYYY}}`、`{{time}}`），以及现成的**项目简报**模板
- 每条笔记的版本历史，可恢复；删除的文件会进入系统回收站
- 将笔记导出为 PDF
- 浅色 / 深色 / 跟随系统主题、强调色、字号、行宽、可调整大小的面板、专注模式
- 兼容现有的 Markdown 文件夹（包括 Obsidian 仓库）

</details>

## 安装

在 **[Releases](https://github.com/renankelm10/briefingMCP/releases)** 页面下载适合你系统的最新版本。

| 系统 | 文件 | 说明 |
|---|---|---|
| Windows 10/11 | `Briefing-Setup-x.y.z.exe` | 尚未进行代码签名：在 SmartScreen 警告中点击 **更多信息 → 仍要运行**。 |
| macOS 12+（Apple Silicon） | `Briefing-x.y.z-arm64.dmg` | 尚未公证：右键点击应用 → **打开**，或运行 `xattr -dr com.apple.quarantine /Applications/Briefing.app`。Intel 芯片的 Mac：请从源码构建。 |
| Linux（x64） | `Briefing-x.y.z.AppImage` / `.deb` | AppImage：`chmod +x Briefing-*.AppImage`。在 Ubuntu 24.04+ 上建议使用 `.deb`（`sudo apt install ./briefing_*.deb`），它会配置 Chromium 沙箱。 |

首次启动时，Briefing 会在 `文档/Briefing` 中创建一个示例仓库。使用 **Arquivo → Abrir outro vault…** 可以打开任意文件夹。

### 从源码构建

需要 [Node.js 22+](https://nodejs.org)。

```bash
git clone https://github.com/renankelm10/briefingMCP.git
cd briefingMCP
npm install
npm start            # 运行应用
npm run dist         # 为当前系统构建安装包（输出到 release/）
```

## 三步使用团队文件夹

1. 把要共享的文件夹作为仓库打开，然后按 <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd>（**Equipes**）。
2. **Criar equipe** → 邀请码会被复制。通过私密渠道发给同事。
3. 同事打开 **Equipes → Entrar numa equipe**，粘贴邀请码并选择一个空文件夹。只要两台电脑都在线，文件就会到达。

两台电脑上都必须运行 Briefing 才能同步。持有邀请码的人即成为正式成员——请像对待密码一样对待它。

## 连接 Claude（MCP）

打开 **✦ Segundo cérebro → Conectar automaticamente**，或运行：

```bash
claude mcp add briefing --scope user -- node "/path/to/briefingMCP/src/mcp/server.mjs"
```

重启 Claude Code。服务器会提供当前打开的仓库和所有团队文件夹：

| 工具 | 作用 |
|---|---|
| `search` | 语义 + 关键词混合搜索；返回最相关的段落及其文件和行号 |
| `read_note` | 笔记的完整内容（按路径或仅按名称） |
| `list_notes` | 某个仓库或文件夹中的笔记及修改时间 |
| `recent_changes` | 最近修改的笔记——包括来自同事的修改 |
| `write_note` | 创建、覆盖或追加笔记（立即同步给团队） |
| `vault_info` | 仓库列表、已索引的笔记/段落数量、语义搜索状态 |

任何支持 stdio 服务器的 MCP 客户端都可以同样使用。用 `BRIEFING_VAULTS="/a;/b"` 可显式指定仓库。

## 安全与隐私

- 无需账号，没有服务器，没有遥测。笔记就是你磁盘上的普通文件。
- 同步连接端到端加密，并通过邀请码认证；来自网络的文件绝不会写到共享文件夹之外，Briefing 也绝不会打开他人发来的可执行文件。
- 向量嵌入在本地计算；模型（`multilingual-e5-small`，约 120 MB）只从 Hugging Face 下载一次。
- MCP 的响应会把笔记内容标记为不受信任的数据，以降低提示注入风险。

完整的威胁模型请阅读 **[SECURITY.md](../../SECURITY.md)**。请私下报告安全漏洞。

## 键盘快捷键

| 快捷键 | 操作 | 快捷键 | 操作 |
|---|---|---|---|
| <kbd>Ctrl</kbd>+<kbd>O</kbd> | 快速切换 | <kbd>Ctrl</kbd>+<kbd>J</kbd> | 询问第二大脑 |
| <kbd>Ctrl</kbd>+<kbd>P</kbd> | 命令面板 | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd> | 团队文件夹 |
| <kbd>Ctrl</kbd>+<kbd>N</kbd> | 新建笔记 | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd> | 新建项目简报 |
| <kbd>Ctrl</kbd>+<kbd>E</kbd> | 阅读 / 编辑 | <kbd>Ctrl</kbd>+<kbd>G</kbd> | 关系图 |
| <kbd>Ctrl</kbd>+<kbd>T</kbd> / <kbd>W</kbd> | 新建 / 关闭标签页 | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd> | 每日笔记 |

在 macOS 上用 <kbd>⌘</kbd> 代替 <kbd>Ctrl</kbd>。

## 常见问题

**这是 Obsidian 吗？** 不是。Briefing 是一个从零编写的独立开源项目。它兼容普通的 Markdown 文件夹，因此你可以打开已有的仓库，但它与 Obsidian 没有隶属关系，也未获其认可。

**需要联网吗？** 只有在寻找同事（DHT）和首次下载 AI 模型时需要。笔记、搜索和 Claude 访问都可以离线使用。

**两个人同时编辑同一条笔记会怎样？** 不同部分会自动合并。如果改的是同一行，两个版本都会保留：一个在笔记中，另一个在旁边的 `(conflito de …)` 副本里。

**我的数据在哪里？** 在你的仓库文件夹里（`.md` 文件）。Briefing 自身的数据位于 `<vault>/.briefing/`（索引、历史）和用户配置目录（`%APPDATA%\Briefing`、`~/Library/Application Support/Briefing`、`~/.config/Briefing`）。

## 路线图

- 界面翻译（i18n）
- 移动端配套应用
- 为阻止直连的网络提供可选中继
- 按成员分配权限、轮换团队密钥
- 签名并公证的安装包

## 参与贡献

欢迎提交 issue 和 pull request。环境搭建、测试和项目结构请参阅 **[CONTRIBUTING.md](../../CONTRIBUTING.md)**。

## 许可证

[MIT](../../LICENSE) © 2026 Renan Kelm
