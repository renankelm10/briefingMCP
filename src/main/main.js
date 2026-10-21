// Briefing — processo principal (Electron).
// Responsável por: janela, protocolo briefing://, acesso ao disco do vault e observação de mudanças.
// O renderer não tem Node: tudo passa pela ponte definida em preload.js.
const { app, BrowserWindow, ipcMain, dialog, shell, Menu, protocol, net, nativeTheme, session, utilityProcess, safeStorage } = require('electron');
const { exec } = require('child_process');
const { TeamManager } = require('./teams');
const background = require('./background');
const { createUpdater } = require('./updater');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const { pathToFileURL } = require('url');
const { WELCOME_NOTES } = require('./welcome');
const { userDataDir, toNfc } = require('../core/paths');

const IS_MAC = process.platform === 'darwin';
const DIST = path.join(__dirname, '..', '..', 'dist');
const ICON = path.join(__dirname, '..', '..', 'build', 'icon.png');
const APP_ORIGIN = 'briefing://app/';
const HISTORY_DIR = ['.briefing', 'historico'];
const SNAPSHOT_INTERVAL = 5 * 60 * 1000;
const SNAPSHOT_KEEP = 40;

// Pasta de dados igual em todos os sistemas (o servidor MCP lê a mesma).
// BRIEFING_USER_DATA / BRIEFING_VAULT: perfil e vault isolados para desenvolvimento e testes.
app.setPath('userData', userDataDir());
const VAULT_OVERRIDE = process.env.BRIEFING_VAULT || null;

// Pastas que a interface pode abrir/compartilhar: só as que o próprio usuário escolheu
// (diálogo do sistema), o vault padrão e as pastas de equipe. Uma nota maliciosa que
// conseguisse rodar código na interface não poderia, assim, expor outras pastas do disco.
const trustedFolders = new Set();
const trust = (dir) => dir && trustedFolders.add(path.resolve(dir).toLowerCase());
const isTrusted = (dir) => !!dir && trustedFolders.has(path.resolve(dir).toLowerCase());

// Arquivos que o sistema executaria ao "abrir". Vindos de um parceiro, nunca são abertos direto.
const EXECUTABLE = /\.(exe|msi|bat|cmd|com|scr|pif|ps1|psm1|vbs|vbe|js|jse|wsf|wsh|hta|cpl|jar|lnk|url|reg|app|command|tool|sh|bash|zsh|desktop|appimage|run|deb|rpm|pkg|dmg|scpt|workflow|action)$/i;

protocol.registerSchemesAsPrivileged([
	{ scheme: 'briefing', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } },
]);

/* ---------- configuração persistente ---------- */

const configPath = () => path.join(app.getPath('userData'), 'briefing.json');
// background: fechar a janela mantém o app na bandeja, sincronizando (padrão: sim)
let config = { lastVault: null, bounds: null, maximized: false, background: true };
let appQuitting = false;
let tray = null;
const APP_ROOT = path.join(__dirname, '..', '..');
const isSmoke = () => !app.isPackaged && !!process.env.BRIEFING_SMOKE_SHOT;

function showWindow() {
	if (!win) return createWindow();
	if (win.isMinimized()) win.restore();
	win.show();
	win.focus();
}

// Atualizações pelas Releases do GitHub (autoUpdate: padrão ligado; dá para desligar nas configurações).
const updater = createUpdater({
	isEnabled: () => config.autoUpdate !== false,
	notify: (title, body, onClick) => background.notify(title, body, onClick),
	onChange: (state) => {
		win?.webContents.send('app:update', state);
		tray?.refresh();
	},
});

function appPrefs() {
	return {
		background: config.background !== false,
		openAtLogin: background.isOpenAtLogin(APP_ROOT),
		autoUpdate: config.autoUpdate !== false,
		semanticSearch: config.semanticSearch === true,
		onboarded: config.onboarded !== false, // false só na primeira abertura: mostra as boas-vindas
		version: app.getVersion(),
		update: updater.state,
	};
}

function setAppPref(key, value) {
	if (key === 'background' || key === 'autoUpdate' || key === 'onboarded') {
		config[key] = !!value;
		saveConfig();
		if (key === 'autoUpdate' && value) updater.check();
	} else if (key === 'semanticSearch') {
		// Lido também pelo servidor MCP (briefing.json): o Claude passa a usar o mesmo modo.
		config.semanticSearch = !!value;
		saveConfig();
		brainProc?.postMessage({ type: 'semantic', on: config.semanticSearch });
	} else if (key === 'openAtLogin') {
		background.setOpenAtLogin(!!value, APP_ROOT);
	}
	tray?.refresh();
	return appPrefs();
}

