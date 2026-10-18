// Gera as capturas de tela do README (docs/images) a partir do vault de demonstração.
// Uso: node scripts/screenshots.mjs <pasta-temporária>
// Abre o app várias vezes em modo de teste (BRIEFING_SMOKE_SHOT), cada vez num estado diferente.
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import electron from 'electron';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmp = path.resolve(process.argv[2] ?? path.join(root, '.shots'));
const out = path.join(root, 'docs', 'images');
const vault = path.join(tmp, 'Aurora Studio');
const userData = path.join(tmp, 'user');
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
execFileSync(process.execPath, [path.join(root, 'scripts', 'make-demo-vault.mjs'), vault], { stdio: 'inherit' });
execFileSync(process.execPath, [path.join(root, 'build.mjs')], { cwd: root, stdio: 'ignore' });

// Funções disponíveis em cada roteiro (rodam dentro da página do app).
const helpers = `
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const key = (k, o = {}) => window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, ...o }));
const openNote = async (p, newTab = false) => {
	const row = document.querySelector('[data-path="' + p + '"]');
	if (!row) throw new Error('nota não encontrada: ' + p);
	row.dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: newTab }));
	await wait(400);
};
const setMode = async (mode) => {
	const b = document.getElementById('btn-mode');
	if ((mode === 'read') !== (b.textContent === 'Editar')) b.click();
	await wait(300);
};
const brainReady = async () => {
	for (let i = 0; i < 240; i++) {
		const s = await window.briefing.brain.stats();
		if (s.length && s.every((v) => v.chunks && v.embedded === v.chunks)) return;
		await wait(500);
	}
};
`;

const shots = {
	'01-editor': `
		await openNote('Início.md');
		await openNote('Clientes/Padaria Pão Quente.md', true);
		await openNote('Projetos/Campanha de Verão.md', true);
		await setMode('edit');
		document.querySelector('#right .tabs [data-tab=backlinks]').click();
		// desce o cursor para fora do callout (o resto da nota aparece renderizado)
		const content = document.querySelector('.cm-content');
		content.focus();
		for (let i = 0; i < 6; i++) content.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
		await wait(300);
	`,
	'02-reading': `
		await openNote('Início.md');
		await setMode('read');
	`,
	'03-graph': `
		await openNote('Projetos/Campanha de Verão.md');
		await setMode('edit');
		key('g', { ctrlKey: true });
		await wait(3000);
	`,
	'04-brain-search': `
		await brainReady();
		key('j', { ctrlKey: true });
		await wait(300);
		const input = document.querySelector('.modal-input');
		input.value = 'quanto a padaria paga por mês e quando vence?';
		input.dispatchEvent(new Event('input'));
		for (let i = 0; i < 60 && !document.querySelector('.brain-result'); i++) await wait(250);
		await wait(400);
	`,
	'05-brain-claude': `
		await brainReady();
		document.getElementById('btn-brain').click();
		await wait(1200);
		// caminho genérico na imagem (o real depende de onde o projeto foi instalado)
		document.querySelector('.command-box').textContent = 'claude mcp add briefing --scope user -- node "/path/to/briefingMCP/src/mcp/server.mjs"';
	`,
	'06-tasks': `
		await openNote('Projetos/Campanha de Verão.md');
		await setMode('read');
		document.querySelector('#right .tabs [data-tab=tasks]').click();
	`,
	'07-agenda': `
		await openNote('Diário/2026-10-17.md');
		await setMode('edit');
		document.querySelector('#right .tabs [data-tab=calendar]').click();
	`,
};

