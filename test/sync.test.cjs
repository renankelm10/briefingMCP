// Testa a sincronização P2P com dois "PCs" reais (dois motores, duas pastas) numa DHT local.
// Rodar: node --test test/sync.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const createTestnet = require('hyperdht/testnet');
const { SyncEngine } = require('../src/core/sync/engine');
const { createInviteCode, parseInviteCode } = require('../src/core/sync/invite');
const { mergeText, compareVersions } = require('../src/core/sync/merge');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(check, what, timeout = 20_000) {
	const start = Date.now();
	while (Date.now() - start < timeout) {
		try {
			if (await check()) return;
		} catch {
			// ainda não
		}
		await sleep(100);
	}
	throw new Error(`tempo esgotado esperando: ${what}`);
}
const read = (dir, rel) => fs.readFileSync(path.join(dir, ...rel.split('/')), 'utf8');
const write = (dir, rel, text) => {
	fs.mkdirSync(path.dirname(path.join(dir, ...rel.split('/'))), { recursive: true });
	fs.writeFileSync(path.join(dir, ...rel.split('/')), text);
};
const exists = (dir, rel) => fs.existsSync(path.join(dir, ...rel.split('/')));
const tmpDir = (name) => fs.mkdtempSync(path.join(os.tmpdir(), `briefing-${name}-`));

test('código de convite: formato, tolerância a digitação e derivação estável', () => {
	const code = createInviteCode();
	assert.match(code, /^BRF(-[0-9A-Z]{4}){8}$/);
	const a = parseInviteCode(code);
	const b = parseInviteCode(code.toLowerCase().replace(/-/g, ' '));
	assert.strictEqual(a.teamId, b.teamId);
	assert.ok(a.topic.equals(b.topic));
	assert.throws(() => parseInviteCode('BRF-1234'));
});

test('mesclagem de texto e vetores de versão', () => {
	const base = 'a\nb\nc\nd';
	assert.strictEqual(mergeText(base, 'A\nb\nc\nd', 'a\nb\nc\nD'), 'A\nb\nc\nD');
	assert.strictEqual(mergeText(base, 'a\nX\nc\nd', 'a\nY\nc\nd'), null);
	assert.strictEqual(compareVersions({ a: 2 }, { a: 1 }), 'greater');
	assert.strictEqual(compareVersions({ a: 1 }, { b: 1 }), 'concurrent');
	assert.strictEqual(compareVersions({ a: 1, b: 2 }, { b: 2, a: 1 }), 'equal');
});

