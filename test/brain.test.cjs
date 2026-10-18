// Testa o segundo cérebro com o modelo de embeddings real (baixa o modelo na primeira vez).
// Rodar: node --test test/brain.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Brain } = require('../src/core/rag/brain');
const { Embedder } = require('../src/core/rag/embedder');
const { chunkNote } = require('../src/core/rag/chunk');

const write = (dir, rel, text) => {
	const abs = path.join(dir, ...rel.split('/'));
	fs.mkdirSync(path.dirname(abs), { recursive: true });
	fs.writeFileSync(abs, text);
};

test('divide notas em trechos com contexto de título', () => {
	const chunks = chunkNote('Clientes/Padaria Pão Quente.md', `---\nstatus: ativo\n---\n# Visão\n${'Texto longo sobre a padaria. '.repeat(20)}\n## Contato\nFalar com a Maria, telefone 99999.\n`);
	assert.ok(chunks.some((c) => c.heading === 'Propriedades'));
	assert.ok(chunks.some((c) => c.context.startsWith('Padaria Pão Quente › Visão')));
	assert.ok(chunks.every((c) => c.id && c.text));
});

test('busca híbrida encontra por significado e por palavra', { timeout: 600_000 }, async () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'briefing-brain-'));
	write(dir, 'Clientes/Padaria Pão Quente.md', '# Padaria Pão Quente\n\nCliente desde 2023. Contato: Maria Souza, telefone (11) 98888-1234.\n\n## Contrato\nPagamento mensal de R$ 2.500 até o dia 10. Renovação em março.\n');
	write(dir, 'Clientes/Academia Forte.md', '# Academia Forte\n\nGerente: João. Querem campanha de matrículas para o verão com foco em jovens.\n');
	write(dir, 'Processos/Onboarding.md', '# Onboarding de clientes\n\n1. Reunião de kickoff\n2. Coleta de logotipo e paleta de cores\n3. Criação do calendário editorial\n');
	write(dir, 'Financeiro/Impostos.md', '# Impostos\n\nA empresa é optante do Simples Nacional. Guia DAS vence todo dia 20.\n');

	const embedder = new Embedder({ log: (...a) => console.log('[embedder]', ...a) });
	const brain = new Brain({ folder: dir, embedder, log: console.log });
	const started = Date.now();
	await brain.refresh();
	console.log('indexação inicial (inclui download do modelo na 1ª vez):', Date.now() - started, 'ms', brain.stats());
	assert.strictEqual(brain.stats().notes, 4);
	assert.ok(brain.stats().semantic, `embeddings deveriam funcionar: ${brain.stats().error}`);
	assert.strictEqual(brain.stats().embedded, brain.stats().chunks);

	// por significado: nenhuma palavra em comum com "quanto a padaria paga"
	const t0 = Date.now();
	const money = await brain.search('quanto o cliente da padaria paga por mês?');
	console.log('busca semântica em', Date.now() - t0, 'ms →', money[0]?.path, money[0]?.heading);
	assert.strictEqual(money[0].path, 'Clientes/Padaria Pão Quente.md');

	const tax = await brain.search('quando vence o boleto de tributos da empresa');
	assert.strictEqual(tax[0].path, 'Financeiro/Impostos.md');

	// por palavra exata (nome próprio)
	const joao = await brain.search('João');
	assert.strictEqual(joao[0].path, 'Clientes/Academia Forte.md');

	// incremental: só reprocessa o que mudou
	write(dir, 'Clientes/Academia Forte.md', '# Academia Forte\n\nGerente: João. Agora querem também um podcast semanal sobre saúde.\n');
	const changed = await brain.refresh();
	assert.ok(changed);
	const podcast = await brain.search('áudio semanal sobre bem-estar');
	assert.strictEqual(podcast[0].path, 'Clientes/Academia Forte.md');

	// índice persiste e recarrega
	const reloaded = new Brain({ folder: dir, embedder });
	await reloaded.load();
	assert.strictEqual(reloaded.stats().chunks, brain.stats().chunks);
});