function run(name, script, extra = {}) {
	return new Promise((resolve) => {
		const env = {
			...process.env,
			BRIEFING_USER_DATA: userData,
			BRIEFING_VAULT: vault,
			BRIEFING_SMOKE_SHOT: path.join(out, `${name}.png`),
			BRIEFING_SMOKE_DELAY: '2500',
			BRIEFING_SMOKE_JS: `(async () => { ${helpers}\n try { ${script} } catch (e) { console.error('ROTEIRO FALHOU: ' + e.message); } })()`,
			...extra,
		};
		const child = spawn(electron, ['.'], { cwd: root, env });
		let log = '';
		child.stdout.on('data', (d) => (log += d));
		child.stderr.on('data', (d) => (log += d));
		child.on('exit', () => {
			const problems = log.split('\n').filter((l) => (process.env.SHOTS_DEBUG ? l.trim() : /ROTEIRO FALHOU|\[smoke\] falhou|\[renderer\]/.test(l)));
			console.log(`${name}: ${fs.existsSync(env.BRIEFING_SMOKE_SHOT) ? 'ok' : 'SEM IMAGEM'}${problems.length ? '\n  ' + problems.join('\n  ') : ''}`);
			resolve();
		});
	});
}

const only = process.env.SHOTS_ONLY; // ex.: SHOTS_ONLY=08 gera só as capturas que começam com 08
for (const [name, script] of Object.entries(shots)) if (!only || name.startsWith(only)) await run(name, script);
if (only && !'08-teams'.startsWith(only)) process.exit(0);

// Equipes: dois apps numa DHT local — "Renan" cria a equipe e "Marina" entra com o código.
{
	const net = spawn(process.execPath, [path.join(root, 'scripts', 'dev-testnet.cjs'), path.join(tmp, 'bootstrap.txt')]);
	while (!fs.existsSync(path.join(tmp, 'bootstrap.txt'))) await new Promise((r) => setTimeout(r, 200));
	const bootstrap = fs.readFileSync(path.join(tmp, 'bootstrap.txt'), 'utf8');
	const codeFile = path.join(vault, '.briefing', 'convite.txt');
	const partnerVault = path.join(tmp, 'Marina');
	fs.mkdirSync(partnerVault, { recursive: true });
	const owner = run(
		'08-teams',
		`
		await window.briefing.teams.setDeviceName('Renan');
		const team = await window.briefing.teams.create({ name: 'Aurora Studio', folder: (await window.briefing.info()).root });
		await window.briefing.write('.briefing/convite.txt', team.code);
		for (let i = 0; i < 180; i++) {
			const t = (await window.briefing.teams.info()).teams[0];
			if (t.peers.length && t.received > 0) break;
			await wait(500);
		}
		console.error('equipe:', JSON.stringify((await window.briefing.teams.info()).teams[0].peers));
		await wait(1500);
		document.getElementById('btn-teams').click();
		await wait(1000);
		// caminhos de exemplo na imagem (os reais são pastas temporárias de teste)
		const example = 'C:\\\\Users\\\\renan\\\\Documents\\\\Aurora Studio';
		document.querySelector('.team-meta div').textContent = 'Pasta: ' + example;
		document.querySelectorAll('.team-form .input.wide')[0].value = example;
		`,
		{ BRIEFING_DHT_BOOTSTRAP: bootstrap },
	);
	while (!fs.existsSync(codeFile)) await new Promise((r) => setTimeout(r, 200));
	const code = fs.readFileSync(codeFile, 'utf8').trim();
	const partner = run(
		'08-teams-partner',
		`
		await window.briefing.teams.setDeviceName('Marina');
		await window.briefing.teams.join({ code: '${code}', folder: (await window.briefing.info()).root });
		for (let i = 0; i < 180 && !(await window.briefing.list()).some((f) => f.path === 'Início.md'); i++) await wait(500);
		console.error('parceira recebeu os arquivos:', (await window.briefing.list()).length);
		await window.briefing.write('Reuniões/Ideias da Marina.md', '# Ideias da Marina\\n\\nVídeo curto mostrando os bastidores da padaria.\\n');
		await wait(20000); // fica online enquanto o outro app tira a captura
		`,
		{ BRIEFING_DHT_BOOTSTRAP: bootstrap, BRIEFING_USER_DATA: path.join(tmp, 'user-marina'), BRIEFING_VAULT: partnerVault, BRIEFING_SMOKE_HIDDEN: '1' },
	);
	await Promise.all([owner, partner]);
	fs.rmSync(path.join(out, '08-teams-partner.png'), { force: true });
	fs.rmSync(codeFile, { force: true });
	net.kill();
}
