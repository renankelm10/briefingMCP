// Briefing — interface principal (renderer).
import { createEditor } from './editor.js';
import { createRenderer } from './markdown.js';
import { openGraph } from './graph.js';
import { MetadataIndex } from './metadata.js';
import { splitLink, splitFrontmatter } from './parse.js';
import { BUILTIN_TEMPLATES, applyTemplate } from './templates.js';
import { DEFAULT_SETTINGS, SETTINGS_SCHEMA, SETTINGS_FILE, WORKSPACE_FILE, mergeSettings } from './settings.js';
import { renderCalendar } from './calendar.js';
import {
	debounce,
	el,
	escapeHtml,
	fuzzyScore,
	normalizeText,
	basename,
	dirname,
	noteName,
	isNote,
	IMAGE_EXT,
	formatDate,
	todayStamp,
	countWords,
	sectionOf,
} from './util.js';

const api = window.briefing;
const $ = (s) => document.querySelector(s);

// No macOS, Ctrl dos atalhos é a tecla Command (⌘); os rótulos seguem o padrão do sistema.
const IS_MAC = /Mac/.test(navigator.platform || navigator.userAgent);
const formatHotkey = (hotkey) =>
	IS_MAC ? hotkey.replace(/Ctrl\+/g, '⌘').replace(/Alt\+/g, '⌥').replace(/Shift\+/g, '⇧') : hotkey;
if (IS_MAC) document.body.classList.add('is-mac');

const state = {
	vault: null,
	files: [],
	contents: new Map(), // caminho -> texto (fonte da verdade para notas carregadas)
	dirtyPaths: new Set(), // notas com alterações ainda não gravadas
	saveError: null,
	settings: mergeSettings(null),
	tabs: [],
	active: -1,
	recent: [],
	collapsed: new Set(),
	sideTab: 'backlinks',
	tasksFilter: 'open',
	calMonth: new Date(),
	busy: 0,
	modalCleanup: null,
	selectionWords: 0,
	teamsInfo: null,
	brainStats: [],
	layout:{ left: true, right: true, focus: false, leftWidth: 260, rightWidth: 290 },
};
const index = new MetadataIndex();

/* ---------- indexação em Web Worker ---------- */

const worker = new Worker('indexer.js');
const pendingParses = new Map();
let parseSeq = 0;
worker.onmessage = (e) => {
	const done = pendingParses.get(e.data.id);
	pendingParses.delete(e.data.id);
	done?.(e.data.meta);
};
worker.onerror = (e) => console.error('Erro no indexador:', e.message);
const parse = (text) =>
	new Promise((resolve) => {
		const id = ++parseSeq;
		pendingParses.set(id, resolve);
		worker.postMessage({ id, text });
	});

/* ---------- utilidades de caminho ---------- */