function loadConfig() {
	try {
		config = { ...config, ...JSON.parse(fs.readFileSync(configPath(), 'utf8')) };
	} catch {
		// primeira execução ou arquivo inválido
	}
}

function saveConfig() {
	try {
		fs.mkdirSync(path.dirname(configPath()), { recursive: true });
		fs.writeFileSync(configPath(), JSON.stringify(config, null, 2));
	} catch (err) {
		console.error('Falha ao salvar configuração', err);
	}
}

/* ---------- vault ---------- */

let win = null;
let vaultRoot = null;
let watcher = null;

function isInside(base, target) {
	const rel = path.relative(base, target);
	return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

function resolveInVault(rel) {
	if (!vaultRoot) throw new Error('Nenhum vault aberto');
	if (typeof rel !== 'string') throw new Error('Caminho inválido');
	const abs = path.resolve(vaultRoot, rel);
	if (!isInside(vaultRoot, abs) || abs === vaultRoot) throw new Error('Caminho fora do vault');
	return abs;
}

const toRel = (abs) => toNfc(path.relative(vaultRoot, abs).split(path.sep).join('/'));

async function listVault() {
	const out = [];
	async function walk(dir) {
		const entries = await fsp.readdir(dir, { withFileTypes: true });
		for (const entry of entries) {
			if (entry.name.startsWith('.') || entry.name.endsWith('.briefing-tmp')) continue; // .briefing, .git, .obsidian, temporários da sincronização
			const abs = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				out.push({ path: toRel(abs), type: 'folder' });
				await walk(abs);
			} else if (entry.isFile()) {
				const st = await fsp.stat(abs);
				out.push({ path: toRel(abs), type: 'file', mtime: st.mtimeMs, size: st.size });
			}
		}
	}
	await walk(vaultRoot);
	return out;
}

function vaultInfo() {
	return vaultRoot ? { root: vaultRoot, name: path.basename(vaultRoot) } : null;
}

function startWatcher() {
	watcher?.close();
	watcher = null;
	if (!vaultRoot) return;
	const pending = new Set();
	let timer = null;
	try {
		watcher = fs.watch(vaultRoot, { recursive: true }, (_event, filename) => {
			if (!filename) return;
			const rel = toNfc(filename.split(path.sep).join('/'));
			if (rel.split('/').some((part) => part.startsWith('.')) || rel.endsWith('.briefing-tmp')) return;
			pending.add(rel);
			clearTimeout(timer);
			timer = setTimeout(() => {
				const paths = [...pending];
				pending.clear();
				win?.webContents.send('vault:changed', paths);
			}, 150);
		});
		watcher.on('error', (err) => console.error('Watcher do vault falhou', err));
	} catch (err) {
		console.error('Não foi possível observar o vault', err);
	}
}

/* ---------- histórico de versões ---------- */

const lastSnapshot = new Map();
const historyDirFor = (rel) => path.join(vaultRoot, ...HISTORY_DIR, ...rel.split('/'));

// Guarda o conteúdo anterior antes de sobrescrever (no máximo uma cópia a cada 5 min por nota).
async function snapshotBeforeWrite(rel, abs, next) {
	if (!/\.md$/i.test(rel)) return;
	const now = Date.now();
	if (now - (lastSnapshot.get(rel) ?? 0) < SNAPSHOT_INTERVAL) return;
	let previous;
	try {
		previous = await fsp.readFile(abs, 'utf8');
	} catch {
		return; // arquivo novo
	}
	if (previous === next || !previous.trim()) return;
	lastSnapshot.set(rel, now);
	const dir = historyDirFor(rel);
	await fsp.mkdir(dir, { recursive: true });
	const stamp = new Date(now).toISOString().replace(/[:.]/g, '-');
	await fsp.writeFile(path.join(dir, `${stamp}.md`), previous, 'utf8');
	const versions = (await fsp.readdir(dir)).filter((n) => n.endsWith('.md')).sort();
	for (const old of versions.slice(0, Math.max(0, versions.length - SNAPSHOT_KEEP))) {
		await fsp.unlink(path.join(dir, old)).catch(() => {});
	}
}

