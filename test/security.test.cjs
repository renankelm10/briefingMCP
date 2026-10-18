// Testes das proteções de segurança da sincronização e do servidor MCP.
// Rodar: node --test test/security.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { SyncEngine, isSafeRemotePath } = require('../src/core/sync/engine');
const { FrameReader, encode } = require('../src/core/sync/framing');
const { createInviteCode } = require('../src/core/sync/invite');

test('caminhos vindos da rede: só os seguros em Windows, macOS e Linux', () => {
	const ok = ['Notas/Cliente.md', 'Reunião 2026.md', 'a/b/c/d.png', 'Projeto (v2)/plano.md'];
	const bad = [
		'../fora.md',
		'a/../../fora.md',
		'/etc/passwd',
		'C:/Windows/system.ini',
		'a\\b.md',
		'.git/config',
		'notas/.briefing/sync/state.json',
		'con.md',
		'Pasta/NUL',
		'lpt1.txt',
		'nota.',
		'nota ',
		'a:b.md',
		'pergunta?.md',
		'tab\there.md',
		'',
		'x'.repeat(300) + '.md',
		'nota.md.briefing-tmp',
	];
	for (const p of ok) assert.ok(isSafeRemotePath(p), `deveria aceitar: ${p}`);
	for (const p of bad) assert.ok(!isSafeRemotePath(p), `deveria recusar: ${JSON.stringify(p).slice(0, 60)}`);
});

test('antes de autenticar, mensagens grandes derrubam a conexão', () => {
	let error = null;
	let received = 0;
	const reader = new FrameReader(
		() => received++,
		(err) => (error = err),
	);
	reader.max = 64 * 1024;
	reader.push(encode({ type: 'hello', pad: 'x'.repeat(1000) }));
	assert.strictEqual(received, 1);
	reader.push(encode({ type: 'file', data: 'x'.repeat(100 * 1024) }));
	assert.ok(error, 'mensagem acima do limite deve ser recusada');
	assert.strictEqual(received, 1);
});

test('link simbólico dentro da pasta não vaza arquivos de fora', async (t) => {
	const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'segredo-'));
	fs.writeFileSync(path.join(outside, 'senha.txt'), 'não pode sair daqui');
	const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'equipe-'));
	fs.writeFileSync(path.join(folder, 'nota.md'), 'ok');
	try {
		fs.symlinkSync(path.join(outside, 'senha.txt'), path.join(folder, 'link-arquivo.md'));
		fs.symlinkSync(outside, path.join(folder, 'link-pasta'), 'junction');
	} catch (err) {
		return t.skip(`sistema não permite criar links simbólicos aqui (${err.code})`);
	}
	const engine = new SyncEngine({ folder, code: createInviteCode(), deviceName: 'teste' });
	await engine.loadState();
	engine.running = true;
	await engine.fullScan();
	await engine.scanPath('link-arquivo.md'); // como se o observador tivesse avisado
	const shared = Object.keys(engine.state.files);
	assert.deepStrictEqual(shared, ['nota.md']);
	// e uma gravação vinda da rede não atravessa o link para fora
	await assert.rejects(() => engine.writeAtomic(path.join(folder, 'link-pasta', 'invasao.md'), 'x'));
	assert.ok(!fs.existsSync(path.join(outside, 'invasao.md')));
});