test('dois PCs sincronizam pela rede P2P', { timeout: 120_000 }, async (t) => {
	const testnet = await createTestnet(3);
	const code = createInviteCode();
	const dirA = tmpDir('renan');
	const dirB = tmpDir('parceiro');
	write(dirA, 'Bem-vindo.md', '# Cesto\n\nNota inicial.\n');
	write(dirA, 'Clientes/Padaria.md', 'linha 1\nlinha 2\nlinha 3\nlinha 4\nlinha 5\n');
	fs.mkdirSync(path.join(dirA, '.git'));
	write(dirA, '.git/config', 'não deve sincronizar');

	const engines = [];
	t.after(async () => {
		for (const e of engines) await e.stop();
		await testnet.destroy();
	});
	const make = (folder, deviceName, extra = {}) => {
		const e = new SyncEngine({ folder, code, deviceName, bootstrap: testnet.bootstrap, ...extra });
		engines.push(e);
		return e;
	};

	const A = make(dirA, 'Renan', { teamName: 'Cesto' });
	await A.start();
	const B = make(dirB, 'Parceiro');
	await B.start();

	await t.test('conecta, autentica e recebe o nome da equipe', async () => {
		await waitFor(() => A.status().peers.length === 1 && B.status().peers.length === 1, 'conexão');
		assert.strictEqual(B.teamName, 'Cesto');
		assert.strictEqual(A.status().peers[0].name, 'Parceiro');
	});

	await t.test('sincronização inicial copia o vault, mas não pastas ocultas', async () => {
		await waitFor(() => exists(dirB, 'Clientes/Padaria.md'), 'cópia inicial');
		assert.strictEqual(read(dirB, 'Bem-vindo.md'), read(dirA, 'Bem-vindo.md'));
		assert.ok(!exists(dirB, '.git/config'));
	});

	await t.test('arquivo novo e edição viajam na hora (nos dois sentidos)', async () => {
		write(dirA, 'Reunião.md', 'pauta do dia');
		await waitFor(() => exists(dirB, 'Reunião.md') && read(dirB, 'Reunião.md') === 'pauta do dia', 'arquivo novo A→B');
		write(dirB, 'Reunião.md', 'pauta do dia\n- decisão do parceiro');
		await waitFor(() => read(dirA, 'Reunião.md').includes('decisão do parceiro'), 'edição B→A');
	});

	await t.test('edições simultâneas em trechos diferentes são mescladas', async () => {
		await waitFor(() => read(dirB, 'Clientes/Padaria.md') === read(dirA, 'Clientes/Padaria.md'), 'base comum');
		await sleep(600); // garante que a base comum foi confirmada (ack)
		await A.stop();
		write(dirA, 'Clientes/Padaria.md', 'LINHA 1 (Renan)\nlinha 2\nlinha 3\nlinha 4\nlinha 5\n');
		write(dirB, 'Clientes/Padaria.md', 'linha 1\nlinha 2\nlinha 3\nlinha 4\nLINHA 5 (parceiro)\n');
		await sleep(700);
		const A2 = make(dirA, 'Renan', { teamName: 'Cesto' });
		await A2.start();
		const expected = 'LINHA 1 (Renan)\nlinha 2\nlinha 3\nlinha 4\nLINHA 5 (parceiro)\n';
		await waitFor(() => read(dirA, 'Clientes/Padaria.md') === expected && read(dirB, 'Clientes/Padaria.md') === expected, 'mescla');
		engines.splice(engines.indexOf(A), 1);
	});

	await t.test('colisão no mesmo trecho gera cópia de conflito idêntica nos dois PCs', async () => {
		const A2 = engines.find((e) => e.folder === path.resolve(dirA));
		await waitFor(() => A2.status().peers.length === 1, 'reconexão');
		await A2.stop();
		write(dirA, 'Bem-vindo.md', '# Cesto\n\nVersão do Renan.\n');
		write(dirB, 'Bem-vindo.md', '# Cesto\n\nVersão do parceiro.\n');
		await sleep(700);
		const A3 = make(dirA, 'Renan', { teamName: 'Cesto' });
		await A3.start();
		engines.splice(engines.indexOf(A2), 1);
		const copies = (dir) => fs.readdirSync(dir).filter((n) => n.startsWith('Bem-vindo (conflito'));
		await waitFor(
			() => copies(dirA).length === 1 && copies(dirB).length === 1 && read(dirA, 'Bem-vindo.md') === read(dirB, 'Bem-vindo.md'),
			'resolução do conflito',
		);
		const both = [read(dirA, 'Bem-vindo.md'), read(dirA, copies(dirA)[0])].join('|');
		assert.ok(both.includes('Versão do Renan') && both.includes('Versão do parceiro'), 'nenhuma versão foi perdida');
		assert.strictEqual(copies(dirA)[0], copies(dirB)[0]);
	});

	await t.test('exclusão é propagada', async () => {
		fs.rmSync(path.join(dirB, 'Reunião.md'));
		await waitFor(() => !exists(dirA, 'Reunião.md'), 'exclusão B→A');
	});

	await t.test('PC sem o código correto é recusado', async () => {
		const intruderDir = tmpDir('intruso');
		// mesmo topic, chave de autenticação diferente: simula alguém que achou o endereço mas não tem o código
		const intruder = make(intruderDir, 'Intruso');
		intruder.invite = { ...intruder.invite, authKey: Buffer.alloc(32, 7) };
		let rejected = 0;
		for (const e of engines) e.on('rejected', () => rejected++);
		await intruder.start();
		await waitFor(() => rejected > 0, 'recusa do intruso');
		await sleep(500);
		assert.strictEqual(fs.readdirSync(intruderDir).filter((n) => !n.startsWith('.')).length, 0, 'intruso não recebeu arquivos');
	});
});
