# Contributing

Thanks for helping! Briefing is a small, dependency-light codebase — you can read all of it in an afternoon.

## Setup

Requirements: **Node.js 22+** and Git. Works on Windows, macOS and Linux.

```bash
git clone https://github.com/renankelm10/briefingMCP.git
cd briefingMCP
npm install
npm start
```

## Tests

```bash
npm run test:fast   # security + two peers syncing on a local DHT (seconds)
npm test            # + RAG with the real embedding model + MCP over stdio (downloads ~120 MB once)
```

To try two app instances on one machine without touching your real data:

```bash
node scripts/dev-testnet.cjs bootstrap.txt          # local DHT, keep it running
BRIEFING_DHT_BOOTSTRAP=$(cat bootstrap.txt) BRIEFING_USER_DATA=/tmp/a BRIEFING_VAULT=/tmp/vault-a npm start
BRIEFING_DHT_BOOTSTRAP=$(cat bootstrap.txt) BRIEFING_USER_DATA=/tmp/b BRIEFING_VAULT=/tmp/vault-b npx electron .
```

## Project layout

| Path | What lives there |
|---|---|
| `src/main/` | Electron main process: window, IPC, file access, teams, AI process host |
| `src/renderer/` | UI (no Node.js): editor, panels, graph, modals |
| `src/core/sync/` | P2P sync engine (pure Node, testable without Electron) |
| `src/core/rag/` | Local "second brain": chunking, BM25, embeddings, index |
| `src/mcp/` | MCP server for Claude Code and other MCP clients |
| `test/` | Node test runner suites |

## Guidelines

- Keep the renderer free of Node.js — new capabilities go through `preload.js` + a validated `ipcMain.handle`.
- Anything received from the network or from another person's notes is untrusted input.
- Code comments are in Portuguese (the original language of the project); English is welcome too.
- The UI is in Brazilian Portuguese today. **Interface translations are a great first contribution.**
- Run `npm run test:fast` before opening a pull request.

## Security issues

See [SECURITY.md](SECURITY.md) — please report privately.
