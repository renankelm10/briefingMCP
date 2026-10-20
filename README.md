<div align="center">

<img src="docs/images/logo.svg" width="96" alt="Briefing logo">

# Briefing

**Your team's second brain — local Markdown notes, shared peer‑to‑peer, readable by Claude.**

[![CI](https://github.com/renankelm10/briefingMCP/actions/workflows/ci.yml/badge.svg)](https://github.com/renankelm10/briefingMCP/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-e3a43a.svg)](LICENSE)
![Platforms](https://img.shields.io/badge/platforms-Windows%20%7C%20macOS%20%7C%20Linux-555)
![MCP](https://img.shields.io/badge/MCP-Claude%20ready-d97757)

<a href="https://github.com/renankelm10/briefingMCP/releases/latest"><img src="https://img.shields.io/badge/Download-Windows%20%7C%20macOS%20%7C%20Linux-e3a43a?style=for-the-badge&logo=github&logoColor=white" alt="Download" height="40"></a>
<a href="https://github.com/renankelm10/briefingMCP/releases"><img src="https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Frenankelm10%2FbriefingMCP%2Fmain%2Fdocs%2Fdownloads.json&style=for-the-badge" alt="Downloads" height="40"></a>


<!-- langs -->
**English** · [Português](docs/i18n/README.pt-BR.md) · [Español](docs/i18n/README.es.md) · [Français](docs/i18n/README.fr.md) · [Deutsch](docs/i18n/README.de.md) · [Italiano](docs/i18n/README.it.md) · [Nederlands](docs/i18n/README.nl.md) · [Polski](docs/i18n/README.pl.md) · [Русский](docs/i18n/README.ru.md) · [Українська](docs/i18n/README.uk.md) · [Türkçe](docs/i18n/README.tr.md) · [العربية](docs/i18n/README.ar.md) · [हिन्दी](docs/i18n/README.hi.md) · [简体中文](docs/i18n/README.zh-CN.md) · [繁體中文](docs/i18n/README.zh-TW.md) · [日本語](docs/i18n/README.ja.md) · [한국어](docs/i18n/README.ko.md) · [Bahasa Indonesia](docs/i18n/README.id.md) · [Tiếng Việt](docs/i18n/README.vi.md) · [ไทย](docs/i18n/README.th.md)
<!-- /langs -->

<img src="docs/images/01-editor.png" alt="Briefing editor with live preview, tabs and backlinks" width="900">

</div>

---

## What is Briefing?

Briefing is a desktop notes app for teams who want **one shared knowledge base without a cloud service in the middle**.

- 📝 **Write** in plain Markdown files that live in a normal folder on your computer (your "vault").
- 🔄 **Share** a folder with your team: every computer keeps an identical copy, and changes travel **directly between the computers**, end‑to‑end encrypted, within seconds.
- 🧠 **Ask** anything: every note is indexed **on your own machine**, and **Claude** (or any MCP client) can search, read and write your notes through a built‑in MCP server. Optional AI search by meaning runs locally too.

The result: you and a teammate can each work with your own Claude at the same time, on the same company knowledge, and both of you always see the latest version.

> The interface is currently in **Brazilian Portuguese**. Translations are welcome — see [Contributing](CONTRIBUTING.md).

## How it works

<div align="center"><img src="docs/images/architecture.svg" alt="Architecture: two computers syncing directly, each with a local AI index read by Claude through MCP" width="860"></div>

1. **You create a team** and pick a folder. Briefing generates an invite code like `BRF-7Q2M-…`.
2. **Your teammate pastes the code.** Both computers find each other through the public [Hyperswarm](https://github.com/holepunchto/hyperswarm) DHT — used *only* for discovery — and open a direct, Noise‑encrypted connection. Each side proves it knows the code before a single file is exchanged.
3. **Every change is sent immediately**, whether you typed it, your teammate typed it, or a Claude wrote it. Concurrent edits are merged line‑by‑line (like Git); if two people change the same lines, the other version is saved as a *conflict copy*, identical on every computer — nothing is lost.
4. **Each computer indexes the notes locally** (keyword search, plus multilingual embeddings if you turn on search by meaning). Claude queries the index through MCP and gets the most relevant passages in milliseconds.

## Features

<table>
<tr>
<td width="50%"><img src="docs/images/02-reading.png" alt="Reading mode"></td>
<td width="50%"><img src="docs/images/08-teams.png" alt="Team folders"></td>
</tr>
<tr>
<td><b>Writing.</b> Live Preview editor, <code>[[links]]</code> with autocomplete, backlinks, tags, callouts, tasks, tables, embeds, properties, image paste, templates, daily notes.</td>
<td><b>Team folders.</b> Create a team, share the code, and the folder stays identical on every computer. Live presence, merge, conflict copies, history.</td>
</tr>
<tr>
<td><img src="docs/images/04-brain-search.png" alt="Semantic search"></td>
<td><img src="docs/images/05-brain-claude.png" alt="Connect Claude"></td>
</tr>
<tr>
<td><b>Second brain.</b> <kbd>Ctrl</kbd>+<kbd>J</kbd> asks a question in natural language. Keyword search by default; turn on <i>search by meaning</i> in Settings → System for hybrid search with a local AI model (~120 MB download, about 0.5–1 GB of memory while in use).</td>
<td><b>Claude via MCP.</b> One click registers the MCP server in Claude Code. Claude gets <code>search</code>, <code>read_note</code>, <code>write_note</code> and more.</td>
</tr>
<tr>
<td><img src="docs/images/03-graph.png" alt="Graph view"></td>
<td><img src="docs/images/06-tasks.png" alt="Tasks panel"></td>
</tr>
<tr>
<td><b>Graph.</b> See how notes connect, colored by folder. Click a note to read it in a side panel without leaving the graph; follow its links, focus its connections or open it. The ⚙ panel adds filters (tags as nodes, orphans, missing notes), color groups (<code>tag:#client</code>, <code>path:Projects</code>), arrows, sizes and live forces.</td>
<td><b>Tasks & agenda.</b> Every <code>- [ ]</code> in the vault in one panel, plus a calendar of daily notes.</td>
</tr>
</table>

<details>
<summary><b>Full feature list</b></summary>

- Tabs (restored on restart), quick switcher, command palette, full‑text and `#tag` search
- Live Preview: Markdown syntax hides outside the line you are editing; tables, callouts, images and checkboxes render inline
- Hover previews of linked notes, unlinked mentions with one‑click linking
- Renaming or moving a note rewrites every link to it
- Templates with variables (`{{title}}`, `{{date:DD/MM/YYYY}}`, `{{time}}`) and a ready‑made **project brief** template
- Version history per note with restore; deletions go to the system trash
- Export a note to PDF
- Light / dark / system theme, accent color, font size, line width, resizable panels, focus mode
- Works with existing Markdown folders (including Obsidian vaults)

</details>

## Installation

Download the latest build for your system from **[Releases](https://github.com/renankelm10/briefingMCP/releases)**.

| System | File | Notes |
|---|---|---|
| Windows 10/11 | `Briefing-Setup-x.y.z.exe` | Not code‑signed yet: on the SmartScreen warning click **More info → Run anyway**. |
| macOS 12+ (Apple Silicon) | `Briefing-x.y.z-arm64.dmg` | Not notarized yet: right‑click the app → **Open**, or run `xattr -dr com.apple.quarantine /Applications/Briefing.app`. Intel Macs: build from source. |
| Linux (x64) | `Briefing-x.y.z.AppImage` / `.deb` | AppImage: `chmod +x Briefing-*.AppImage`. On Ubuntu 24.04+ prefer the `.deb` (`sudo apt install ./briefing_*.deb`), which configures the Chromium sandbox. |

On first launch Briefing creates an example vault in `Documents/Briefing`. Use **Arquivo → Abrir outro vault…** to open any folder.

**Updates.** From 0.3.1 on, Briefing checks GitHub for new releases. On Windows and with the AppImage it downloads them in the background and installs on the next restart; on macOS and with the `.deb` it shows a notice with the download link. You can turn this off in Settings → System. Closing the window keeps Briefing in the system tray so team sync keeps running; quit from the tray icon.

### Build from source

Requires [Node.js 22+](https://nodejs.org).

```bash
git clone https://github.com/renankelm10/briefingMCP.git
cd briefingMCP
npm install
npm start            # run the app
npm run dist         # build an installer for your current OS (output in release/)
```

## Team folders in 3 steps

1. Open the folder you want to share as your vault, then press <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd> (**Equipes**).
2. **Criar equipe** → the invite code is copied. Send it to your teammate over a private channel.
3. Your teammate opens **Equipes → Entrar numa equipe**, pastes the code and chooses an empty folder. The files arrive as soon as both computers are online.

Briefing must be running on both computers for changes to sync. Anyone with the code becomes a full member — treat it like a password.

## Connect Claude (MCP)

Open **✦ Segundo cérebro → Conectar automaticamente**, or run:

```bash
claude mcp add briefing --scope user -- node "/path/to/briefingMCP/src/mcp/server.mjs"
```

Restart Claude Code. The server exposes your open vault and every team folder:

| Tool | What it does |
|---|---|
| `search` | Keyword search, plus semantic search when enabled in the app; returns the most relevant passages with file and line |
| `read_note` | Full content of a note (by path or just by name) |
| `list_notes` | Notes in a vault or folder, with modification time |
| `recent_changes` | Recently modified notes — including changes that arrived from teammates |
| `write_note` | Create, overwrite or append to a note (synced to the team instantly) |
| `vault_info` | Vaults, number of notes/passages indexed, semantic search status |

Any MCP client that supports stdio servers works the same way. Use `BRIEFING_VAULTS="/a;/b"` to choose vaults explicitly.

## Security & privacy

- No account, no server, no telemetry. Notes are plain files on your disk. The only automatic request is the update check to GitHub (can be turned off).
- Sync connections are end‑to‑end encrypted and authenticated with the invite code; files from the network can never be written outside the shared folder, and executables received from others are never opened by Briefing.
- Search by meaning is **off by default**. When on, embeddings are computed locally; the model (`multilingual-e5-small`, ~120 MB) is downloaded once from Hugging Face and leaves memory after 5 idle minutes.
- MCP responses mark note content as untrusted data to reduce prompt‑injection risk.

Read the full threat model in **[SECURITY.md](SECURITY.md)**. Report vulnerabilities privately.

## Keyboard shortcuts

| Shortcut | Action | Shortcut | Action |
|---|---|---|---|
| <kbd>Ctrl</kbd>+<kbd>O</kbd> | Quick switcher | <kbd>Ctrl</kbd>+<kbd>J</kbd> | Ask the second brain |
| <kbd>Ctrl</kbd>+<kbd>P</kbd> | Command palette | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd> | Team folders |
| <kbd>Ctrl</kbd>+<kbd>N</kbd> | New note | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd> | New project brief |
| <kbd>Ctrl</kbd>+<kbd>E</kbd> | Reading / editing | <kbd>Ctrl</kbd>+<kbd>G</kbd> | Graph |
| <kbd>Ctrl</kbd>+<kbd>T</kbd> / <kbd>W</kbd> | New / close tab | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd> | Daily note |

On macOS use <kbd>⌘</kbd> instead of <kbd>Ctrl</kbd>.

## FAQ

**Is this Obsidian?** No. Briefing is an independent, open‑source project written from scratch. It is compatible with plain Markdown folders, so you can open an existing vault, but it is not affiliated with or endorsed by Obsidian.

**Does it need the internet?** Only to find teammates (the DHT), to check for updates and, if you turn on search by meaning, to download the AI model once. Notes, search and Claude access work offline.

**What happens if two people edit the same note?** Different parts are merged automatically. If the same lines change, both versions are kept: one in the note, the other in a `(conflito de …)` copy next to it.

**Where is my data?** In your vault folder (`.md` files). Briefing's own data lives in `<vault>/.briefing/` (index, history) and in your user config folder (`%APPDATA%\Briefing`, `~/Library/Application Support/Briefing`, `~/.config/Briefing`).

## Roadmap

- Interface translations (i18n)
- Mobile companion
- Optional relay for networks where direct connections are blocked
- Per‑member permissions and team key rotation
- Signed and notarized installers

## Code signing policy

Free code signing provided by [SignPath.io](https://about.signpath.io), certificate by [SignPath Foundation](https://signpath.org).

- Windows installers are built from this repository by GitHub Actions ([release.yml](.github/workflows/release.yml)) and signed only from those builds.
- Committers and reviewers: [renankelm10](https://github.com/renankelm10)
- Approvers (each signing request): [renankelm10](https://github.com/renankelm10)

**Privacy:** Briefing has no account, server or telemetry. It connects to other systems only for: the Hyperswarm DHT to find teammates of a team folder the user created or joined (file contents travel end‑to‑end encrypted, directly between those teammates), Hugging Face to download the AI model once (only if search by meaning is turned on), and GitHub to check for app updates (can be turned off in Settings). See [SECURITY.md](SECURITY.md).

## Contributing

Issues and pull requests are welcome. See **[CONTRIBUTING.md](CONTRIBUTING.md)** for setup, tests and project layout.

## License

[MIT](LICENSE) © 2026 Renan Kelm