async function listHistory(rel) {
	resolveInVault(rel);
	const dir = historyDirFor(rel);
	let names;
	try {
		names = await fsp.readdir(dir);
	} catch {
		return [];
	}
	const out = [];
	for (const name of names.filter((n) => /^[\w-]+\.md$/.test(n))) {
		const iso = name.replace(/\.md$/, '').replace(/T(\d\d)-(\d\d)-(\d\d)-(\d{3})Z$/, 'T$1:$2:$3.$4Z');
		const st = await fsp.stat(path.join(dir, name));
		out.push({ id: name, time: Date.parse(iso) || st.mtimeMs, size: st.size });
	}
	return out.sort((a, b) => b.time - a.time);
}

async function readHistory(rel, id) {
	resolveInVault(rel);
	if (!/^[\w-]+\.md$/.test(String(id))) throw new Error('Versão inválida');
	return fsp.readFile(path.join(historyDirFor(rel), id), 'utf8');
}

async function openVault(dir) {
	const st = await fsp.stat(dir);
	if (!st.isDirectory()) throw new Error('O caminho escolhido não é uma pasta');
	vaultRoot = dir;
	trust(dir);
	lastSnapshot.clear();
	if (!VAULT_OVERRIDE) {
		config.lastVault = dir;
		saveConfig();
	}
	startWatcher();
	syncBrainFolders();
	return vaultInfo();
}

async function ensureDefaultVault() {
	const dir = path.join(app.getPath('documents'), 'Briefing');
	if (!fs.existsSync(dir)) {
		for (const [rel, content] of Object.entries(WELCOME_NOTES)) {
			const abs = path.join(dir, ...rel.split('/'));
			await fsp.mkdir(path.dirname(abs), { recursive: true });
			await fsp.writeFile(abs, content, 'utf8');
		}
	}
	return dir;
}

/* ---------- IPC (com validação de origem) ---------- */

function assertTrustedSender(event) {
	const url = event.senderFrame?.url ?? '';
	if (!url.startsWith(APP_ORIGIN)) throw new Error('Chamada IPC rejeitada: origem não confiável');
}

function handle(channel, fn) {
	ipcMain.handle(channel, (event, ...args) => {
		assertTrustedSender(event);
		return fn(...args);
	});
}

handle('vault:info', () => vaultInfo());
handle('vault:list', () => listVault());
// Remove o BOM que alguns editores do Windows colocam no início do arquivo.
handle('vault:read', async (rel) => (await fsp.readFile(resolveInVault(rel), 'utf8')).replace(/^﻿/, ''));
handle('vault:read-optional', async (rel) => {
	try {
		return (await fsp.readFile(resolveInVault(rel), 'utf8')).replace(/^﻿/, '');
	} catch (err) {
		if (err.code === 'ENOENT') return null;
		throw err;
	}
});

handle('vault:write', async (rel, content) => {
	const abs = resolveInVault(rel);
	const text = String(content);
	await fsp.mkdir(path.dirname(abs), { recursive: true });
	await snapshotBeforeWrite(rel, abs, text).catch((err) => console.error('Falha no histórico', err));
	await fsp.writeFile(abs, text, 'utf8');
});

handle('vault:write-binary', async (rel, data) => {
	const abs = resolveInVault(rel);
	await fsp.mkdir(path.dirname(abs), { recursive: true });
	await fsp.writeFile(abs, Buffer.from(data instanceof ArrayBuffer ? new Uint8Array(data) : data));
});

handle('history:list', (rel) => listHistory(rel));
handle('history:read', (rel, id) => readHistory(rel, id));

handle('theme:set', (theme) => {
	nativeTheme.themeSource = ['light', 'dark'].includes(theme) ? theme : 'system';
});

handle('vault:show-in-folder', (rel) => shell.showItemInFolder(resolveInVault(rel)));

handle('export:pdf', async (name) => {
	const res = await dialog.showSaveDialog(win, {
		title: 'Exportar para PDF',
		defaultPath: path.join(app.getPath('documents'), `${String(name).replace(/[\\/:*?"<>|]/g, '')}.pdf`),
		filters: [{ name: 'PDF', extensions: ['pdf'] }],
	});
	if (res.canceled || !res.filePath) return null;
	const pdf = await win.webContents.printToPDF({
		printBackground: true,
		pageSize: 'A4',
		margins: { top: 0.6, bottom: 0.6, left: 0.6, right: 0.6 },
	});
	await fsp.writeFile(res.filePath, pdf);
	shell.openPath(res.filePath);
	return res.filePath;
});