const notes = () => state.files.filter((f) => f.type === 'file' && isNote(f.path));
const exists = (p) => !!p && state.files.some((f) => f.path === p);
const findCI = (p) => state.files.find((f) => f.path.toLowerCase() === p.toLowerCase())?.path ?? null;
const existsCI = (p) => !!findCI(p);
const joinPath = (folder, name) => (folder ? `${folder}/${name}` : name);
const sanitizeName = (s) => s.replace(/[\\/:*?"<>|#^[\]]/g, '').replace(/\s+/g, ' ').trim();
const vaultUrl = (p) => 'briefing://vault/' + p.split('/').map(encodeURIComponent).join('/');
const byName = (a, b) => a.localeCompare(b, 'pt-BR', { numeric: true, sensitivity: 'base' });
const linkFor = (p) => (isNote(p) ? `[[${noteName(p)}]]` : `${IMAGE_EXT.test(p) ? '!' : ''}[[${basename(p)}]]`);

function uniqueNotePath(folder, base) {
	for (let n = 0; ; n++) {
		const p = joinPath(folder, `${n ? `${base} ${n}` : base}.md`);
		if (!existsCI(p)) return p;
	}
}

async function readJson(rel) {
	try {
		const text = await api.readOptional(rel);
		return text == null ? null : JSON.parse(text);
	} catch {
		return null;
	}
}

/* ---------- abas ---------- */

let tabSeq = 0;
const makeTab = (path = null) => ({
	id: ++tabSeq,
	path,
	editorState: null,
	scroll: 0,
	mode: state.settings.defaultMode === 'read' ? 'read' : 'edit',
	history: path ? [path] : [],
	historyPos: path ? 0 : -1,
});
const cur = () => state.tabs[state.active] ?? null;
const currentPath = () => cur()?.path ?? null;

/* ---------- editor e leitura ---------- */

const editor = createEditor($('#editor'), {
	onChange: (text) => onEditorChange(text),
	onSelection: (st) => onSelection(st),
	onOpenLink: (inner, { newTab } = {}) => openLink(inner, currentPath(), { newTab }),
	onOpenUrl: (url) => api.openExternal(url),
	onFile: (file) => saveAttachment(file),
	linkFor,
	getNotes: () => notes().map((f) => ({ name: noteName(f.path), folder: dirname(f.path) })),
	getTags: () => index.tags(),
	getHeadings: (target) => index.headings(index.resolve(target, currentPath())),
	resolveImage: (target) => {
		const p = index.resolve(target, currentPath());
		return p && IMAGE_EXT.test(p) ? vaultUrl(p) : null;
	},
	renderPreview: (inner) => renderPreview(inner),
	renderBlock: (markdown, { properties = false } = {}) => renderMarkdown(markdown, currentPath(), properties ? 0 : 1),
});

const renderMarkdown = createRenderer({
	resolve: (target, from) => index.resolve(target, from),
	fileUrl: vaultUrl,
	getContent: (p) => state.contents.get(p),
	noteName,
});

function renderPreview(inner, from = currentPath()) {
	const { target, subpath } = splitLink(inner);
	const path = index.resolve(target, from);
	if (!path) return null;
	if (IMAGE_EXT.test(path)) return `<img src="${escapeHtml(vaultUrl(path))}" alt="">`;
	if (!isNote(path)) return null;
	let text = state.contents.get(path) ?? '';
	if (subpath) text = sectionOf(text, subpath) ?? text;
	const title = `<div class="hover-title">${escapeHtml(noteName(path))}${subpath ? ' › ' + escapeHtml(subpath) : ''}</div>`;
	return title + (text.trim() ? renderMarkdown(text, path, 1) : '<p class="muted">Nota vazia</p>');
}

/* ---------- configurações e workspace ---------- */

async function loadSettings() {
	state.settings = mergeSettings(await readJson(SETTINGS_FILE));
	applySettings();
}

const saveSettings = debounce(() => {
	api.write(SETTINGS_FILE, JSON.stringify(state.settings, null, 2)).catch((err) => console.error(err));
}, 400);

function applySettings() {
	const s = state.settings;
	const root = document.documentElement.style;
	root.setProperty('--font-size', `${s.fontSize}px`);
	root.setProperty('--line-width', `${s.lineWidth}px`);
	if (s.accent) root.setProperty('--accent', s.accent);
	else root.removeProperty('--accent');
	api.setTheme(s.theme);
	editor.configure({ livePreview: s.livePreview, spellcheck: s.spellcheck });
}

const saveWorkspace = debounce(() => {
	if (!state.vault) return;
	const open = state.tabs.filter((t) => t.path);
	const data = {
		tabs: open.map((t) => ({ path: t.path, mode: t.mode })),
		active: Math.max(0, open.indexOf(cur())),
		recent: state.recent.slice(0, 50),
		layout: state.layout,
		collapsed: [...state.collapsed],
	};
	api.write(WORKSPACE_FILE, JSON.stringify(data, null, 1)).catch(() => {});
}, 800);

function touchRecent(path) {
	state.recent = [path, ...state.recent.filter((p) => p !== path)].slice(0, 50);
}

/* ---------- carregamento ---------- */

async function loadNote(path) {
	const text = await api.read(path);
	state.contents.set(path, text);
	index.set(path, await parse(text));
}

async function refreshFiles() {
	state.files = await api.list();
	index.setFiles(state.files);
	renderTree();
	renderFavorites();
}

async function loadVault() {
	state.vault = await api.info();
	state.tabs = [];
	state.active = -1;
	state.recent = [];
	state.dirtyPaths.clear();
	state.contents.clear();
	index.clear();
	if (!state.vault) return showActiveTab();

	$('#vault-name').textContent = state.vault.name;
	document.title = `${state.vault.name} — Briefing`;
	await loadSettings();
	state.files = await api.list();
	index.setFiles(state.files);
	await Promise.all(notes().map((f) => loadNote(f.path).catch((err) => console.error(f.path, err))));

	const ws = await readJson(WORKSPACE_FILE);
	if (ws) {
		state.recent = (ws.recent ?? []).filter(exists);
		state.collapsed = new Set(ws.collapsed ?? []);
		if (ws.layout) Object.assign(state.layout, ws.layout, { focus: false });
	}
	applyLayout();
	renderTree();
	renderFavorites();

	const saved = (ws?.tabs ?? []).filter((t) => exists(t.path));
	if (saved.length) {
		state.tabs = saved.map((t) => ({ ...makeTab(t.path), mode: t.mode === 'read' ? 'read' : 'edit' }));
		state.active = Math.min(ws.active ?? 0, state.tabs.length - 1);
		showActiveTab();
	} else {
		const start = pickStartNote();
		if (start) await open(start);
		else showActiveTab();
	}
}

function pickStartNote() {
	const list = notes().map((f) => f.path);
	return list.find((p) => /^bem-vindo/i.test(p)) ?? state.recent.find(exists) ?? list.sort(byName)[0] ?? null;
}

/* ---------- exibição da aba ativa ---------- */

function stashActive() {
	const t = cur();
	if (t?.path) {
		t.editorState = editor.getState();
		t.scroll = $('#scroller').scrollTop;
	}
}

function showActiveTab() {
	const t = cur();
	renderTabs();
	const empty = !t?.path;
	$('#doc').hidden = empty;
	$('#empty').hidden = !empty;
	if (empty) {
		renderEmpty();
		updateBreadcrumb();
		highlightTreeActive();
		renderSide();
		updateStatus();
		updateStar();
		saveWorkspace();
		return;
	}
	if (t.editorState) editor.setState(t.editorState);
	else editor.setDoc(state.contents.get(t.path) ?? '');
	$('#title').value = noteName(t.path);
	state.selectionWords = 0;
	updateBreadcrumb();
	applyMode();
	const scroll = t.editorState ? t.scroll : 0;
	$('#scroller').scrollTop = scroll;
	requestAnimationFrame(() => {
		$('#scroller').scrollTop = scroll;
	});
	highlightTreeActive();
	renderSide();
	updateStatus();
	updateStar();
	saveWorkspace();
}

function renderEmpty() {
	const list = $('#empty-recent');
	list.replaceChildren();
	const recent = state.recent.filter(exists).slice(0, 6);
	if (recent.length) list.append(el('div', 'panel-title', 'Abertas recentemente'));
	for (const p of recent) {
		const row = el('div', 'out-link', noteName(p));
		row.onclick = () => open(p);
		list.append(row);
	}
}

function updateBreadcrumb() {
	const p = currentPath();
	const folder = p ? dirname(p) : '';
	$('#breadcrumb').textContent = folder ? folder.split('/').join(' / ') : state.vault?.name ?? '';
}

function renderTabs() {
	const bar = $('#tabbar-tabs');
	bar.replaceChildren();
	state.tabs.forEach((t, i) => {
		const tab = el('div', `tab${i === state.active ? ' active' : ''}`);
		tab.title = t.path ?? 'Nova aba';
		tab.draggable = true;
		const dirty = t.path && state.dirtyPaths.has(t.path);
		const close = el('button', `tab-close${dirty ? ' dirty' : ''}`, dirty ? '●' : '×');
		close.title = 'Fechar (Ctrl+W)';
		close.onclick = (e) => {
			e.stopPropagation();
			closeTab(i);
		};
		tab.append(el('span', 'tab-label', t.path ? noteName(t.path) : 'Nova aba'), close);
		tab.onclick = () => activateTab(i);
		tab.onauxclick = (e) => {
			if (e.button === 1) closeTab(i);
		};
		tab.ondragstart = (e) => e.dataTransfer.setData('text/briefing-tab', String(i));
		tab.ondragover = (e) => {
			if (e.dataTransfer.types.includes('text/briefing-tab')) e.preventDefault();
		};
		tab.ondrop = (e) => {
			const from = e.dataTransfer.getData('text/briefing-tab');
			if (from === '') return;
			e.preventDefault();
			e.stopPropagation();
			moveTab(Number(from), i);
		};
		bar.append(tab);
	});
}

function moveTab(from, to) {
	if (from === to) return;
	const activeTab = cur();
	const [t] = state.tabs.splice(from, 1);
	state.tabs.splice(to, 0, t);
	state.active = state.tabs.indexOf(activeTab);
	renderTabs();
	saveWorkspace();
}

function activateTab(i) {
	if (i === state.active || i < 0 || i >= state.tabs.length) return;
	stashActive();
	state.active = i;
	showActiveTab();
}

async function closeTab(i = state.active) {
	if (i < 0 || i >= state.tabs.length) return;
	await saveAll();
	if (i === state.active) {
		state.tabs.splice(i, 1);
		state.active = Math.min(i, state.tabs.length - 1);
		showActiveTab();
	} else {
		stashActive();
		state.tabs.splice(i, 1);
		if (i < state.active) state.active--;
		renderTabs();
		saveWorkspace();
	}
}

function newTab() {
	stashActive();
	state.tabs.splice(state.active + 1, 0, makeTab());
	state.active++;
	showActiveTab();
	quickSwitcher();
}

function cycleTab(delta) {
	const n = state.tabs.length;
	if (n > 1) activateTab((state.active + delta + n) % n);
}

/* ---------- abrir / navegar ---------- */

async function open(path, { newTab: inNewTab = false, line = null, fromHistory = false } = {}) {
	if (!path || !exists(path)) return;
	if (!isNote(path)) return openAttachment(path);
	if (!state.contents.has(path)) await loadNote(path);
	// Já aberta em outra aba: vai para ela em vez de duplicar.
	const existing = state.tabs.findIndex((tab) => tab.path === path);
	if (!inNewTab && existing >= 0 && existing !== state.active) {
		activateTab(existing);
		touchRecent(path);
		if (line != null) editor.scrollToLine(line);
		return;
	}
	stashActive();
	let t = cur();
	if (inNewTab || !t) {
		t = makeTab();
		state.tabs.splice(state.active + 1, 0, t);
		state.active++;
	}
	if (t.path !== path) {
		t.path = path;
		t.editorState = null;
		t.scroll = 0;
		if (!fromHistory) {
			t.history = t.history.slice(0, t.historyPos + 1);
			t.history.push(path);
			t.historyPos = t.history.length - 1;
		}
	}
	touchRecent(path);
	showActiveTab();
	if (line != null) {
		if (t.mode === 'read') {
			const target = $('#reader').querySelector(`[data-line="${line}"]`);
			if (target) return target.scrollIntoView({ block: 'start' });
			t.mode = 'edit';
			applyMode();
		}
		editor.scrollToLine(line);
	}
}

function openAttachment(path) {
	if (IMAGE_EXT.test(path)) return showImage(path);
	api.openFile(path).then((result) => {
		if (result === 'blocked') updateStatus(`Por segurança, "${basename(path)}" (executável) não é aberto pelo Briefing — ele foi mostrado na pasta.`);
	});
}

async function openLink(inner, from, { newTab: inNewTab = false } = {}) {
	const { target, subpath } = splitLink(inner);
	let path = index.resolve(target, from);
	if (!path) {
		// Link para nota inexistente: cria a nota, como num wiki.
		const name = sanitizeName(basename(target));
		if (!name) return;
		const folder = target.includes('/') ? dirname(target) : state.settings.newNoteFolder.trim();
		path = await createNoteAt(joinPath(folder, `${name}.md`));
		if (!path) return;
	}
	if (!isNote(path)) return openAttachment(path);
	let line = null;
	if (subpath) {
		const wanted = normalizeText(subpath);
		const h = index.headings(path).find((x) => normalizeText(x.text) === wanted);
		if (h) line = h.line;
	}
	await open(path, { line, newTab: inNewTab });
}

function back() {
	const t = cur();
	if (!t) return;
	for (let i = t.historyPos - 1; i >= 0; i--) {
		if (exists(t.history[i])) {
			t.historyPos = i;
			return open(t.history[i], { fromHistory: true });
		}
	}
}

function forward() {
	const t = cur();
	if (!t) return;
	for (let i = t.historyPos + 1; i < t.history.length; i++) {
		if (exists(t.history[i])) {
			t.historyPos = i;
			return open(t.history[i], { fromHistory: true });
		}
	}
}

/* ---------- edição e gravação ---------- */

function onEditorChange(text) {
	const path = currentPath();
	if (!path) return;
	state.contents.set(path, text);
	const wasDirty = state.dirtyPaths.has(path);
	state.dirtyPaths.add(path);
	if (!wasDirty) {
		renderTabs();
		updateStatus();
	}
	scheduleSave();
	scheduleReindex(path);
}

function onSelection(st) {
	let words = 0;
	for (const r of st.selection.ranges) if (!r.empty) words += countWords(st.sliceDoc(r.from, r.to));
	if (words !== state.selectionWords) {
		state.selectionWords = words;
		updateStatus();
	}
}

async function saveAll() {
	scheduleSave.cancel();
	for (const path of [...state.dirtyPaths]) {
		state.dirtyPaths.delete(path);
		const text = state.contents.get(path);
		if (text == null) continue;
		try {
			await api.write(path, text);
			state.saveError = null;
		} catch (err) {
			state.dirtyPaths.add(path);
			state.saveError = err.message;
		}
	}
	renderTabs();
	updateStatus();
}
const scheduleSave = debounce(saveAll, 700);

const reindexQueue = new Set();
const flushReindex = debounce(async () => {
	const paths = [...reindexQueue];
	reindexQueue.clear();
	for (const p of paths) {
		const text = state.contents.get(p);
		if (text == null) continue;
		const meta = await parse(text);
		if (state.contents.get(p) === text) index.set(p, meta);
		else reindexQueue.add(p);
	}
	if (reindexQueue.size) flushReindex();
	renderSide();
	updateStatus();
}, 300);
function scheduleReindex(path) {
	reindexQueue.add(path);
	flushReindex();
}

// Troca o conteúdo de uma nota vindo de fora do editor (tarefas, links, disco, histórico).
async function setNoteContent(path, text, { save = true } = {}) {
	state.contents.set(path, text);
	state.tabs.forEach((t, i) => {
		if (t.path !== path) return;
		if (i === state.active) {
			editor.setDoc(text, { keepSelection: true });
			if (t.mode === 'read') renderReader();
		} else {
			t.editorState = null;
		}
	});
	index.set(path, await parse(text));
	if (save) {
		state.dirtyPaths.add(path);
		await saveAll();
	}
	renderSide();
	updateStatus();
}

function applyMode() {
	const reading = cur()?.mode === 'read';
	$('#editor').hidden = reading;
	$('#reader').hidden = !reading;
	const btn = $('#btn-mode');
	btn.textContent = reading ? 'Editar' : 'Ler';
	btn.classList.toggle('on', reading);
	if (reading) renderReader();
}

function toggleMode() {
	const t = cur();
	if (!t?.path) return;
	t.mode = t.mode === 'edit' ? 'read' : 'edit';
	applyMode();
	saveWorkspace();
	if (t.mode === 'edit') editor.focus();
}

function renderReader() {
	const p = currentPath();
	$('#reader').innerHTML = p ? renderMarkdown(state.contents.get(p) ?? '', p) : '';
}

async function toggleTaskAt(path, line) {
	const text = state.contents.get(path);
	if (text == null) return;
	const lines = text.split('\n');
	const m = /^(\s*(?:[-*+]|\d+[.)])\s+\[)([ xX])\]/.exec(lines[line] ?? '');
	if (!m) return;
	lines[line] = lines[line].slice(0, m[1].length) + (m[2] === ' ' ? 'x' : ' ') + lines[line].slice(m[1].length + 1);
	await setNoteContent(path, lines.join('\n'));
}

/* ---------- criar / renomear / mover / excluir ---------- */

async function createNoteAt(path, content = '') {
	try {
		await api.create(path, content);
	} catch (err) {
		await alertModal(`Não foi possível criar a nota: ${err.message}`);
		return null;
	}
	state.contents.set(path, content);
	index.set(path, await parse(content));
	await refreshFiles();
	return path;
}

async function createNote(folder = state.settings.newNoteFolder.trim(), { newTab: inNewTab = false } = {}) {
	const path = await createNoteAt(uniqueNotePath(folder, 'Sem título'));
	if (!path) return;
	await open(path, { newTab: inNewTab });
	if (cur().mode !== 'edit') {
		cur().mode = 'edit';
		applyMode();
	}
	focusTitle();
}

async function createFolder(parent = '') {
	const name = sanitizeName((await promptModal('Nome da nova pasta', 'Nova pasta')) ?? '');
	if (!name) return;
	const path = joinPath(parent, name);
	if (existsCI(path)) return alertModal(`Já existe "${name}" aqui.`);
	await api.mkdir(path);
	state.collapsed.delete(parent);
	await refreshFiles();
}

async function duplicateNote(path = currentPath()) {
	if (!path) return;
	const copy = await createNoteAt(uniqueNotePath(dirname(path), `${noteName(path)} (cópia)`), state.contents.get(path) ?? '');
	if (copy) await open(copy);
}

function moveNote(path = currentPath()) {
	if (!path) return;
	const folders = ['', ...state.files.filter((f) => f.type === 'folder').map((f) => f.path)];
	openListModal({
		placeholder: `Mover "${basename(path)}" para…`,
		getItems: (q) =>
			folders
				.filter((f) => f !== dirname(path))
				.map((f) => ({ f, s: fuzzyScore(q, f || '/') }))
				.filter((x) => x.s >= 0)
				.sort((a, b) => b.s - a.s)
				.map(({ f }) => ({ label: f || '/ (raiz do vault)', run: () => renamePath(path, joinPath(f, basename(path)), 'file') })),
	});
}

// Reescreve [[links]] em outras notas quando um arquivo muda de nome.
function planLinkRewrites(oldPath, newPath) {
	const rewrites = new Map();
	const newName = isNote(newPath) ? noteName(newPath) : basename(newPath);
	const ambiguous = state.files.some(
		(f) => f.type === 'file' && f.path !== oldPath && (isNote(f.path) ? noteName(f.path) : basename(f.path)).toLowerCase() === newName.toLowerCase(),
	);
	const newTarget = ambiguous ? newPath.replace(/\.md$/i, '') : newName;
	for (const { source } of index.backlinks(oldPath)) {
		const text = state.contents.get(source);
		if (text == null) continue;
		const next = text.replace(
			/(!?\[\[)([^\]\n|#]*)((?:#[^\]\n|]*)?)((?:\|[^\]\n]*)?)\]\]/g,
			(m, openMark, target, sub, alias) =>
				target && index.resolve(target, source) === oldPath ? `${openMark}${newTarget}${sub}${alias}]]` : m,
		);
		if (next !== text) rewrites.set(source, next);
	}
	return rewrites;
}

async function renamePath(oldPath, newPath, type) {
	if (oldPath === newPath) return true;
	if (oldPath.toLowerCase() !== newPath.toLowerCase() && existsCI(newPath)) {
		await alertModal(`Já existe um item chamado "${basename(newPath)}" nesse local.`);
		return false;
	}
	state.busy++;
	try {
		await saveAll();
		const moves =
			type === 'folder'
				? state.files.filter((f) => f.path.startsWith(oldPath + '/')).map((f) => [f.path, newPath + f.path.slice(oldPath.length)])
				: [[oldPath, newPath]];
		const rewrites = type === 'file' && basename(oldPath) !== basename(newPath) ? planLinkRewrites(oldPath, newPath) : new Map();
		try {
			await api.rename(oldPath, newPath);
		} catch (err) {
			await alertModal(`Não foi possível renomear: ${err.message}`);
			return false;
		}
		const moved = new Map(moves);
		const mapPath = (p) => moved.get(p) ?? p;
		for (const [from, to] of moves) {
			if (state.contents.has(from)) {
				state.contents.set(to, state.contents.get(from));
				state.contents.delete(from);
			}
			index.rename(from, to);
		}
		for (const t of state.tabs) {
			t.path = t.path && mapPath(t.path);
			t.history = t.history.map(mapPath);
		}
		state.recent = state.recent.map(mapPath);
		state.settings.favorites = state.settings.favorites.map(mapPath);
		saveSettings();
		if (type === 'folder') {
			state.collapsed = new Set([...state.collapsed].map((p) => (p === oldPath || p.startsWith(oldPath + '/') ? newPath + p.slice(oldPath.length) : p)));
		}
		await refreshFiles();
		for (const [source, text] of rewrites) await setNoteContent(mapPath(source), text);
		if (currentPath()) {
			$('#title').value = noteName(currentPath());
			updateBreadcrumb();
		}
		renderTabs();
		highlightTreeActive();
		renderSide();
		updateStatus(rewrites.size ? `Links atualizados em ${rewrites.size} nota(s)` : null);
		saveWorkspace();
		return true;
	} finally {
		state.busy--;
	}
}

async function renameInteractive(path, type) {
	const current = type === 'folder' || !isNote(path) ? basename(path) : noteName(path);
	const name = sanitizeName((await promptModal('Novo nome', current)) ?? '');
	if (!name || name === current) return;
	await renamePath(path, joinPath(dirname(path), type === 'file' && isNote(path) ? `${name}.md` : name), type);
}

async function commitTitle() {
	const oldPath = currentPath();
	if (!oldPath) return;
	const input = $('#title');
	const name = sanitizeName(input.value);
	if (!name || name === noteName(oldPath)) {
		input.value = noteName(oldPath);
		return;
	}
	const ok = await renamePath(oldPath, joinPath(dirname(oldPath), `${name}.md`), 'file');
	if (!ok && currentPath()) input.value = noteName(currentPath());
}

async function deletePath(path, type) {
	const what = type === 'folder' ? `a pasta "${basename(path)}" e tudo dentro dela` : `"${basename(path)}"`;
	if (state.settings.confirmDelete && !(await confirmModal(`Mover ${what} para a lixeira?`, 'Mover para a lixeira'))) return;
	const affected = (p) => p === path || p.startsWith(path + '/');
	stashActive();
	for (const p of [...state.dirtyPaths]) if (affected(p)) state.dirtyPaths.delete(p);
	try {
		await api.trash(path);
	} catch (err) {
		return alertModal(`Não foi possível excluir: ${err.message}`);
	}
	for (const p of [...state.contents.keys()]) {
		if (affected(p)) {
			state.contents.delete(p);
			index.delete(p);
		}
	}
	state.settings.favorites = state.settings.favorites.filter((p) => !affected(p));
	saveSettings();
	state.recent = state.recent.filter((p) => !affected(p));
	const activeTab = cur();
	state.tabs = state.tabs.filter((t) => !(t.path && affected(t.path)));
	state.active = state.tabs.indexOf(activeTab);
	if (state.active < 0) state.active = state.tabs.length - 1;
	await refreshFiles();
	if (!state.tabs.length) {
		const next = pickStartNote();
		if (next) return open(next);
	}
	showActiveTab();
}

function focusTitle() {
	if (!currentPath()) return;
	const input = $('#title');
	input.focus();
	input.select();
}

function randomNote() {
	const folder = state.settings.templatesFolder.trim().toLowerCase();
	const pool = notes().filter((f) => !folder || !f.path.toLowerCase().startsWith(folder + '/'));
	if (pool.length) open(pool[Math.floor(Math.random() * pool.length)].path);
}

async function copyLink(path = currentPath()) {
	if (!path) return;
	await navigator.clipboard.writeText(linkFor(path));
	updateStatus(`Copiado: ${linkFor(path)}`);
}

/* ---------- anexos ---------- */

const MIME_EXT = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif', 'image/webp': '.webp', 'image/svg+xml': '.svg' };

async function saveAttachment(file) {
	const extMatch = /\.[^.\\/]+$/.exec(file.name || '');
	const ext = (extMatch?.[0] ?? MIME_EXT[file.type] ?? '').toLowerCase();
	const generic = !file.name || /^image\.\w+$/i.test(file.name);
	const base = generic
		? `Colado ${formatDate(new Date(), 'YYYY-MM-DD HHmmss')}`
		: sanitizeName(file.name.slice(0, file.name.length - (extMatch?.[0].length ?? 0))) || 'Anexo';
	const folder = state.settings.attachmentsFolder.trim();
	let path;
	for (let n = 0; ; n++) {
		path = joinPath(folder, `${base}${n ? ` ${n}` : ''}${ext}`);
		if (!existsCI(path)) break;
	}
	try {
		await api.writeBinary(path, await file.arrayBuffer());
	} catch (err) {
		alertModal(`Não foi possível salvar o anexo: ${err.message}`);
		return null;
	}
	await refreshFiles();
	if (isNote(path)) await loadNote(path);
	updateStatus(`Anexo salvo em ${path}`);
	return linkFor(path);
}

/* ---------- modelos, briefings e notas diárias ---------- */

function listTemplates() {
	const folder = state.settings.templatesFolder.trim().toLowerCase();
	const fromVault = folder
		? notes()
				.filter((f) => f.path.toLowerCase().startsWith(folder + '/'))
				.map((f) => ({ name: noteName(f.path), detail: 'modelo do vault', content: () => state.contents.get(f.path) ?? '' }))
		: [];
	const builtins = BUILTIN_TEMPLATES.filter((b) => !fromVault.some((v) => v.name.toLowerCase() === b.name.toLowerCase())).map((b) => ({
		name: b.name,
		detail: 'incluído no Briefing',
		content: () => b.content,
	}));
	return [...fromVault, ...builtins];
}

function pickTemplate(placeholder) {
	return new Promise((resolve) => {
		openListModal({
			placeholder,
			getItems: (q) =>
				listTemplates()
					.map((t) => ({ t, s: fuzzyScore(q, t.name) }))
					.filter((x) => x.s >= 0)
					.sort((a, b) => b.s - a.s)
					.map(({ t }) => ({ label: t.name, detail: t.detail, run: () => resolve(t) })),
			onCancel: () => resolve(null),
		});
	});
}

async function insertTemplate() {
	const p = currentPath();
	if (!p) return;
	const t = await pickTemplate('Inserir modelo na nota…');
	if (!t) return;
	let text = applyTemplate(t.content(), { title: noteName(p) });
	if (/^---\r?\n/.test(state.contents.get(p) ?? '')) text = splitFrontmatter(text).body;
	ensureEditMode();
	editor.insert(text);
}

async function newFromTemplate(preset = null, folder = state.settings.newNoteFolder.trim()) {
	const t = preset ?? (await pickTemplate('Nova nota a partir de modelo…'));
	if (!t) return;
	const name = sanitizeName((await promptModal('Nome da nota', t.name === 'Briefing' ? 'Novo briefing' : t.name)) ?? '');
	if (!name) return;
	const path = uniqueNotePath(folder, name);
	const created = await createNoteAt(path, applyTemplate(t.content(), { title: noteName(path) }));
	if (!created) return;
	await open(created);
	ensureEditMode();
	editor.focus();
}

function newBriefing() {
	const t = listTemplates().find((x) => x.name.toLowerCase() === 'briefing');
	return newFromTemplate(t, state.settings.briefingFolder.trim());
}

const dailyPath = (d) => joinPath(state.settings.dailyFolder.trim(), `${formatDate(d, state.settings.dailyFormat || 'YYYY-MM-DD')}.md`);

async function openDailyNote(date = new Date()) {
	const path = dailyPath(date);
	const found = findCI(path);
	if (found) return open(found);
	const tpl = state.settings.dailyTemplate.trim();
	const tplPath = tpl ? index.resolve(tpl.replace(/\.md$/i, '')) : null;
	const content = tplPath && state.contents.has(tplPath) ? state.contents.get(tplPath) : BUILTIN_TEMPLATES.find((b) => b.name === 'Nota diária').content;
	const created = await createNoteAt(path, applyTemplate(content, { title: noteName(path), date }));
	if (created) await open(created);
}

function ensureEditMode() {
	const t = cur();
	if (t && t.mode !== 'edit') {
		t.mode = 'edit';
		applyMode();
	}
}

/* ---------- explorador de arquivos e favoritos ---------- */

function buildTree() {
	const root = { path: '', folders: new Map(), files: [] };
	const ensure = (parts) => {
		let node = root;
		let acc = '';
		for (const part of parts) {
			acc = acc ? `${acc}/${part}` : part;
			if (!node.folders.has(part)) node.folders.set(part, { name: part, path: acc, folders: new Map(), files: [] });
			node = node.folders.get(part);
		}
		return node;
	};
	for (const f of state.files) {
		const parts = f.path.split('/');
		if (f.type === 'folder') ensure(parts);
		else if (isNote(f.path) || state.settings.showAttachments) ensure(parts.slice(0, -1)).files.push(f);
	}
	return root;
}

function renderFolder(folder, depth) {
	const frag = document.createDocumentFragment();
	for (const sub of [...folder.folders.values()].sort((a, b) => byName(a.name, b.name))) {
		const collapsed = state.collapsed.has(sub.path);
		const row = el('div', `tree-item folder${collapsed ? ' collapsed' : ''}`);
		row.style.paddingLeft = `${8 + depth * 14}px`;
		row.dataset.path = sub.path;
		row.dataset.type = 'folder';
		row.draggable = true;
		const count = sub.files.length + sub.folders.size;
		row.append(el('span', 'chev', '▾'), el('span', 'label', sub.name), el('span', 'count', count ? String(count) : ''));
		frag.append(row);
		if (!collapsed) frag.append(renderFolder(sub, depth + 1));
	}
	const files =
		state.settings.sort === 'modified'
			? folder.files.sort((a, b) => (b.mtime ?? 0) - (a.mtime ?? 0))
			: folder.files.sort((a, b) => byName(a.path, b.path));
	for (const file of files) {
		const note = isNote(file.path);
		const row = el('div', `tree-item file${note ? '' : ' attachment'}`);
		row.style.paddingLeft = `${22 + depth * 14}px`;
		row.dataset.path = file.path;
		row.dataset.type = 'file';
		row.draggable = true;
		if (!note) row.append(el('span', 'file-icon', IMAGE_EXT.test(file.path) ? '▣' : '▢'));
		row.append(el('span', 'label', note ? noteName(file.path) : basename(file.path)));
		frag.append(row);
	}
	return frag;
}

function renderTree() {
	const tree = $('#tree');
	tree.replaceChildren(renderFolder(buildTree(), 0));
	highlightTreeActive();
}

function highlightTreeActive() {
	const p = currentPath();
	for (const row of document.querySelectorAll('#tree .tree-item.file, #favorites-list .tree-item')) {
		row.classList.toggle('active', row.dataset.path === p);
	}
}

function revealInTree(path = currentPath()) {
	if (!path) return;
	const parts = path.split('/');
	for (let i = 1; i < parts.length; i++) state.collapsed.delete(parts.slice(0, i).join('/'));
	setSearch('', false);
	if (!state.layout.left) toggleSidebar('left');
	renderTree();
	$('#tree').querySelector(`[data-path="${CSS.escape(path)}"]`)?.scrollIntoView({ block: 'center' });
}

const isFavorite = (p) => state.settings.favorites.includes(p);

function toggleFavorite(p = currentPath()) {
	if (!p) return;
	const favs = state.settings.favorites;
	state.settings.favorites = isFavorite(p) ? favs.filter((x) => x !== p) : [...favs, p];
	saveSettings();
	renderFavorites();
	updateStar();
}

function renderFavorites() {
	const favs = state.settings.favorites.filter(exists);
	$('#favorites').hidden = !favs.length;
	const list = $('#favorites-list');
	list.replaceChildren();
	for (const p of favs) {
		const row = el('div', 'tree-item file fav');
		row.dataset.path = p;
		row.dataset.type = 'file';
		row.append(el('span', 'star', '★'), el('span', 'label', noteName(p)));
		list.append(row);
	}
	highlightTreeActive();
}

function updateStar() {
	const b = $('#btn-star');
	const p = currentPath();
	b.hidden = !p;
	const on = !!p && isFavorite(p);
	b.textContent = on ? '★' : '☆';
	b.classList.toggle('on', on);
	b.title = on ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
}

function fileMenuItems(path, type) {
	if (type === 'folder') {
		return [
			{ label: 'Nova nota aqui', run: () => createNote(path) },
			{ label: 'Novo briefing aqui', run: () => newFromTemplate(listTemplates().find((t) => t.name === 'Briefing'), path) },
			{ label: 'Nova pasta aqui', run: () => createFolder(path) },
			'-',
			{ label: 'Renomear…', run: () => renameInteractive(path, 'folder') },
			{ label: 'Mostrar no Explorer', run: () => api.showInFolder(path) },
			{ label: 'Excluir', danger: true, run: () => deletePath(path, 'folder') },
		];
	}
	if (!isNote(path)) {
		return [
			{ label: 'Abrir', run: () => openAttachment(path) },
			{ label: 'Copiar link', run: () => copyLink(path) },
			{ label: 'Renomear…', run: () => renameInteractive(path, 'file') },
			{ label: 'Mostrar no Explorer', run: () => api.showInFolder(path) },
			'-',
			{ label: 'Excluir', danger: true, run: () => deletePath(path, 'file') },
		];
	}
	return [
		{ label: 'Abrir em nova aba', run: () => open(path, { newTab: true }) },
		{ label: isFavorite(path) ? 'Remover dos favoritos' : 'Adicionar aos favoritos', run: () => toggleFavorite(path) },
		{ label: 'Copiar link', run: () => copyLink(path) },
		'-',
		{ label: 'Renomear…', run: () => renameInteractive(path, 'file') },
		{ label: 'Duplicar', run: () => duplicateNote(path) },
		{ label: 'Mover para…', run: () => moveNote(path) },
		{ label: 'Histórico de versões', run: () => showHistory(path) },
		{ label: 'Mostrar no Explorer', run: () => api.showInFolder(path) },
		'-',
		{ label: 'Excluir', danger: true, run: () => deletePath(path, 'file') },
	];
}

function setupFileList(container) {
	container.addEventListener('click', (e) => {
		const row = e.target.closest('.tree-item');
		if (!row) return;
		if (row.dataset.type === 'folder') {
			const p = row.dataset.path;
			if (state.collapsed.has(p)) state.collapsed.delete(p);
			else state.collapsed.add(p);
			renderTree();
			saveWorkspace();
		} else {
			open(row.dataset.path, { newTab: e.ctrlKey || e.metaKey });
		}
	});
	container.addEventListener('auxclick', (e) => {
		const row = e.target.closest('.tree-item.file');
		if (row && e.button === 1) open(row.dataset.path, { newTab: true });
	});
	container.addEventListener('contextmenu', (e) => {
		e.preventDefault();
		const row = e.target.closest('.tree-item');
		if (!row) {
			return showContextMenu(e.clientX, e.clientY, [
				{ label: 'Nova nota', run: () => createNote('') },
				{ label: 'Novo briefing', run: newBriefing },
				{ label: 'Nova pasta', run: () => createFolder() },
			]);
		}
		showContextMenu(e.clientX, e.clientY, fileMenuItems(row.dataset.path, row.dataset.type));
	});
	container.addEventListener('dragstart', (e) => {
		const row = e.target.closest('.tree-item');
		if (!row) return;
		e.dataTransfer.setData('text/briefing-path', JSON.stringify({ path: row.dataset.path, type: row.dataset.type }));
		e.dataTransfer.setData('text/plain', linkFor(row.dataset.path));
		e.dataTransfer.effectAllowed = 'copyMove';
	});
}

function setupTreeDrop() {
	const tree = $('#tree');
	const clearDrop = () => document.querySelectorAll('.drop-target').forEach((x) => x.classList.remove('drop-target'));
	tree.addEventListener('dragover', (e) => {
		if (!e.dataTransfer.types.includes('text/briefing-path') && !e.dataTransfer.types.includes('Files')) return;
		e.preventDefault();
		clearDrop();
		(e.target.closest('.tree-item.folder') ?? tree).classList.add('drop-target');
	});
	tree.addEventListener('dragleave', (e) => {
		if (!tree.contains(e.relatedTarget)) clearDrop();
	});
	tree.addEventListener('drop', async (e) => {
		e.preventDefault();
		clearDrop();
		const row = e.target.closest('.tree-item');
		const dest = row ? (row.dataset.type === 'folder' ? row.dataset.path : dirname(row.dataset.path)) : '';
		const raw = e.dataTransfer.getData('text/briefing-path');
		if (!raw) {
			// arquivos vindos do Windows: copia para a pasta de destino
			for (const file of e.dataTransfer.files) {
				const name = sanitizeName(file.name) || 'Arquivo';
				let target = joinPath(dest, name);
				for (let n = 1; existsCI(target); n++) target = joinPath(dest, name.replace(/(\.[^.]+)?$/, ` ${n}$1`));
				await api.writeBinary(target, await file.arrayBuffer());
				if (isNote(target)) await loadNote(target);
			}
			return refreshFiles();
		}
		const { path, type } = JSON.parse(raw);
		if (type === 'folder' && (dest === path || dest.startsWith(path + '/'))) return;
		const target = joinPath(dest, basename(path));
		if (target !== path) await renamePath(path, target, type);
	});
}

/* ---------- busca ---------- */

function snippetWithMark(container, text, at, len, context = 40) {
	const start = Math.max(0, at - context);
	container.append(
		(start > 0 ? '…' : '') + text.slice(start, at),
		el('mark', null, text.slice(at, at + len)),
		text.slice(at + len, at + len + 90),
	);
}

function runSearch(raw) {
	const q = raw.trim();
	const results = $('#search-results');
	const browse = $('#browse');
	if (!q) {
		results.hidden = true;
		browse.hidden = false;
		return;
	}
	browse.hidden = true;
	results.hidden = false;
	const found = [];
	if (q.startsWith('#') && q.length > 1) {
		const tag = normalizeText(q.slice(1));
		for (const f of notes()) {
			const tags = index.meta.get(f.path)?.tags ?? [];
			if (tags.some((t) => normalizeText(t) === tag || normalizeText(t).startsWith(tag + '/'))) found.push({ path: f.path, snippets: [] });
		}
	} else {
		// termos separados por espaço precisam aparecer todos (na nota)
		const terms = normalizeText(q).split(/\s+/).filter(Boolean);
		for (const f of notes()) {
			const text = state.contents.get(f.path) ?? '';
			const normName = normalizeText(noteName(f.path));
			const normText = normalizeText(text);
			if (!terms.every((term) => normName.includes(term) || normText.includes(term))) continue;
			const nameHit = terms.every((term) => normName.includes(term));
			const lines = text.split('\n');
			const snippets = [];
			for (let i = 0; i < lines.length && snippets.length < 3; i++) {
				const nl = normalizeText(lines[i]);
				const term = terms.find((x) => nl.includes(x));
				if (term) snippets.push({ line: i, text: lines[i], at: nl.indexOf(term), len: term.length });
			}
			found.push({ path: f.path, nameHit, snippets });
		}
		found.sort((a, b) => Number(b.nameHit) - Number(a.nameHit) || byName(a.path, b.path));
	}

	results.replaceChildren(el('div', 'panel-title', `${found.length} resultado${found.length === 1 ? '' : 's'}`));
	for (const r of found) {
		const item = el('div', 'result');
		const title = el('div', 'result-title', noteName(r.path));
		if (dirname(r.path)) title.append(el('span', 'result-folder', dirname(r.path)));
		title.onclick = (e) => open(r.path, { newTab: e.ctrlKey });
		item.append(title);
		for (const s of r.snippets) {
			const snippet = el('div', 'result-snippet');
			snippetWithMark(snippet, s.text, s.at, s.len);
			snippet.onclick = (e) => open(r.path, { line: s.line, newTab: e.ctrlKey });
			item.append(snippet);
		}
		results.append(item);
	}
}

function setSearch(q, focus = true) {
	const input = $('#search');
	input.value = q;
	runSearch(q);
	if (focus) input.focus();
	if (q && !state.layout.left) toggleSidebar('left');
}

function focusSearch() {
	if (!state.layout.left) toggleSidebar('left');
	$('#search').focus();
	$('#search').select();
}

/* ---------- painel direito ---------- */

const SIDE_TABS = [
	['backlinks', 'Links'],
	['outline', 'Tópicos'],
	['tags', 'Tags'],
	['tasks', 'Tarefas'],
	['calendar', 'Agenda'],
];

function renderSide() {
	const panel = $('#panel');
	panel.replaceChildren();
	for (const b of document.querySelectorAll('#right .tabs button')) b.classList.toggle('active', b.dataset.tab === state.sideTab);
	switch (state.sideTab) {
		case 'tags':
			return renderTags(panel);
		case 'tasks':
			return renderTasks(panel);
		case 'calendar':
			return renderAgenda(panel);
	}
	if (!currentPath()) return panel.append(el('div', 'muted', 'Nenhuma nota aberta.'));
	if (state.sideTab === 'backlinks') renderBacklinks(panel);
	else renderOutline(panel);
}

function renderBacklinks(panel) {
	const path = currentPath();
	const backlinks = index.backlinks(path);
	panel.append(el('div', 'panel-title', `Backlinks · ${backlinks.length}`));
	if (!backlinks.length) panel.append(el('div', 'muted', 'Nenhuma nota aponta para esta ainda.'));
	for (const { source, hits } of backlinks) {
		const item = el('div', 'bl-item');
		const title = el('div', 'bl-title', noteName(source));
		title.onclick = (e) => open(source, { newTab: e.ctrlKey });
		item.append(title);
		const lines = (state.contents.get(source) ?? '').split('\n');
		for (const line of [...new Set(hits.map((h) => h.line))].slice(0, 3)) {
			const snippet = el('div', 'bl-snippet', (lines[line] ?? '').trim().slice(0, 180));
			snippet.onclick = () => open(source, { line });
			item.append(snippet);
		}
		panel.append(item);
	}

	const seen = new Set();
	const outgoing = index.outgoing(path).filter((l) => {
		const key = l.resolved ?? '?' + l.target.toLowerCase();
		if (seen.has(key) || l.resolved === path) return false;
		seen.add(key);
		return true;
	});
	panel.append(el('div', 'panel-title spaced', `Links de saída · ${outgoing.length}`));
	for (const l of outgoing) {
		const label = l.resolved ? (isNote(l.resolved) ? noteName(l.resolved) : basename(l.resolved)) : l.target;
		const row = el('div', `out-link${l.resolved ? '' : ' unresolved'}`, label);
		if (!l.resolved) row.title = 'Nota ainda não existe — clique para criar';
		row.onclick = (e) => openLink(l.target, path, { newTab: e.ctrlKey });
		panel.append(row);
	}

	const mentions = index.unlinkedMentions(path, state.contents);
	panel.append(el('div', 'panel-title spaced', `Menções não vinculadas · ${mentions.length}`));
	if (!mentions.length) panel.append(el('div', 'muted', 'Nenhuma outra nota cita este nome sem link.'));
	for (const m of mentions) {
		const item = el('div', 'bl-item');
		const head = el('div', 'mention-head');
		const title = el('span', 'bl-title', noteName(m.source));
		title.onclick = () => open(m.source, { line: m.line });
		const link = el('button', 'btn small', 'Vincular');
		link.title = `Transformar "${m.match}" em [[${noteName(path)}]]`;
		link.onclick = () => linkMention(path, m);
		head.append(title, link);
		const snippet = el('div', 'bl-snippet');
		snippetWithMark(snippet, m.text, m.index, m.match.length);
		snippet.onclick = () => open(m.source, { line: m.line });
		item.append(head, snippet);
		panel.append(item);
	}
}

async function linkMention(target, m) {
	const text = state.contents.get(m.source);
	if (text == null) return;
	const lines = text.split('\n');
	const line = lines[m.line];
	if (line?.slice(m.index, m.index + m.match.length) !== m.match) return;
	const name = noteName(target);
	const link = m.match === name ? `[[${name}]]` : `[[${name}|${m.match}]]`;
	lines[m.line] = line.slice(0, m.index) + link + line.slice(m.index + m.match.length);
	await setNoteContent(m.source, lines.join('\n'));
	updateStatus(`Link criado em "${noteName(m.source)}"`);
}

function renderOutline(panel) {
	const headings = index.headings(currentPath());
	panel.append(el('div', 'panel-title', `Tópicos · ${headings.length}`));
	if (!headings.length) panel.append(el('div', 'muted', 'Sem títulos nesta nota. Use # Título.'));
	for (const h of headings) {
		const row = el('div', 'outline-item', h.text);
		row.style.paddingLeft = `${8 + (h.level - 1) * 14}px`;
		row.onclick = () => {
			if (cur()?.mode === 'read') $('#reader').querySelector(`[data-line="${h.line}"]`)?.scrollIntoView({ behavior: 'smooth' });
			else editor.scrollToLine(h.line);
		};
		panel.append(row);
	}
}

function renderTags(panel) {
	const tags = index.tags();
	panel.append(el('div', 'panel-title', `Tags · ${tags.length}`));
	if (!tags.length) panel.append(el('div', 'muted', 'Use #tag nas notas para organizá-las.'));
	for (const [tag, count] of tags) {
		const row = el('div', 'tag-row');
		row.style.paddingLeft = `${8 + (tag.split('/').length - 1) * 12}px`;
		row.append(el('span', 'tag', `#${tag}`), el('span', 'count', String(count)));
		row.onclick = () => setSearch(`#${tag}`);
		panel.append(row);
	}
}

function renderTasks(panel) {
	const all = index.tasks();
	const openCount = all.filter((t) => !t.done).length;
	panel.append(el('div', 'panel-title', `Tarefas · ${openCount} abertas de ${all.length}`));
	const seg = el('div', 'segmented');
	for (const [key, label] of [['open', 'Abertas'], ['all', 'Todas'], ['note', 'Desta nota']]) {
		const b = el('button', state.tasksFilter === key ? 'active' : '', label);
		b.onclick = () => {
			state.tasksFilter = key;
			renderSide();
		};
		seg.append(b);
	}
	panel.append(seg);
	let list = all;
	if (state.tasksFilter === 'open') list = all.filter((t) => !t.done);
	else if (state.tasksFilter === 'note') list = all.filter((t) => t.path === currentPath());
	if (!list.length) panel.append(el('div', 'muted', state.tasksFilter === 'open' ? 'Tudo feito por aqui. 🎉' : 'Nenhuma tarefa. Crie com "- [ ]" ou Ctrl+L.'));
	const groups = new Map();
	for (const t of list) {
		if (!groups.has(t.path)) groups.set(t.path, []);
		groups.get(t.path).push(t);
	}
	for (const [path, tasks] of [...groups].sort((a, b) => byName(a[0], b[0]))) {
		const group = el('div', 'task-group');
		const title = el('div', 'bl-title', noteName(path));
		title.onclick = () => open(path);
		group.append(title);
		for (const t of tasks) {
			const row = el('div', `task-row${t.done ? ' done' : ''}`);
			const box = el('input');
			box.type = 'checkbox';
			box.checked = t.done;
			box.onchange = () => toggleTaskAt(path, t.line);
			const text = el('span', 'task-text', t.text || '(sem descrição)');
			text.onclick = () => open(path, { line: t.line });
			row.append(box, text);
			group.append(row);
		}
		panel.append(group);
	}
}

function renderAgenda(panel) {
	panel.append(el('div', 'panel-title', 'Notas diárias'));
	const box = el('div', 'calendar');
	renderCalendar(box, {
		month: state.calMonth,
		hasNote: (d) => existsCI(dailyPath(d)),
		onPick: (d) => openDailyNote(d),
		onMonth: (delta) => {
			const m = state.calMonth;
			state.calMonth = delta === 0 ? new Date() : new Date(m.getFullYear(), m.getMonth() + delta, 1);
			renderSide();
		},
	});
	panel.append(box);
	const folder = state.settings.dailyFolder.trim().toLowerCase();
	const dailies = notes()
		.filter((f) => dirname(f.path).toLowerCase() === folder)
		.sort((a, b) => b.path.localeCompare(a.path))
		.slice(0, 10);
	panel.append(el('div', 'panel-title spaced', 'Recentes'));
	if (!dailies.length) panel.append(el('div', 'muted', 'Clique num dia para criar a nota daquele dia.'));
	for (const f of dailies) {
		const row = el('div', 'out-link', noteName(f.path));
		row.onclick = () => open(f.path);
		panel.append(row);
	}
}

/* ---------- barra de status ---------- */

let statusMessage = null;
let statusTimer = null;

function updateStatus(message) {
	if (message) {
		statusMessage = message;
		clearTimeout(statusTimer);
		statusTimer = setTimeout(() => {
			statusMessage = null;
			updateStatus();
		}, 4500);
	}
	const bar = $('#status');
	bar.replaceChildren();
	if (statusMessage) bar.append(el('span', 'status-msg', statusMessage));
	const teams = state.teamsInfo?.teams ?? [];
	if (teams.length) {
		const online = new Set(teams.flatMap((t) => t.peers.map((peer) => peer.name)));
		const here = teams.find((t) => sameFolder(t.folder, state.vault?.root));
		const label = here ? `⇅ ${here.name} · ${here.peers.length ? `${here.peers.length} online` : 'aguardando parceiros'}` : `⇅ ${online.size} parceiro${online.size === 1 ? '' : 's'} online`;
		const sync = el('span', `status-sync${online.size ? ' on' : ''}`, label);
		sync.title = online.size ? `Online: ${[...online].join(', ')}` : 'Nenhum parceiro conectado agora';
		sync.onclick = openTeams;
		bar.append(sync);
	}
	const p = currentPath();
	if (!p) return;
	const text = state.contents.get(p) ?? '';
	const words = countWords(text);
	const backlinks = index.backlinks(p).length;
	const saved = state.saveError ? `Erro ao salvar: ${state.saveError}` : state.dirtyPaths.has(p) ? 'Não salvo' : 'Salvo';
	const parts = [
		state.selectionWords ? `${state.selectionWords} selecionadas` : null,
		`${backlinks} backlink${backlinks === 1 ? '' : 's'}`,
		`${words} palavras`,
		`~${Math.max(1, Math.round(words / 200))} min de leitura`,
		`${text.length} caracteres`,
		saved,
	].filter(Boolean);
	for (const part of parts) bar.append(el('span', null, part));
	if (state.saveError) bar.lastChild.classList.add('error');
}

/* ---------- modais e menus ---------- */

function closeModal() {
	const cleanup = state.modalCleanup;
	state.modalCleanup = null;
	$('#modal-root').replaceChildren();
	cleanup?.();
}

function modalShell(cls = 'modal') {
	closeModal();
	const backdrop = el('div', 'modal-backdrop');
	const box = el('div', cls);
	backdrop.append(box);
	backdrop.addEventListener('mousedown', (e) => {
		if (e.target === backdrop) closeModal();
	});
	$('#modal-root').append(backdrop);
	return box;
}

function openListModal({ placeholder, getItems, onCreate, emptyText, onCancel, footer }) {
	const box = modalShell('modal modal-list-box');
	state.modalCleanup = onCancel ?? null;
	const input = el('input', 'modal-input');
	input.placeholder = placeholder;
	const list = el('div', 'modal-list');
	box.append(input, list);
	if (footer) box.append(el('div', 'modal-footer', footer));
	let items = [];
	let selected = 0;

	const finish = (fn) => {
		state.modalCleanup = null;
		closeModal();
		fn();
	};
	const choose = (i, inNewTab = false) => {
		const item = items[i];
		const query = input.value.trim();
		if (item) finish(() => (inNewTab && item.runNewTab ? item.runNewTab() : item.run()));
		else if (onCreate && query) finish(() => onCreate(query));
	};
	const update = () => {
		items = getItems(input.value);
		selected = Math.min(selected, Math.max(0, items.length - 1));
		list.replaceChildren();
		items.forEach((item, i) => {
			const row = el('div', `modal-item${i === selected ? ' selected' : ''}`);
			row.append(el('span', 'label', item.label));
			if (item.detail) row.append(el('span', 'detail', item.detail));
			if (item.hotkey) row.append(el('kbd', null, formatHotkey(item.hotkey)));
			row.addEventListener('mousedown', (e) => {
				e.preventDefault();
				choose(i, e.ctrlKey);
			});
			list.append(row);
		});
		if (!items.length) list.append(el('div', 'modal-empty', emptyText?.(input.value.trim()) ?? 'Nada encontrado'));
		list.querySelector('.selected')?.scrollIntoView({ block: 'nearest' });
	};
	input.addEventListener('input', () => {
		selected = 0;
		update();
	});
	input.addEventListener('keydown', (e) => {
		if (e.key === 'ArrowDown') {
			selected = Math.min(selected + 1, items.length - 1);
			update();
		} else if (e.key === 'ArrowUp') {
			selected = Math.max(selected - 1, 0);
			update();
		} else if (e.key === 'Enter') {
			const query = input.value.trim();
			if (e.shiftKey && onCreate && query) finish(() => onCreate(query));
			else choose(selected, e.ctrlKey);
		} else {
			return;
		}
		e.preventDefault();
		e.stopPropagation();
	});
	update();
	input.focus();
}

function dialogModal({ title, message, value = null, okLabel = 'OK', cancelLabel = 'Cancelar', danger = false }) {
	return new Promise((resolve) => {
		const box = modalShell();
		let done = false;
		const finish = (v) => {
			if (done) return;
			done = true;
			resolve(v);
		};
		if (title) box.append(el('div', 'modal-title', title));
		if (message) box.append(el('div', 'modal-message', message));
		let input = null;
		if (value != null) {
			input = el('input', 'modal-input');
			input.value = value;
			box.append(input);
		}
		const buttons = el('div', 'modal-buttons');
		const ok = el('button', danger ? 'btn danger' : 'btn cta', okLabel);
		if (cancelLabel) {
			const cancel = el('button', 'btn', cancelLabel);
			cancel.onclick = () => closeModal();
			buttons.append(cancel);
		}
		buttons.append(ok);
		box.append(buttons);
		state.modalCleanup = () => finish(input ? null : false);
		ok.onclick = () => {
			const result = input ? input.value : true;
			state.modalCleanup = null;
			closeModal();
			finish(result);
		};
		(input ?? ok).addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				ok.click();
			}
		});
		if (input) {
			input.focus();
			input.select();
		} else {
			ok.focus();
		}
	});
}

const promptModal = (title, value) => dialogModal({ title, value });
const confirmModal = (message, okLabel) => dialogModal({ message, okLabel, danger: true });
const alertModal = (message) => dialogModal({ message, cancelLabel: null });

function showImage(path) {
	const box = modalShell('modal image-viewer');
	const img = el('img');
	img.src = vaultUrl(path);
	img.alt = basename(path);
	const buttons = el('div', 'modal-buttons');
	const external = el('button', 'btn', 'Abrir no app padrão');
	external.onclick = () => api.openFile(path);
	const copy = el('button', 'btn', 'Copiar link');
	copy.onclick = () => copyLink(path);
	const close = el('button', 'btn cta', 'Fechar');
	close.onclick = () => closeModal();
	buttons.append(external, copy, close);
	box.append(el('div', 'modal-title', basename(path)), img, buttons);
}

function settingControl(item) {
	const value = state.settings[item.key];
	const set = (v) => {
		state.settings[item.key] = v;
		applySettings();
		saveSettings();
		if (item.key === 'sort' || item.key === 'showAttachments') renderTree();
		if (item.key.startsWith('daily')) renderSide();
	};
	switch (item.type) {
		case 'toggle': {
			const wrap = el('label', 'switch');
			const input = el('input');
			input.type = 'checkbox';
			input.checked = !!value;
			input.onchange = () => set(input.checked);
			wrap.append(input, el('span', 'slider'));
			return wrap;
		}
		case 'select': {
			const select = el('select', 'input');
			for (const [v, label] of item.options) {
				const o = el('option', null, label);
				o.value = v;
				select.append(o);
			}
			select.value = value;
			select.onchange = () => set(select.value);
			return select;
		}
		case 'number': {
			const input = el('input', 'input narrow');
			input.type = 'number';
			Object.assign(input, { min: item.min, max: item.max, step: item.step });
			input.value = value;
			input.onchange = () => {
				const n = Number(input.value);
				if (Number.isFinite(n)) set(Math.min(item.max, Math.max(item.min, n)));
				input.value = state.settings[item.key];
			};
			return input;
		}
		case 'color': {
			const wrap = el('div', 'color-control');
			const input = el('input');
			input.type = 'color';
			const currentAccent = () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
			input.value = value || currentAccent();
			input.oninput = () => set(input.value);
			const reset = el('button', 'btn small', 'Padrão');
			reset.onclick = () => {
				set('');
				input.value = currentAccent();
			};
			wrap.append(input, reset);
			return wrap;
		}
		default: {
			const input = el('input', 'input');
			input.value = value;
			input.spellcheck = false;
			input.placeholder = DEFAULT_SETTINGS[item.key] || '';
			input.onchange = () => set(input.value.trim());
			return input;
		}
	}
}

function openSettings() {
	const box = modalShell('modal modal-wide settings');
	box.append(el('div', 'modal-title', 'Configurações'));
	const body = el('div', 'settings-body');
	for (const section of SETTINGS_SCHEMA) {
		body.append(el('div', 'settings-section', section.section));
		for (const item of section.items) {
			const row = el('div', 'setting');
			const info = el('div', 'setting-info');
			info.append(el('div', 'setting-label', item.label));
			if (item.hint) info.append(el('div', 'setting-hint', item.hint));
			row.append(info, settingControl(item));
			body.append(row);
		}
	}
	// Preferências do app neste computador (não do vault)
	body.append(el('div', 'settings-section', 'Sistema (este computador)'));
	const systemToggle = (key, label, hint) => {
		const row = el('div', 'setting');
		const info = el('div', 'setting-info');
		info.append(el('div', 'setting-label', label), el('div', 'setting-hint', hint));
		const wrap = el('label', 'switch');
		const input = el('input');
		input.type = 'checkbox';
		input.disabled = true;
		input.onchange = async () => {
			const prefs = await api.app.setPref(key, input.checked);
			input.checked = !!prefs[key];
		};
		wrap.append(input, el('span', 'slider'));
		row.append(info, wrap);
		body.append(row);
		return input;
	};
	const bgToggle = systemToggle(
		'background',
		'Continuar em segundo plano ao fechar',
		'Fechar a janela deixa o Briefing na bandeja do sistema, sincronizando com a equipe',
	);
	const loginToggle = systemToggle('openAtLogin', 'Iniciar com o sistema', 'Abre minimizado na bandeja quando você liga o computador');
	api.app.prefs().then((prefs) => {
		bgToggle.checked = prefs.background;
		loginToggle.checked = prefs.openAtLogin;
		bgToggle.disabled = loginToggle.disabled = false;
	});
	body.append(el('div', 'settings-section', 'Sobre'));
	body.append(
		el(
			'div',
			'setting-hint about',
			`Briefing 0.2 · vault: ${state.vault?.root ?? '—'} · configurações salvas em .briefing/config.json dentro do vault.`,
		),
	);
	const buttons = el('div', 'modal-buttons');
	const reveal = el('button', 'btn', 'Abrir pasta do vault');
	reveal.onclick = () => api.revealVault();
	const done = el('button', 'btn cta', 'Fechar');
	done.onclick = () => closeModal();
	buttons.append(reveal, done);
	box.append(body, buttons);
}

async function showHistory(path = currentPath()) {
	if (!path) return;
	await saveAll();
	const versions = await api.historyList(path);
	const box = modalShell('modal modal-wide history');
	box.append(el('div', 'modal-title', `Histórico de versões · ${noteName(path)}`));
	const buttons = el('div', 'modal-buttons');
	const close = el('button', 'btn', 'Fechar');
	close.onclick = () => closeModal();
	if (!versions.length) {
		box.append(
			el('div', 'modal-message', 'Ainda não há versões salvas. O Briefing guarda uma cópia antes de editar uma nota (no máximo uma a cada 5 minutos).'),
		);
		buttons.append(close);
		box.append(buttons);
		return;
	}
	const wrap = el('div', 'history-wrap');
	const list = el('div', 'history-list');
	const preview = el('pre', 'history-preview');
	let selected = null;
	const select = async (v, row) => {
		list.querySelectorAll('.selected').forEach((x) => x.classList.remove('selected'));
		row.classList.add('selected');
		selected = v;
		preview.textContent = 'Carregando…';
		v.text ??= await api.historyRead(path, v.id);
		if (selected === v) preview.textContent = v.text;
	};
	for (const v of versions) {
		const row = el('div', 'history-item');
		row.append(el('span', null, new Date(v.time).toLocaleString('pt-BR')), el('span', 'detail', `${(v.size / 1024).toFixed(1)} KB`));
		row.onclick = () => select(v, row);
		list.append(row);
	}
	wrap.append(list, preview);
	const restore = el('button', 'btn cta', 'Restaurar esta versão');
	restore.onclick = async () => {
		if (selected?.text == null) return;
		closeModal();
		await setNoteContent(path, selected.text);
		updateStatus('Versão restaurada — a versão anterior também foi guardada no histórico');
	};
	buttons.append(close, restore);
	box.append(wrap, buttons);
	select(versions[0], list.firstChild);
}

async function exportPdf() {
	const p = currentPath();
	if (!p) return;
	await saveAll();
	const t = cur();
	const previous = t.mode;
	t.mode = 'read';
	applyMode();
	document.body.classList.add('printing');
	try {
		const out = await api.exportPdf(noteName(p));
		if (out) updateStatus(`PDF salvo em ${out}`);
	} catch (err) {
		alertModal(`Não foi possível exportar: ${err.message}`);
	} finally {
		document.body.classList.remove('printing');
		t.mode = previous;
		applyMode();
	}
}

function showContextMenu(x, y, items) {
	hideContextMenu();
	const menu = el('div', 'context-menu');
	for (const item of items) {
		if (item === '-') {
			menu.append(el('div', 'sep'));
			continue;
		}
		const row = el('div', `context-item${item.danger ? ' danger' : ''}`, item.label);
		row.onclick = () => {
			hideContextMenu();
			item.run();
		};
		menu.append(row);
	}
	document.body.append(menu);
	const rect = menu.getBoundingClientRect();
	menu.style.left = `${Math.max(4, Math.min(x, innerWidth - rect.width - 4))}px`;
	menu.style.top = `${Math.max(4, Math.min(y, innerHeight - rect.height - 4))}px`;
}

function hideContextMenu() {
	document.querySelector('.context-menu')?.remove();
}

/* ---------- prévia flutuante de links (modo leitura e painéis) ---------- */

let hoverTimer = null;
let hideTimer = null;
let hoverEl = null;

function hideHover() {
	hoverEl?.remove();
	hoverEl = null;
}

function scheduleHideHover() {
	clearTimeout(hideTimer);
	hideTimer = setTimeout(hideHover, 250);
}

function showHover(anchor) {
	const html = renderPreview(anchor.dataset.href);
	if (!html || !anchor.isConnected) return;
	hideHover();
	const pop = el('div', 'hover-preview markdown floating');
	pop.innerHTML = html;
	document.body.append(pop);
	const r = anchor.getBoundingClientRect();
	const w = Math.min(480, innerWidth - 24);
	pop.style.width = `${w}px`;
	pop.style.left = `${Math.max(12, Math.min(r.left, innerWidth - w - 12))}px`;
	pop.style.top = `${r.bottom + 6}px`;
	const h = pop.getBoundingClientRect().height;
	if (r.bottom + 6 + h > innerHeight - 10) pop.style.top = `${Math.max(10, r.top - h - 6)}px`;
	pop.addEventListener('mouseenter', () => clearTimeout(hideTimer));
	pop.addEventListener('mouseleave', scheduleHideHover);
	hoverEl = pop;
}

function setupHoverPreviews() {
	document.addEventListener('mouseover', (e) => {
		const a = e.target.closest?.('#reader a.internal-link, .hover-preview.floating a.internal-link');
		if (!a) return;
		clearTimeout(hoverTimer);
		clearTimeout(hideTimer);
		hoverTimer = setTimeout(() => showHover(a), 400);
		a.addEventListener(
			'mouseleave',
			() => {
				clearTimeout(hoverTimer);
				scheduleHideHover();
			},
			{ once: true },
		);
	});
	// cliques dentro de prévias (do leitor ou do editor)
	document.addEventListener('click', (e) => {
		const a = e.target.closest?.('.hover-preview a');
		if (!a) return;
		e.preventDefault();
		hideHover();
		if (a.classList.contains('internal-link')) openLink(a.dataset.href, currentPath(), { newTab: e.ctrlKey });
		else if (a.classList.contains('tag')) setSearch(`#${a.dataset.tag}`);
		else if (/^(https?|mailto):/i.test(a.getAttribute('href') ?? '')) api.openExternal(a.getAttribute('href'));
	});
}

/* ---------- layout ---------- */

function applyLayout() {
	const { left, right, focus, leftWidth, rightWidth } = state.layout;
	const showLeft = left && !focus;
	const showRight = right && !focus && innerWidth >= 900;
	$('#left').hidden = !showLeft;
	$('#right').hidden = !showRight;
	$('#app').style.gridTemplateColumns = `${showLeft ? leftWidth : 0}px minmax(0, 1fr) ${showRight ? rightWidth : 0}px`;
	document.body.classList.toggle('focus-mode', focus);
	$('#btn-toggle-left').classList.toggle('on', showLeft);
	$('#btn-toggle-right').classList.toggle('on', showRight);
}

function toggleSidebar(side) {
	if (state.layout.focus) state.layout.focus = false;
	state.layout[side] = !state.layout[side];
	applyLayout();
	saveWorkspace();
}

function toggleFocus() {
	state.layout.focus = !state.layout.focus;
	applyLayout();
	updateStatus(state.layout.focus ? 'Modo foco — use o mesmo comando para sair' : null);
}

function setupResizer(handle, side) {
	handle.addEventListener('pointerdown', (e) => {
		e.preventDefault();
		handle.setPointerCapture(e.pointerId);
		handle.classList.add('dragging');
		const key = side === 'left' ? 'leftWidth' : 'rightWidth';
		const startX = e.clientX;
		const start = state.layout[key];
		const move = (ev) => {
			const dx = ev.clientX - startX;
			state.layout[key] = Math.min(560, Math.max(180, side === 'left' ? start + dx : start - dx));
			applyLayout();
		};
		const up = () => {
			handle.classList.remove('dragging');
			handle.removeEventListener('pointermove', move);
			handle.removeEventListener('pointerup', up);
			saveWorkspace();
		};
		handle.addEventListener('pointermove', move);
		handle.addEventListener('pointerup', up);
	});
}

/* ---------- equipes (sincronização P2P) ---------- */

const sameFolder = (a, b) => !!a && !!b && a.replace(/[\\/]+$/, '').toLowerCase() === b.replace(/[\\/]+$/, '').toLowerCase();

function timeAgo(ms) {
	if (!ms) return 'nunca';
	const s = Math.round((Date.now() - ms) / 1000);
	if (s < 10) return 'agora';
	if (s < 60) return `há ${s} s`;
	if (s < 3600) return `há ${Math.round(s / 60)} min`;
	if (s < 86400) return `há ${Math.round(s / 3600)} h`;
	return `há ${Math.round(s / 86400)} dias`;
}

let teamsRender = null; // re-renderiza o modal aberto quando o status muda

function onTeamsChanged(info) {
	state.teamsInfo = info;
	teamsRender?.();
	updateStatus();
}

async function openFolderAsVault(folder) {
	await saveAll();
	await api.openFolder(folder);
	closeModal();
	setSearch('', false);
	await loadVault();
}

function renderTeamCard(team) {
	const card = el('div', `team-card${team.paused ? ' paused' : ''}`);
	const online = team.peers.length;
	const head = el('div', 'team-head');
	const dot = el('span', `team-dot ${team.paused ? 'off' : online ? 'on' : 'wait'}`);
	head.append(dot, el('span', 'team-name', team.name));
	const peerText = team.paused ? 'pausada' : online ? `${online} online: ${team.peers.map((p) => p.name).join(', ')}` : 'procurando parceiros…';
	head.append(el('span', 'team-peers', peerText));
	card.append(head);

	const meta = el('div', 'team-meta');
	meta.append(
		el('div', null, `Pasta: ${team.folder}`),
		el('div', null, `${team.files} arquivos · última sincronização ${timeAgo(team.lastSync)} · enviados ${team.sent} · recebidos ${team.received}`),
	);
	card.append(meta);

	const codeRow = el('div', 'team-code');
	const code = el('code', 'code-hidden', team.code);
	const show = el('button', 'btn small', 'Mostrar código');
	show.onclick = () => {
		code.classList.toggle('code-hidden');
		show.textContent = code.classList.contains('code-hidden') ? 'Mostrar código' : 'Ocultar';
	};
	const copy = el('button', 'btn small', 'Copiar código');
	copy.onclick = async () => {
		await navigator.clipboard.writeText(team.code);
		copy.textContent = 'Copiado!';
		setTimeout(() => (copy.textContent = 'Copiar código'), 1500);
	};
	codeRow.append(el('span', 'muted-inline', 'Convite:'), code, show, copy);
	card.append(codeRow);

	if (team.conflicts.length) {
		const box = el('div', 'team-conflicts');
		box.append(el('div', 'panel-title', `Conflitos recentes · ${team.conflicts.length}`));
		for (const c of team.conflicts.slice(0, 5)) {
			const row = el('div', 'out-link', `${c.path} → cópia de ${c.with}`);
			row.title = c.copy;
			row.onclick = async () => {
				if (!sameFolder(state.vault?.root, team.folder)) await openFolderAsVault(team.folder);
				else closeModal();
				open(c.copy);
			};
			box.append(row);
		}
		card.append(box);
	}

	const actions = el('div', 'team-actions');
	if (!sameFolder(state.vault?.root, team.folder)) {
		const openBtn = el('button', 'btn small cta', 'Abrir como vault');
		openBtn.onclick = () => openFolderAsVault(team.folder);
		actions.append(openBtn);
	} else {
		actions.append(el('span', 'badge', 'vault aberto'));
	}
	const pause = el('button', 'btn small', team.paused ? 'Retomar' : 'Pausar');
	pause.onclick = () => api.teams.pause(team.id, !team.paused);
	const leave = el('button', 'btn small danger-outline', 'Sair da equipe');
	leave.onclick = async () => {
		const ok = await confirmModal(
			`Sair da equipe "${team.name}"? Os arquivos continuam no seu PC em ${team.folder}, mas param de sincronizar.`,
			'Sair da equipe',
		);
		if (ok) await api.teams.leave(team.id);
		openTeams();
	};
	actions.append(pause, leave);
	card.append(actions);
	return card;
}

async function openTeams() {
	const box = modalShell('modal modal-wide teams');
	box.append(el('div', 'modal-title', 'Equipes · pastas compartilhadas P2P'));
	box.append(
		el(
			'div',
			'modal-message small',
			'Os PCs da equipe se conectam direto, com criptografia ponta a ponta. Cada mudança numa pasta compartilhada (sua, do parceiro ou do Claude de qualquer um) vai na hora para os outros. Nenhum servidor guarda seus arquivos. O Briefing precisa estar aberto nos PCs para sincronizar.',
		),
	);
	const body = el('div', 'settings-body');
	box.append(body);

	// nome deste PC
	const nameRow = el('div', 'setting');
	const nameInfo = el('div', 'setting-info');
	nameInfo.append(el('div', 'setting-label', 'Seu nome na equipe'), el('div', 'setting-hint', 'É assim que os parceiros veem você'));
	const nameWrap = el('div', 'inline-form');
	const nameInput = el('input', 'input');
	const info = state.teamsInfo ?? (await api.teams.info());
	nameInput.value = info.deviceName;
	const nameSave = el('button', 'btn small', 'Salvar');
	nameSave.onclick = () => api.teams.setDeviceName(nameInput.value);
	nameWrap.append(nameInput, nameSave);
	nameRow.append(nameInfo, nameWrap);
	body.append(nameRow);

	const listTitle = el('div', 'settings-section', 'Suas equipes');
	const list = el('div', 'team-list');
	body.append(listTitle, list);
	teamsRender = () => {
		const teams = state.teamsInfo?.teams ?? [];
		list.replaceChildren(...(teams.length ? teams.map(renderTeamCard) : [el('div', 'muted', 'Você ainda não participa de nenhuma equipe.')]));
	};
	state.modalCleanup = () => {
		teamsRender = null;
	};
	state.teamsInfo = info;
	teamsRender();

	const folderPicker = (input, title) => {
		const btn = el('button', 'btn small', 'Escolher…');
		btn.onclick = async () => {
			const dir = await api.teams.chooseFolder(title);
			if (dir) input.value = dir;
		};
		return btn;
	};

	// criar
	body.append(el('div', 'settings-section', 'Criar uma equipe'));
	const createForm = el('div', 'team-form');
	const cName = el('input', 'input');
	cName.placeholder = 'Nome da equipe (ex.: Cesto)';
	cName.value = state.vault?.name ?? '';
	const cFolder = el('input', 'input wide');
	cFolder.value = state.vault?.root ?? '';
	cFolder.placeholder = 'Pasta a compartilhar';
	const cBtn = el('button', 'btn cta', 'Criar equipe e gerar convite');
	cBtn.onclick = async () => {
		try {
			cBtn.disabled = true;
			const team = await api.teams.create({ name: cName.value, folder: cFolder.value });
			await navigator.clipboard.writeText(team.code).catch(() => {});
			await alertModal(`Equipe "${team.name}" criada! O código de convite foi copiado:\n\n${team.code}\n\nEnvie para o seu parceiro por um canal privado (WhatsApp, e-mail). Quem tem o código entra na equipe.`);
			openTeams();
		} catch (err) {
			alertModal(err.message.replace(/^Error invoking remote method '[^']+': Error: /, ''));
		} finally {
			cBtn.disabled = false;
		}
	};
	createForm.append(
		labeled('Nome', cName),
		labeled('Pasta', el('div', 'inline-form', null), (wrap) => wrap.append(cFolder, folderPicker(cFolder, 'Pasta a compartilhar com a equipe'))),
		cBtn,
	);
	body.append(createForm);

	// entrar
	body.append(el('div', 'settings-section', 'Entrar numa equipe'));
	const joinForm = el('div', 'team-form');
	const jCode = el('input', 'input wide');
	jCode.placeholder = 'BRF-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX';
	jCode.spellcheck = false;
	const jFolder = el('input', 'input wide');
	jFolder.value = await api.teams.defaultJoinFolder('Equipe');
	const jBtn = el('button', 'btn cta', 'Entrar e sincronizar');
	jBtn.onclick = async () => {
		try {
			jBtn.disabled = true;
			const team = await api.teams.join({ code: jCode.value, folder: jFolder.value });
			const go = await dialogModal({
				message: `Pronto! Os arquivos da equipe vão chegar em ${team.folder} assim que um parceiro estiver online. Abrir essa pasta como vault agora?`,
				okLabel: 'Abrir vault da equipe',
				cancelLabel: 'Depois',
			});
			if (go) await openFolderAsVault(team.folder);
			else openTeams();
		} catch (err) {
			alertModal(err.message.replace(/^Error invoking remote method '[^']+': Error: /, ''));
		} finally {
			jBtn.disabled = false;
		}
	};
	joinForm.append(
		labeled('Código', jCode),
		labeled('Guardar em', el('div', 'inline-form'), (wrap) => wrap.append(jFolder, folderPicker(jFolder, 'Onde guardar os arquivos da equipe'))),
		jBtn,
	);
	body.append(joinForm);

	const buttons = el('div', 'modal-buttons');
	const close = el('button', 'btn', 'Fechar');
	close.onclick = () => closeModal();
	buttons.append(close);
	box.append(buttons);
}

function labeled(label, control, fill) {
	const row = el('label', 'form-row');
	row.append(el('span', 'form-label', label), control);
	fill?.(control);
	return row;
}

/* ---------- segundo cérebro (RAG) ---------- */

function brainSearch() {
	const box = modalShell('modal modal-wide brain-search');
	const input = el('input', 'modal-input');
	input.placeholder = 'Pergunte qualquer coisa sobre suas notas… (busca por significado)';
	const list = el('div', 'modal-list brain-results');
	const footer = el('div', 'modal-footer', 'Combina significado (IA local) e palavras exatas · Enter abre o primeiro resultado');
	box.append(input, list, footer);
	let results = [];
	let seq = 0;
	const openResult = async (r) => {
		closeModal();
		if (!sameFolder(state.vault?.root, r.folder)) {
			const ok = await dialogModal({ message: `Essa nota está no vault "${r.vault}". Abrir esse vault?`, okLabel: 'Abrir' });
			if (!ok) return;
			await openFolderAsVault(r.folder);
		}
		open(r.path, { line: r.line });
	};
	const runQuery = debounce(async () => {
		const q = input.value.trim();
		const mine = ++seq;
		if (!q) return list.replaceChildren(el('div', 'modal-empty', 'Ex.: "quanto a padaria paga por mês?", "o que decidimos sobre o site?"'));
		list.replaceChildren(el('div', 'modal-empty', 'Buscando…'));
		try {
			const started = performance.now();
			results = await api.brain.search(q, { limit: 15 });
			if (mine !== seq) return;
			footer.textContent = `${results.length} trechos em ${Math.round(performance.now() - started)} ms · significado (IA local) + palavras exatas`;
			list.replaceChildren();
			if (!results.length) list.append(el('div', 'modal-empty', 'Nada encontrado.'));
			for (const r of results) {
				const row = el('div', 'brain-result');
				const title = el('div', 'brain-title');
				title.append(el('span', null, r.title + (r.heading && r.heading !== r.title ? ` › ${r.heading}` : '')));
				for (const by of r.matchedBy) title.append(el('span', `badge ${by === 'significado' ? 'semantic' : ''}`, by));
				const meta = el('div', 'brain-meta', `${r.vault} · ${r.path}`);
				const snippet = el('div', 'brain-snippet', r.text.length > 280 ? `${r.text.slice(0, 280)}…` : r.text);
				row.append(title, meta, snippet);
				row.onclick = () => openResult(r);
				list.append(row);
			}
		} catch (err) {
			if (mine === seq) list.replaceChildren(el('div', 'modal-empty', err.message.replace(/^Error invoking remote method '[^']+': Error: /, '')));
		}
	}, 250);
	input.addEventListener('input', runQuery);
	input.addEventListener('keydown', (e) => {
		if (e.key === 'Enter' && results[0]) {
			e.preventDefault();
			openResult(results[0]);
		}
	});
	runQuery();
	input.focus();
}

let brainRender = null;

function onBrainStats(stats) {
	state.brainStats = stats;
	brainRender?.();
}

async function openBrain() {
	const box = modalShell('modal modal-wide brain');
	box.append(el('div', 'modal-title', 'Segundo cérebro'));
	box.append(
		el(
			'div',
			'modal-message small',
			'Todas as notas (do vault aberto e das equipes) são divididas em trechos e vetorizadas por uma IA que roda neste PC. Nada sai do computador. O Claude Code consulta esse índice em milissegundos através do servidor MCP do Briefing.',
		),
	);
	const body = el('div', 'settings-body');
	box.append(body);
	body.append(el('div', 'settings-section', 'Índice'));
	const statsBox = el('div', 'brain-stats');
	body.append(statsBox);
	brainRender = () => {
		const stats = state.brainStats ?? [];
		statsBox.replaceChildren();
		if (!stats.length) statsBox.append(el('div', 'muted', 'Iniciando…'));
		for (const s of stats) {
			const row = el('div', 'brain-stat');
			const pct = s.chunks ? Math.round((s.embedded / s.chunks) * 100) : 100;
			row.append(
				el('div', 'brain-stat-name', s.name),
				el('div', 'setting-hint', `${s.notes} notas · ${s.chunks} trechos · ${s.embedded} vetorizados (${pct}%) · ${s.semantic ? 'busca por significado ativa' : `só palavras${s.error ? ` (${s.error})` : ''}`}`),
			);
			const bar = el('div', 'progress');
			const fill = el('div', 'progress-fill');
			fill.style.width = `${pct}%`;
			bar.append(fill);
			row.append(bar);
			statsBox.append(row);
		}
	};
	state.modalCleanup = () => {
		brainRender = null;
	};
	state.brainStats = await api.brain.stats();
	brainRender();
	const reindex = el('button', 'btn small', 'Reindexar agora');
	reindex.onclick = () => api.brain.reindex();
	const ask = el('button', 'btn small', 'Perguntar ao cérebro (Ctrl+J)');
	ask.onclick = brainSearch;
	const row = el('div', 'inline-form');
	row.append(reindex, ask);
	body.append(row);

	body.append(el('div', 'settings-section', 'Conectar ao Claude Code'));
	body.append(
		el(
			'div',
			'setting-hint about',
			'Depois de conectar, o Claude ganha as ferramentas: search (busca no cérebro), read_note, list_notes, recent_changes, write_note e vault_info. Em vaults de equipe, o que o Claude escrever chega na hora para os parceiros. Reinicie o Claude Code depois de conectar.',
		),
	);
	const { command } = await api.claude.info();
	const cmd = el('pre', 'command-box', command);
	const copy = el('button', 'btn small', 'Copiar comando');
	copy.onclick = async () => {
		await navigator.clipboard.writeText(command);
		copy.textContent = 'Copiado!';
	};
	const register = el('button', 'btn small cta', 'Conectar automaticamente');
	const output = el('pre', 'command-output');
	output.hidden = true;
	register.onclick = async () => {
		register.disabled = true;
		register.textContent = 'Conectando…';
		const result = await api.claude.register();
		output.hidden = false;
		output.textContent = (result.ok ? '✔ Conectado! Reinicie o Claude Code.\n\n' : '✖ Não foi possível conectar.\n\n') + result.output;
		register.disabled = false;
		register.textContent = 'Conectar automaticamente';
	};
	const actions = el('div', 'inline-form');
	actions.append(register, copy);
	body.append(cmd, actions, output);

	const buttons = el('div', 'modal-buttons');
	const close = el('button', 'btn', 'Fechar');
	close.onclick = () => closeModal();
	buttons.append(close);
	box.append(buttons);
}

/* ---------- comandos ---------- */

function quickSwitcher() {
	openListModal({
		placeholder: 'Nome da nota…',
		footer: 'Enter abre · Ctrl+Enter em nova aba · Shift+Enter cria',
		getItems: (q) => {
			const rank = new Map(state.recent.map((p, i) => [p, i]));
			return notes()
				.map((f) => {
					const aliases = index.meta.get(f.path)?.aliases ?? [];
					const score = Math.max(fuzzyScore(q, noteName(f.path)), ...aliases.map((a) => fuzzyScore(q, a) - 1));
					return { f, score };
				})
				.filter((x) => x.score >= 0)
				.sort((a, b) =>
					q.trim()
						? b.score - a.score
						: (rank.get(a.f.path) ?? 1e9) - (rank.get(b.f.path) ?? 1e9) || (b.f.mtime ?? 0) - (a.f.mtime ?? 0),
				)
				.slice(0, 80)
				.map(({ f }) => ({
					label: noteName(f.path),
					detail: dirname(f.path),
					run: () => open(f.path),
					runNewTab: () => open(f.path, { newTab: true }),
				}));
		},
		onCreate: async (query) => {
			const name = sanitizeName(query);
			if (!name) return;
			const path = index.resolve(name) ?? (await createNoteAt(uniqueNotePath(state.settings.newNoteFolder.trim(), name)));
			if (path) await open(path);
		},
		emptyText: (q) => (q ? `Shift+Enter (ou Enter) para criar "${q}"` : 'Nenhuma nota no vault'),
	});
}

function commandPalette() {
	openListModal({
		placeholder: 'Digite um comando…',
		getItems: (q) =>
			COMMANDS.filter((c) => !c.hidden)
				.map((c) => ({ c, score: fuzzyScore(q, c.label) }))
				.filter((x) => x.score >= 0)
				.sort((a, b) => b.score - a.score)
				.map(({ c }) => ({ label: c.label, hotkey: c.hotkey, run: () => runCommand(c.id) })),
	});
}

function showGraph(local = false) {
	const { nodes, links } = index.graph(notes());
	const close = openGraph($('#modal-root'), {
		nodes,
		links,
		current: currentPath(),
		local,
		onOpen: (node) => (node.kind === 'ghost' ? openLink(node.label, currentPath()) : open(node.id)),
		onClose: () => {
			if (state.modalCleanup === close) state.modalCleanup = null;
		},
	});
	state.modalCleanup = close;
}

async function chooseVault() {
	await saveAll();
	const info = await api.choose();
	if (info) {
		setSearch('', false);
		await loadVault();
	}
}

function noteMenu() {
	const p = currentPath();
	if (!p) return;
	const r = $('#btn-more').getBoundingClientRect();
	showContextMenu(r.left, r.bottom + 4, [
		...fileMenuItems(p, 'file').filter((i) => i === '-' || !/nova aba/i.test(i.label)),
		'-',
		{ label: 'Exportar para PDF', run: exportPdf },
		{ label: 'Revelar no explorador', run: () => revealInTree(p) },
		{ label: 'Grafo local', run: () => showGraph(true) },
	]);
}

// Comandos que mexem no texto exigem uma nota aberta em modo edição.
const inEditor = (fn) => () => {
	if (!currentPath()) return;
	ensureEditMode();
	fn();
};

const COMMANDS = [
	{ id: 'new-note', label: 'Nova nota', hotkey: 'Ctrl+N', run: () => createNote() },
	{ id: 'new-briefing', label: 'Novo briefing', hotkey: 'Ctrl+Shift+B', run: newBriefing },
	{ id: 'new-from-template', label: 'Nova nota a partir de modelo', hotkey: 'Ctrl+Shift+N', run: () => newFromTemplate() },
	{ id: 'insert-template', label: 'Inserir modelo na nota', hotkey: 'Ctrl+Shift+T', run: insertTemplate },
	{ id: 'daily', label: 'Abrir nota diária de hoje', hotkey: 'Ctrl+Shift+D', run: () => openDailyNote() },
	{ id: 'new-folder', label: 'Nova pasta', run: () => createFolder() },
	{ id: 'new-tab', label: 'Nova aba', hotkey: 'Ctrl+T', run: newTab },
	{ id: 'close-tab', label: 'Fechar aba', hotkey: 'Ctrl+W', run: () => closeTab() },
	{ id: 'next-tab', label: 'Próxima aba', hotkey: 'Ctrl+Tab', run: () => cycleTab(1) },
	{ id: 'prev-tab', label: 'Aba anterior', hotkey: 'Ctrl+Shift+Tab', run: () => cycleTab(-1) },
	{ id: 'quick-open', label: 'Abrir nota rápida', hotkey: 'Ctrl+O', run: quickSwitcher },
	{ id: 'palette', label: 'Paleta de comandos', hotkey: 'Ctrl+P', run: commandPalette },
	{ id: 'search', label: 'Buscar no vault', hotkey: 'Ctrl+Shift+F', run: focusSearch },
	{ id: 'graph', label: 'Abrir grafo', hotkey: 'Ctrl+G', run: () => showGraph(false) },
	{ id: 'local-graph', label: 'Abrir grafo local da nota', hotkey: 'Ctrl+Shift+G', run: () => showGraph(true) },
	{ id: 'toggle-mode', label: 'Alternar leitura / edição', hotkey: 'Ctrl+E', run: toggleMode },
	{
		id: 'toggle-live-preview',
		label: 'Ativar/desativar Live Preview',
		run: () => {
			state.settings.livePreview = !state.settings.livePreview;
			applySettings();
			saveSettings();
			updateStatus(`Live Preview ${state.settings.livePreview ? 'ligado' : 'desligado'}`);
		},
	},
	{ id: 'settings', label: 'Configurações', hotkey: 'Ctrl+,', run: openSettings },
	{ id: 'rename', label: 'Renomear nota', hotkey: 'F2', run: focusTitle },
	{ id: 'duplicate', label: 'Duplicar nota', run: () => duplicateNote() },
	{ id: 'move', label: 'Mover nota para…', run: () => moveNote() },
	{ id: 'delete', label: 'Excluir nota', run: () => currentPath() && deletePath(currentPath(), 'file') },
	{ id: 'copy-link', label: 'Copiar link da nota', run: () => copyLink() },
	{ id: 'favorite', label: 'Favoritar / desfavoritar nota', run: () => toggleFavorite() },
	{ id: 'history', label: 'Histórico de versões da nota', run: () => showHistory() },
	{ id: 'export-pdf', label: 'Exportar nota para PDF', run: exportPdf },
	{ id: 'random', label: 'Abrir nota aleatória', run: randomNote },
	{ id: 'reveal', label: 'Revelar nota no explorador', run: () => revealInTree() },
	{ id: 'show-in-explorer', label: 'Mostrar nota no Explorer do Windows', run: () => currentPath() && api.showInFolder(currentPath()) },
	{ id: 'bold', label: 'Negrito', hotkey: 'Ctrl+B', run: inEditor(() => editor.run('bold')) },
	{ id: 'italic', label: 'Itálico', hotkey: 'Ctrl+I', run: inEditor(() => editor.run('italic')) },
	{ id: 'strike', label: 'Tachado', hotkey: 'Ctrl+Shift+X', run: inEditor(() => editor.run('strike')) },
	{ id: 'highlight', label: 'Destacar texto', hotkey: 'Ctrl+Shift+H', run: inEditor(() => editor.run('highlight')) },
	{ id: 'code', label: 'Código inline', hotkey: 'Ctrl+`', run: inEditor(() => editor.run('code')) },
	{ id: 'link', label: 'Inserir link Markdown', hotkey: 'Ctrl+K', run: inEditor(() => editor.run('link')) },
	{ id: 'task', label: 'Alternar tarefa', hotkey: 'Ctrl+L', run: inEditor(() => editor.run('task')) },
	{ id: 'h1', label: 'Transformar em título 1', run: inEditor(() => editor.setHeading(1)) },
	{ id: 'h2', label: 'Transformar em título 2', run: inEditor(() => editor.setHeading(2)) },
	{ id: 'h3', label: 'Transformar em título 3', run: inEditor(() => editor.setHeading(3)) },
	{ id: 'h0', label: 'Remover título (texto normal)', run: inEditor(() => editor.setHeading(0)) },
	{ id: 'insert-date', label: 'Inserir data de hoje', run: inEditor(() => editor.insert(todayStamp())) },
	{ id: 'insert-time', label: 'Inserir hora atual', run: inEditor(() => editor.insert(formatDate(new Date(), 'HH:mm'))) },
	{ id: 'back', label: 'Voltar', hotkey: 'Ctrl+Alt+←', run: back },
	{ id: 'forward', label: 'Avançar', hotkey: 'Ctrl+Alt+→', run: forward },
	{ id: 'save', label: 'Salvar agora', hotkey: 'Ctrl+S', run: saveAll },
	{ id: 'toggle-left', label: 'Mostrar/ocultar painel esquerdo', hotkey: 'Ctrl+\\', run: () => toggleSidebar('left') },
	{ id: 'toggle-right', label: 'Mostrar/ocultar painel direito', hotkey: 'Ctrl+Shift+\\', run: () => toggleSidebar('right') },
	{ id: 'focus', label: 'Modo foco', hotkey: 'Ctrl+Shift+Enter', run: toggleFocus },
	{ id: 'brain-search', label: 'Perguntar ao segundo cérebro (busca por significado)', hotkey: 'Ctrl+J', run: brainSearch },
	{ id: 'brain', label: 'Segundo cérebro e conexão com o Claude', run: openBrain },
	{ id: 'teams', label: 'Equipes e sincronização P2P', hotkey: 'Ctrl+Shift+E', run: openTeams },
	{ id: 'open-vault', label: 'Abrir outro vault…', run: chooseVault },
	{ id: 'reveal-vault', label: 'Mostrar vault no Explorer', run: () => api.revealVault() },
];

const HOTKEYS = {
	'ctrl+n': 'new-note',
	'ctrl+shift+b': 'new-briefing',
	'ctrl+shift+n': 'new-from-template',
	'ctrl+shift+t': 'insert-template',
	'ctrl+shift+d': 'daily',
	'ctrl+t': 'new-tab',
	'ctrl+w': 'close-tab',
	'ctrl+tab': 'next-tab',
	'ctrl+shift+tab': 'prev-tab',
	'ctrl+o': 'quick-open',
	'ctrl+p': 'palette',
	'ctrl+shift+f': 'search',
	'ctrl+g': 'graph',
	'ctrl+shift+g': 'local-graph',
	'ctrl+e': 'toggle-mode',
	'ctrl+,': 'settings',
	'ctrl+s': 'save',
	f2: 'rename',
	// Alt+setas fica livre para o editor (pular palavras no macOS, seleção por sintaxe)
	'ctrl+alt+arrowleft': 'back',
	'ctrl+alt+arrowright': 'forward',
	'ctrl+\\': 'toggle-left',
	'ctrl+shift+\\': 'toggle-right',
	'ctrl+shift+|': 'toggle-right',
	'ctrl+shift+enter': 'focus',
	'ctrl+j': 'brain-search',
	'ctrl+shift+e': 'teams',
};

function runCommand(id) {
	const cmd = COMMANDS.find((c) => c.id === id);
	if (!cmd) return;
	hideContextMenu();
	if (!['new-tab'].includes(id) && $('#modal-root').children.length) closeModal();
	Promise.resolve(cmd.run()).catch((err) => {
		console.error(err);
		alertModal(err.message);
	});
}

window.addEventListener(
	'keydown',
	(e) => {
		if (e.key === 'Escape') {
			hideContextMenu();
			hideHover();
			if ($('#modal-root').children.length) {
				e.preventDefault();
				closeModal();
			} else if (state.layout.focus) {
				toggleFocus();
			}
			return;
		}
		const combo = [e.ctrlKey || e.metaKey ? 'ctrl' : null, e.shiftKey ? 'shift' : null, e.altKey ? 'alt' : null, e.key.toLowerCase()]
			.filter(Boolean)
			.join('+');
		const id = HOTKEYS[combo];
		if (!id) return;
		e.preventDefault();
		e.stopPropagation();
		runCommand(id);
	},
	true,
);

/* ---------- mudanças externas no disco ---------- */

const changedPaths = new Set();

const processChanges = debounce(async () => {
	if (state.busy) return processChanges();
	const changed = [...changedPaths];
	changedPaths.clear();
	state.files = await api.list();
	index.setFiles(state.files);
	const present = new Set(state.files.map((f) => f.path));
	for (const p of [...state.contents.keys()]) {
		if (!present.has(p)) {
			state.contents.delete(p);
			index.delete(p);
			state.dirtyPaths.delete(p);
		}
	}
	const toRead = new Set(changed.filter((p) => isNote(p) && present.has(p)));
	for (const f of notes()) if (!state.contents.has(f.path)) toRead.add(f.path);
	for (const p of toRead) {
		if (state.dirtyPaths.has(p)) continue;
		let text;
		try {
			text = await api.read(p);
		} catch {
			continue;
		}
		if (state.contents.get(p) !== text) await setNoteContent(p, text, { save: false });
	}
	const activeTab = cur();
	const before = state.tabs.length;
	state.tabs = state.tabs.filter((t) => !t.path || present.has(t.path));
	renderTree();
	renderFavorites();
	if (state.tabs.length !== before) {
		state.active = state.tabs.indexOf(activeTab);
		if (state.active < 0) {
			state.active = state.tabs.length - 1;
			showActiveTab();
		} else {
			renderTabs();
		}
	}
	renderSide();
	updateStatus();
	if ($('#search').value.trim()) runSearch($('#search').value);
}, 250);

/* ---------- ligações da interface ---------- */

function setupUi() {
	setupFileList($('#tree'));
	setupFileList($('#favorites-list'));
	setupTreeDrop();
	setupHoverPreviews();
	setupResizer($('#resize-left'), 'left');
	setupResizer($('#resize-right'), 'right');

	$('#btn-new-note').onclick = () => createNote();
	$('#btn-new-briefing').onclick = newBriefing;
	$('#btn-new-folder').onclick = () => createFolder();
	$('#btn-graph').onclick = () => showGraph(false);
	$('#btn-settings').onclick = openSettings;
	$('#btn-open-vault').onclick = chooseVault;
	$('#btn-mode').onclick = toggleMode;
	$('#btn-back').onclick = back;
	$('#btn-fwd').onclick = forward;
	$('#btn-star').onclick = () => toggleFavorite();
	$('#btn-more').onclick = noteMenu;
	$('#btn-new-tab').onclick = newTab;
	$('#btn-toggle-left').onclick = () => toggleSidebar('left');
	$('#btn-toggle-right').onclick = () => toggleSidebar('right');
	$('#btn-focus').onclick = toggleFocus;
	$('#empty-new').onclick = () => createNote();
	$('#empty-briefing').onclick = newBriefing;
	$('#empty-open').onclick = quickSwitcher;
	$('#favorites-toggle').onclick = () => $('#favorites').classList.toggle('collapsed');

	// arrastar nota do explorador para a barra de abas abre em nova aba
	const tabbar = $('#tabbar');
	tabbar.addEventListener('dragover', (e) => {
		if (e.dataTransfer.types.includes('text/briefing-path')) e.preventDefault();
	});
	tabbar.addEventListener('drop', (e) => {
		const raw = e.dataTransfer.getData('text/briefing-path');
		if (!raw) return;
		e.preventDefault();
		const { path, type } = JSON.parse(raw);
		if (type === 'file') open(path, { newTab: true });
	});
	tabbar.addEventListener('dblclick', (e) => {
		if (e.target === tabbar || e.target.id === 'tabbar-tabs') newTab();
	});

	const search = $('#search');
	const debouncedSearch = debounce(() => runSearch(search.value), 150);
	search.addEventListener('input', debouncedSearch);
	search.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') {
			e.stopPropagation();
			setSearch('', false);
			search.blur();
		}
	});

	const title = $('#title');
	title.addEventListener('keydown', (e) => {
		if (e.key === 'Enter' || e.key === 'ArrowDown') {
			e.preventDefault();
			editor.focus();
		} else if (e.key === 'Escape') {
			title.value = noteName(currentPath() ?? '');
			editor.focus();
		}
	});
	title.addEventListener('blur', () => commitTitle());

	const tabs = $('#right .tabs');
	for (const [key, label] of SIDE_TABS) {
		const b = el('button', null, label);
		b.dataset.tab = key;
		b.onclick = () => {
			state.sideTab = key;
			renderSide();
		};
		tabs.append(b);
	}

	$('#reader').addEventListener('click', (e) => {
		const a = e.target.closest('a');
		if (a) {
			e.preventDefault();
			if (a.classList.contains('internal-link')) openLink(a.dataset.href, currentPath(), { newTab: e.ctrlKey });
			else if (a.classList.contains('tag')) setSearch(`#${a.dataset.tag}`);
			else if (/^(https?|mailto):/i.test(a.getAttribute('href') ?? '')) api.openExternal(a.getAttribute('href'));
			return;
		}
		const box = e.target.closest('input.task-checkbox');
		if (box && !box.disabled) toggleTaskAt(currentPath(), Number(box.dataset.line));
		const img = e.target.closest('img.embed-image');
		if (img) {
			const path = decodeURIComponent(new URL(img.src).pathname.slice(1));
			showImage(path);
		}
	});
	$('#reader').addEventListener('dblclick', (e) => {
		if (!e.target.closest('a, input, img')) toggleMode();
	});

	document.addEventListener('mousedown', (e) => {
		if (!e.target.closest('.context-menu')) hideContextMenu();
	});
	window.addEventListener('resize', debounce(applyLayout, 100));

	api.onChanged((paths) => {
		for (const p of paths) changedPaths.add(p);
		processChanges();
	});
	api.onMenu((cmd) => runCommand(cmd));

	$('#btn-teams').onclick = openTeams;
	$('#btn-brain').onclick = openBrain;
	api.on('teams:changed', onTeamsChanged);
	api.on('teams:event', (ev) => updateStatus(`${ev.team}: ${ev.text}`));
	api.on('brain:stats', onBrainStats);
	api.on('brain:progress', (p) => updateStatus(`Cérebro: vetorizando ${p.name} · ${p.done}/${p.total} trechos`));
	api.teams.info().then(onTeamsChanged);

	window.addEventListener('beforeunload', () => {
		for (const p of state.dirtyPaths) api.writeSync(p, state.contents.get(p));
	});
}

setupUi();
loadVault().catch((err) => {
	console.error(err);
	alertModal(`Falha ao abrir o vault: ${err.message}`);
});
