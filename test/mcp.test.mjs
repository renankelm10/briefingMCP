// Testa o servidor MCP como o Claude Code o usaria: processo separado via stdio.
// Rodar: node --test test/mcp.test.mjs
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const here = path.dirname(fileURLToPath(import.meta.url));

test('Claude consegue buscar, ler e escrever no vault via MCP', { timeout: 300_000 }, async () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'briefing-mcp-'));
	fs.mkdirSync(path.join(dir, 'Clientes'));
	fs.writeFileSync(path.join(dir, 'Clientes', 'Padaria.md'), '# Padaria\n\nPaga R$ 2.500 por mês, vencimento dia 10. Contato: Maria.\n');
	fs.writeFileSync(path.join(dir, 'Processos.md'), '# Processos\n\nToda campanha começa com uma reunião de kickoff.\n');

	const client = new Client({ name: 'teste', version: '1.0.0' });
	const transport = new StdioClientTransport({
		command: process.execPath,
		args: [path.join(here, '..', 'src', 'mcp', 'server.mjs')],
		env: { ...process.env, BRIEFING_VAULTS: dir },
		stderr: 'pipe',
	});
	await client.connect(transport);
	try {
		const { tools } = await client.listTools();
		assert.deepStrictEqual(tools.map((t) => t.name).sort(), ['list_notes', 'read_note', 'recent_changes', 'search', 'vault_info', 'write_note']);

		const t0 = Date.now();
		const found = await client.callTool({ name: 'search', arguments: { query: 'qual o valor da mensalidade da padaria?' } });
		console.log(`search em ${Date.now() - t0} ms\n${found.content[0].text.slice(0, 300)}`);
		assert.match(found.content[0].text, /Clientes\/Padaria\.md/);

		const note = await client.callTool({ name: 'read_note', arguments: { path: 'Padaria' } });
		assert.match(note.content[0].text, /Maria/);

		await client.callTool({ name: 'write_note', arguments: { path: 'Clientes/Padaria', content: '\n## Atualização\nCliente pediu orçamento de vídeo.', mode: 'append' } });
		assert.match(fs.readFileSync(path.join(dir, 'Clientes', 'Padaria.md'), 'utf8'), /orçamento de vídeo/);

		const after = await client.callTool({ name: 'search', arguments: { query: 'orçamento de vídeo' } });
		assert.match(after.content[0].text, /orçamento de vídeo/);

		const escape = await client.callTool({ name: 'write_note', arguments: { path: '../fora.md', content: 'x' } });
		assert.ok(escape.isError, 'escrever fora do vault deve falhar');

		const info = await client.callTool({ name: 'vault_info', arguments: {} });
		console.log(info.content[0].text);
		assert.match(info.content[0].text, /busca por significado: ativa/);
	} finally {
		await client.close();
	}
});