handle('vault:create', async (rel, content = '') => {
	const abs = resolveInVault(rel);
	await fsp.mkdir(path.dirname(abs), { recursive: true });
	await fsp.writeFile(abs, String(content), { encoding: 'utf8', flag: 'wx' });
});

handle('vault:mkdir', (rel) => fsp.mkdir(resolveInVault(rel), { recursive: true }));

handle('vault:rename', async (from, to) => {
	const src = resolveInVault(from);
	const dst = resolveInVault(to);
	await fsp.mkdir(path.dirname(dst), { recursive: true });
	await fsp.rename(src, dst);
});

// Lixeira do sistema; em Linux sem lixeira (sem gio/trash), move para .briefing/lixeira.
handle('vault:trash', async (rel) => {
	const abs = resolveInVault(rel);
	try {
		await shell.trashItem(abs);
	} catch {
		const target = path.join(vaultRoot, '.briefing', 'lixeira', `${Date.now()}-${path.basename(abs)}`);
		await fsp.mkdir(path.dirname(target), { recursive: true });
		await fsp.rename(abs, target);
	}
});

handle('vault:choose', async () => {
	const res = await dialog.showOpenDialog(win, {
		title: 'Escolha a pasta do vault',
		properties: ['openDirectory', 'createDirectory'],
	});
	if (res.canceled || !res.filePaths[0]) return null;
	return openVault(res.filePaths[0]);
});

handle('vault:reveal', () => vaultRoot && shell.openPath(vaultRoot));
// Executáveis (que podem ter vindo de um parceiro) não são abertos: só mostrados na pasta.
handle('vault:open-file', (rel) => {
	const abs = resolveInVault(rel);
	if (EXECUTABLE.test(abs)) {
		shell.showItemInFolder(abs);
		return 'blocked';
	}
	return shell.openPath(abs);
});

handle('shell:open-external', (url) => {
	if (typeof url === 'string' && /^(https?|mailto):/i.test(url)) return shell.openExternal(url);
});

/* ---------- segundo cérebro (RAG) em processo separado ---------- */

let teams = null;
let brainProc = null;
let brainStats = [];
let brainSeq = 0;
const brainRequests = new Map();

function brainFolders() {
	const list = [];
	if (vaultRoot) list.push({ folder: vaultRoot, name: path.basename(vaultRoot) });
	for (const t of teams?.folders() ?? []) list.push(t);
	const seen = new Set();
	return list.filter((f) => {
		const key = path.resolve(f.folder).toLowerCase();
		if (seen.has(key) || !fs.existsSync(f.folder)) return false;
		seen.add(key);
		return true;
	});
}

function syncBrainFolders() {
	brainProc?.postMessage({ type: 'set-folders', folders: brainFolders() });
}

function startBrain() {
	brainProc = utilityProcess.fork(path.join(__dirname, 'brain-host.js'), [], { serviceName: 'Briefing Cérebro' });
	brainProc.on('message', (msg) => {
		if (msg.type === 'result') {
			const done = brainRequests.get(msg.id);
			brainRequests.delete(msg.id);
			done?.(msg);
		} else if (msg.type === 'stats') {
			brainStats = msg.stats;
			win?.webContents.send('brain:stats', brainStats);
		} else if (msg.type === 'progress') {
			win?.webContents.send('brain:progress', msg);
		} else if (msg.type === 'log') {
			console.log('[cérebro]', msg.text);
		}
	});
	brainProc.on('exit', (code) => {
		if (code) console.error('[cérebro] processo encerrou com código', code);
		brainProc = null;
	});
	brainProc.postMessage({ type: 'semantic', on: config.semanticSearch === true });
	syncBrainFolders();
}

handle('brain:search', (query, opts = {}) => {
	if (!brainProc) throw new Error('O cérebro ainda está iniciando');
	return new Promise((resolve, reject) => {
		const id = ++brainSeq;
		const timer = setTimeout(() => {
			if (brainRequests.delete(id)) reject(new Error('A busca demorou demais'));
		}, 120_000);
		brainRequests.set(id, (msg) => {
			clearTimeout(timer);
			if (msg.error) reject(new Error(msg.error));
			else resolve(msg.results);
		});
		brainProc.postMessage({ type: 'search', id, query: String(query), limit: opts.limit ?? 15, folder: opts.folder });
	});
});
handle('brain:stats', () => brainStats);
handle('brain:reindex', () => brainProc?.postMessage({ type: 'reindex' }));

