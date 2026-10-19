# Security

Briefing moves files between computers and lets an AI assistant read them, so security is a core
part of the design. This document explains the threat model, what is protected, and the known limits.

## Reporting a vulnerability

Please **do not open a public issue** for security problems. Use GitHub's
[private vulnerability reporting](https://github.com/renankelm10/briefingMCP/security/advisories/new)
or e-mail the maintainer. You will get an answer within 7 days.

## Threat model

| Who | Can | Cannot |
|---|---|---|
| Anyone on the internet | See that *some* peers announce a random 32-byte topic on the public DHT, and their IP addresses | Learn the invite code from the topic, connect without the code, read any file |
| Someone with the invite code | Join the team and read/write every file in the shared folder | Write outside the shared folder, execute anything on your PC |
| A teammate's compromised PC / malicious teammate | Change or delete shared files | Escape the folder, plant files outside it, make Briefing open an executable, erase history (overwritten notes are kept in `.briefing/historico`, deletions go to the trash) |
| A note with hostile text (prompt injection) | Ask Claude to do things | — Briefing labels note content as untrusted data in every MCP response; your Claude still decides, so keep tool approvals on |

**The invite code is the key to the team.** Share it only through a private channel. If it leaks,
create a new team and move to it.

## Protections

**Peer-to-peer sync** (`src/core/sync`)
- Peers find each other on the [Hyperswarm](https://github.com/holepunchto/hyperswarm) DHT using a topic
  derived from the invite code (`SHA-256("briefing/topic/v1" ‖ secret)`); the code itself never goes on the network.
- Every connection is end-to-end encrypted (Noise protocol, per-peer keys).
- Before any file is exchanged, each side proves it knows the code with an HMAC bound to *both* public keys of
  that connection (no replay). Peers that fail are disconnected and the user is notified.
- Unauthenticated peers may send at most 64 KB before they are dropped.
- Paths received from the network are validated: relative only, no `..`, no drive letters, no hidden
  folders (`.git`, `.briefing`…), no names that are invalid or special on Windows/macOS/Linux (`CON`, `NUL`, `a:b`…).
- Writes and deletions resolve the real path and refuse to follow symbolic links out of the shared folder;
  symbolic links inside the folder are never shared.
- Every file is verified with SHA-256 after transfer.
- Overwritten text files are snapshotted to `.briefing/historico` first; remote deletions go to the system trash
  (or `.briefing/lixeira` where no trash exists).

**Desktop app** (`src/main`)
- Renderer runs with `contextIsolation`, `sandbox` and no Node.js; it only reaches the system through a small,
  explicit bridge (`preload.js`).
- Every IPC call is checked to come from the app's own page (`briefing://app/`).
- Strict Content-Security-Policy; navigation and new windows are blocked; links open in the system browser.
- All device permissions (camera, microphone, location…) are denied.
- The UI can only open or share folders the user picked in a system dialog.
- Executable files (`.exe`, `.sh`, `.app`, `.desktop`…) are never opened by Briefing — they are revealed in the file manager.
- Markdown is rendered with raw HTML disabled; all dynamic text is escaped.
- Invite codes are stored encrypted with the OS keychain (DPAPI / Keychain / libsecret) when available.
- Electron fuses: `NODE_OPTIONS` and `--inspect` are disabled in packaged builds.

**MCP server** (`src/mcp`)
- Runs locally over stdio; no network port is opened.
- Reads and writes are confined to the configured vaults (resolved real paths, hidden folders excluded).
- Note content is returned with an "untrusted data" notice to reduce prompt-injection risk.

**Local AI**
- Embeddings are computed on your machine. The model (`Xenova/multilingual-e5-small`) is downloaded once from
  Hugging Face; after that, nothing leaves the computer.

**App updates** (`src/main/updater.js`)
- The installed app asks GitHub for the latest **published** release at startup and every 6 hours (drafts and
  pre-releases are ignored). The request carries only the app version in the User-Agent. It can be turned off in
  Settings → System → "Atualizar automaticamente".
- Windows (installer) and Linux (AppImage) download the update in the background and install it on restart, only
  after checking its SHA-512 against `latest.yml` from the same release. macOS and `.deb` only show a notice
  with a link to the release page.
- Updates are as trustworthy as the GitHub release they come from: releases are built only by GitHub Actions
  from tagged commits, and the maintainer publishes each draft manually.

## Known limitations

- Files are stored **unencrypted on disk** (they are your normal Markdown files). Use full-disk encryption.
- The public DHT reveals the IP addresses of online peers to anyone who knows the topic.
- `ELECTRON_RUN_AS_NODE` stays enabled because the packaged MCP server runs through the Briefing executable.
- Windows installers are signed through [SignPath Foundation](https://signpath.org) once the project is
  approved (see [docs/code-signing.md](docs/code-signing.md)); until then, and on macOS, builds are
  unsigned. Always verify the SHA-256 in `SHA256SUMS-*.txt` on the release page.
- Trust model is "everyone with the code is a full member". There are no per-user permissions or member removal
  other than creating a new team.
