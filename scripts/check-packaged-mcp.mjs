// Verifica se o servidor MCP roda a partir do app empacotado (Briefing.exe como Node).
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const exe = path.resolve('release/win-unpacked/Briefing.exe');
const server = path.resolve('release/win-unpacked/resources/app/src/mcp/server.mjs');
const vault = fs.mkdtempSync(path.join(os.tmpdir(), 'pkg-mcp-'));
fs.writeFileSync(path.join(vault, 'Cliente.md'), '# Cliente\n\nA Cesto atende a Padaria Pão Quente desde 2023.\n');

const client = new Client({ name: 'check', version: '1.0.0' });
await client.connect(
	new StdioClientTransport({ command: exe, args: [server], env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', BRIEFING_VAULTS: vault } }),
);
const started = Date.now();
const res = await client.callTool({ name: 'search', arguments: { query: 'desde quando atendemos a padaria?' } });
console.log(`MCP empacotado OK em ${Date.now() - started} ms →`, res.content[0].text.split('\n')[0]);
await client.close();