/* ---------- conexão com o Claude Code (MCP) ---------- */

function mcpCommand() {
	if (app.isPackaged) {
		return { command: process.execPath, args: [path.join(process.resourcesPath, 'app', 'src', 'mcp', 'server.mjs')], env: { ELECTRON_RUN_AS_NODE: '1' } };
	}
	return { command: 'node', args: [path.join(__dirname, '..', 'mcp', 'server.mjs')], env: {} };
}

function mcpCli() {
	const c = mcpCommand();
	const env = Object.entries(c.env).map(([k, v]) => ` -e ${k}=${v}`).join('');
	return `claude mcp add briefing --scope user${env} -- "${c.command}" ${c.args.map((a) => `"${a}"`).join(' ')}`;
}

const run = (cmd) =>
	new Promise((resolve) => {
		exec(cmd, { windowsHide: true, timeout: 60_000 }, (err, stdout, stderr) => resolve({ ok: !err, output: `${stdout}${stderr}`.trim() || err?.message || '' }));
	});

handle('claude:mcp-info', () => ({ command: mcpCli(), config: mcpCommand() }));
handle('claude:register', async () => {
	await run('claude mcp remove briefing --scope user');
	const result = await run(mcpCli());
	if (!result.ok && /not recognized|não é reconhecido|ENOENT/i.test(result.output)) {
		result.output = 'O comando "claude" não foi encontrado. Instale o Claude Code ou cole o comando manualmente num terminal.';
	}
	return result;
});

/* ---------- equipes (sincronização P2P) ---------- */

function sendTeams() {
	if (teams) win?.webContents.send('teams:changed', teams.info());
}
let teamsTimer = null;
const sendTeamsSoon = () => {
	clearTimeout(teamsTimer);
	teamsTimer = setTimeout(sendTeams, 150);
};

function parseBootstrap(value) {
	if (!value) return undefined;
	return value.split(',').map((s) => {
		const [host, port] = s.trim().split(':');
		return { host, port: Number(port) };
	});
}

function startTeams() {
	// No Linux sem chaveiro (backend "basic_text"), a cifra não protege nada: não usamos.
	const secure = safeStorage.isEncryptionAvailable() && !(process.platform === 'linux' && safeStorage.getSelectedStorageBackend?.() === 'basic_text');
	teams = new TeamManager({
		dataDir: app.getPath('userData'),
		secretBox: secure
			? {
					encrypt: (text) => safeStorage.encryptString(text).toString('base64'),
					decrypt: (b64) => safeStorage.decryptString(Buffer.from(b64, 'base64')),
				}
			: null,
		trash: (abs) => shell.trashItem(abs),
		bootstrap: parseBootstrap(process.env.BRIEFING_DHT_BOOTSTRAP),
		log: (...args) => console.log(...args),
	});
	for (const f of teams.folders()) trust(f.folder);
	teams.on('changed', sendTeamsSoon);
	teams.on('event', (event) => {
		win?.webContents.send('teams:event', event);
		// Com o app escondido na bandeja, avisos importantes viram notificação do sistema.
		const away = !win || !win.isVisible() || !win.isFocused();
		if (away && (event.kind === 'conflict' || event.kind === 'rejected')) {
			background.notify(`Briefing · ${event.team}`, event.text, showWindow);
		}
	});
	teams.startAll().then(sendTeams);
}

handle('app:prefs-get', () => appPrefs());
handle('app:prefs-set', (key, value) => setAppPref(String(key), value));
handle('app:update-check', () => updater.check());
handle('app:update-install', () => updater.install());

handle('teams:info', () => teams.info());
const assertTrusted = (dir) => {
	if (!isTrusted(dir)) throw new Error('Escolha a pasta pelo botão "Escolher…" (por segurança, só pastas escolhidas por você podem ser usadas)');
};
handle('teams:create', async ({ name, folder }) => {
	const dir = folder || vaultRoot;
	assertTrusted(dir);
	const team = await teams.create({ name, folder: dir });
	syncBrainFolders();
	return team;
});
handle('teams:join', async ({ code, folder, name }) => {
	assertTrusted(folder);
	const team = await teams.join({ code, folder, name });
	syncBrainFolders();
	return team;
});
handle('teams:leave', async (id) => {
	await teams.leave(id);
	syncBrainFolders();
});
handle('teams:pause', (id, paused) => teams.setPaused(id, paused));
handle('teams:device-name', (name) => teams.setDeviceName(name));
handle('teams:choose-folder', async (title) => {
	const res = await dialog.showOpenDialog(win, { title: title || 'Escolha a pasta', properties: ['openDirectory', 'createDirectory'] });
	if (res.canceled) return null;
	trust(res.filePaths[0]);
	return res.filePaths[0];
});
handle('teams:default-join-folder', (name) => {
	const base = path.join(app.getPath('documents'), 'Briefing Equipes');
	const clean = String(name || 'Equipe').replace(/[\\/:*?"<>|]/g, '').trim() || 'Equipe';
	let dir = path.join(base, clean);
	for (let n = 2; fs.existsSync(dir) && fs.readdirSync(dir).length; n++) dir = path.join(base, `${clean} ${n}`);
	trust(dir);
	return dir;
});
handle('vault:open-folder', (dir) => {
	assertTrusted(dir);
	return openVault(dir);
});

// Usado apenas no fechamento da janela para não perder a última edição.
ipcMain.on('vault:write-sync', (event, rel, content) => {
	try {
		assertTrustedSender(event);
		fs.writeFileSync(resolveInVault(rel), String(content), 'utf8');
		event.returnValue = true;
	} catch (err) {
		console.error(err);
		event.returnValue = false;
	}
});

/* ---------- janela ---------- */

function sendCommand(cmd) {
	win?.webContents.send('menu', cmd);
}

function buildMenu() {
	// Os atalhos são tratados no renderer; aqui só aparecem como rótulo.
	const item = (label, cmd, accelerator) => ({
		label,
		accelerator,
		registerAccelerator: false,
		click: () => sendCommand(cmd),
	});
	return Menu.buildFromTemplate([
		// macOS: o primeiro menu é sempre o do app (Sobre, Ocultar, Sair…)
		...(IS_MAC ? [{ role: 'appMenu' }] : []),
		{
			label: 'Arquivo',
			submenu: [
				item('Nova nota', 'new-note', 'CmdOrCtrl+N'),
				item('Novo briefing', 'new-briefing', 'CmdOrCtrl+Shift+B'),
				item('Nova nota a partir de modelo…', 'new-from-template', 'CmdOrCtrl+Shift+N'),
				item('Nota diária', 'daily', 'CmdOrCtrl+Shift+D'),
				item('Nova pasta', 'new-folder'),
				{ type: 'separator' },
				item('Nova aba', 'new-tab', 'CmdOrCtrl+T'),
				item('Fechar aba', 'close-tab', 'CmdOrCtrl+W'),
				{ type: 'separator' },
				item('Exportar nota para PDF…', 'export-pdf'),
				item('Histórico de versões…', 'history'),
				{ type: 'separator' },
				item('Abrir outro vault…', 'open-vault'),
				item('Mostrar vault no Explorer', 'reveal-vault'),
				item('Configurações', 'settings', 'CmdOrCtrl+,'),
				{ type: 'separator' },
				{ role: 'quit', label: 'Sair' },
			],
		},
		{
			label: 'Editar',
			submenu: [
				{ role: 'undo', label: 'Desfazer' },
				{ role: 'redo', label: 'Refazer' },
				{ type: 'separator' },
				{ role: 'cut', label: 'Recortar' },
				{ role: 'copy', label: 'Copiar' },
				{ role: 'paste', label: 'Colar' },
				{ role: 'selectAll', label: 'Selecionar tudo' },
			],
		},
		{
			label: 'Ver',
			submenu: [
				item('Paleta de comandos', 'palette', 'CmdOrCtrl+P'),
				item('Abrir nota rápida', 'quick-open', 'CmdOrCtrl+O'),
				item('Alternar leitura/edição', 'toggle-mode', 'CmdOrCtrl+E'),
				item('Grafo', 'graph', 'CmdOrCtrl+G'),
				item('Buscar no vault', 'search', 'CmdOrCtrl+Shift+F'),
				item('Perguntar ao segundo cérebro', 'brain-search', 'CmdOrCtrl+J'),
				item('Equipes e sincronização', 'teams', 'CmdOrCtrl+Shift+E'),
				item('Segundo cérebro e Claude', 'brain'),
				item('Modo foco', 'focus', 'CmdOrCtrl+Shift+Enter'),
				{ type: 'separator' },
				{ role: 'togglefullscreen', label: 'Tela cheia' },
				{ role: 'resetZoom', label: 'Tamanho real' },
				{ role: 'zoomIn', label: 'Aumentar zoom' },
				{ role: 'zoomOut', label: 'Diminuir zoom' },
				{ type: 'separator' },
				{ role: 'reload', label: 'Recarregar' },
				{ role: 'toggleDevTools', label: 'Ferramentas de desenvolvedor' },
			],
		},
		{
			label: 'Ajuda',
			submenu: [
				item('Comece aqui', 'getting-started'),
				item('Tour pela tela', 'tour'),
				item('Assistente de boas-vindas…', 'welcome'),
				{ type: 'separator' },
				item('Atalhos do teclado', 'shortcuts'),
				item('Site do projeto', 'project-site'),
			],
		},
	]);
}

const startHidden = background.startedHidden();

function createWindow() {
	win = new BrowserWindow({
		width: config.bounds?.width ?? 1280,
		height: config.bounds?.height ?? 820,
		x: config.bounds?.x,
		y: config.bounds?.y,
		minWidth: 640,
		minHeight: 420,
		title: 'Briefing',
		backgroundColor: nativeTheme.shouldUseDarkColors ? '#1a1b1f' : '#ffffff',
		icon: fs.existsSync(ICON) ? ICON : undefined,
		show: false,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: true,
			spellcheck: true,
		},
	});
	if (config.maximized) win.maximize();

	win.webContents.setWindowOpenHandler(({ url }) => {
		if (/^https?:/i.test(url)) shell.openExternal(url);
		return { action: 'deny' };
	});
	win.webContents.on('will-navigate', (event, url) => {
		if (!url.startsWith(APP_ORIGIN)) event.preventDefault();
	});

	// Encaminha erros do renderer para o terminal (útil em desenvolvimento).
	win.webContents.on('console-message', (event) => {
		if (event.level === 'error' || event.level === 'warning') {
			console.log(`[renderer] ${event.message} (${event.sourceId}:${event.lineNumber})`);
		}
	});
	win.webContents.on('render-process-gone', (_e, details) => console.error('[renderer] processo encerrado', details));

	// BRIEFING_SMOKE_HIDDEN (só em desenvolvimento): segundo app de teste roda sem janela visível
	win.once('ready-to-show', () => {
		if (!app.isPackaged && process.env.BRIEFING_SMOKE_HIDDEN) return;
		if (startHidden) return; // iniciado com o sistema: fica só na bandeja
		win.show();
	});
	win.on('close', (event) => {
		config.maximized = win.isMaximized();
		if (!config.maximized) config.bounds = win.getBounds();
		saveConfig();
		// Fechar só esconde: a equipe continua sincronizando em segundo plano.
		if (!appQuitting && config.background !== false && !isSmoke()) {
			event.preventDefault();
			win.hide();
			if (!config.trayHintShown) {
				config.trayHintShown = true;
				saveConfig();
				background.notify(
					'O Briefing continua sincronizando',
					'Ele fica na bandeja do sistema, perto do relógio. Para sair de vez, use "Sair do Briefing" no menu do ícone.',
					showWindow,
				);
			}
		}
	});
	win.on('closed', () => {
		win = null;
	});

	win.loadURL(APP_ORIGIN + 'index.html');

	// Modo de verificação: BRIEFING_SMOKE_SHOT=<arquivo.png> tira uma captura e encerra.
	// Só em desenvolvimento: no app instalado, variáveis de ambiente não injetam código.
	const shot = !app.isPackaged && process.env.BRIEFING_SMOKE_SHOT;
	if (shot) {
		win.webContents.once('did-finish-load', () => {
			setTimeout(async () => {
				try {
					if (process.env.BRIEFING_SMOKE_JS) {
						await win.webContents.executeJavaScript(process.env.BRIEFING_SMOKE_JS);
						await new Promise((r) => setTimeout(r, 1500));
					}
					const stats = await win.webContents.executeJavaScript(
						`JSON.stringify({ tree: document.querySelectorAll('#tree .tree-item').length, title: document.querySelector('#title')?.value, status: document.querySelector('#status')?.innerText, backlinks: document.querySelectorAll('#panel .bl-item').length })`,
					);
					console.log('[smoke]', stats);
					// janela coberta por outra não é redesenhada: traz para frente antes de capturar
					win.moveTop();
					win.focus();
					win.webContents.invalidate();
					await new Promise((r) => setTimeout(r, 500));
					const img = await win.webContents.capturePage();
					fs.writeFileSync(shot, img.toPNG());
					console.log('[smoke] captura salva em', shot);
				} catch (err) {
					console.error('[smoke] falhou', err);
				}
				app.quit();
			}, Number(process.env.BRIEFING_SMOKE_DELAY ?? 2500));
		});
	}
}

/* ---------- ciclo de vida ---------- */

if (!app.requestSingleInstanceLock()) {
	app.quit();
} else {
	// Abrir o Briefing de novo (atalho, menu Iniciar) mostra a janela que estava na bandeja.
	app.on('second-instance', () => showWindow());

	app.whenReady().then(async () => {
		loadConfig();
		// Primeira abertura: ainda não há vault salvo. Quem já usava o app não vê as boas-vindas.
		// Com BRIEFING_VAULT (testes e capturas de tela) só aparecem se BRIEFING_ONBOARDING=1.
		if (config.onboarded === undefined) {
			config.onboarded = !!config.lastVault || (!!VAULT_OVERRIDE && process.env.BRIEFING_ONBOARDING !== '1');
			saveConfig();
		}
		try {
			// no macOS o corretor é o do sistema e esta chamada não se aplica
			if (!IS_MAC) session.defaultSession.setSpellCheckerLanguages(['pt-BR', 'en-US']);
		} catch (err) {
			console.error('Corretor ortográfico indisponível', err);
		}
		// Nenhuma permissão de hardware (câmera, microfone, localização…); só copiar para a área de transferência.
		const allowed = new Set(['clipboard-sanitized-write']);
		session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => callback(allowed.has(permission)));
		session.defaultSession.setPermissionCheckHandler((_wc, permission) => allowed.has(permission));

		protocol.handle('briefing', async (request) => {
			const url = new URL(request.url);
			let base = null;
			if (url.host === 'app') base = DIST;
			else if (url.host === 'vault' && vaultRoot) base = vaultRoot;
			if (!base) return new Response('Not found', { status: 404 });
			const abs = path.resolve(base, decodeURIComponent(url.pathname).replace(/^\/+/, ''));
			if (!isInside(base, abs)) return new Response('Forbidden', { status: 403 });
			try {
				return await net.fetch(pathToFileURL(abs).toString());
			} catch {
				return new Response('Not found', { status: 404 });
			}
		});

		let dir = VAULT_OVERRIDE ?? (config.lastVault && fs.existsSync(config.lastVault) ? config.lastVault : null);
		if (!dir) dir = await ensureDefaultVault();
		try {
			await openVault(dir);
		} catch (err) {
			console.error('Falha ao abrir vault', dir, err);
		}

		Menu.setApplicationMenu(buildMenu());
		createWindow();
		startTeams();
		startBrain();
		if (!isSmoke()) {
			tray = background.createTray({
				icon: ICON,
				showWindow,
				getTeams: () => teams?.info(),
				setAllPaused: async (paused) => {
					for (const t of teams.info().teams) await teams.setPaused(t.id, paused);
				},
				prefs: appPrefs,
				setPref: setAppPref,
				checkUpdate: () => updater.check(),
				installUpdate: () => updater.install(),
				quit: () => app.quit(),
			});
			teams.on('changed', () => tray?.refresh());
			updater.start();
		}
	});

	// Encerra a sincronização com calma (grava o estado) antes de sair.
	let quitting = false;
	app.on('before-quit', (event) => {
		appQuitting = true;
		if (quitting) return;
		quitting = true;
		event.preventDefault();
		Promise.resolve(teams?.stopAll())
			.catch(() => {})
			.finally(() => {
				brainProc?.kill();
				app.quit();
			});
	});

	// macOS: fechar a janela não encerra o app (a sincronização continua); clicar no Dock reabre.
	app.on('window-all-closed', () => {
		if (IS_MAC) return;
		watcher?.close();
		app.quit();
	});
	app.on('activate', () => {
		if (app.isReady()) showWindow();
	});
}
