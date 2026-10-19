// Grafo de notas: simulação de forças (d3-force) desenhada em <canvas>.
// - painel lateral mostra a nota clicada sem sair do grafo;
// - painel ⚙ com filtros, grupos de cores, exibição e forças (salvo neste computador).
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, forceX, forceY } from 'd3-force';

const idOf = (x) => (typeof x === 'object' ? x.id : x);
const folderOf = (id) => (id.includes('/') ? id.slice(0, id.indexOf('/')) : '');
// Cores por pasta de primeiro nível (legíveis no tema claro e no escuro).
const PALETTE = ['#5aa9e6', '#7bc47f', '#c678dd', '#e06c75', '#56b6c2', '#d19a66', '#a0a8ff', '#e5c07b'];
const PANEL_KEY = 'briefing.graphPanelWidth';
const SETTINGS_KEY = 'briefing.graphSettings';

const DEFAULTS = {
	// filtros
	showGhosts: false,
	showTags: false,
	showOrphans: true,
	// grupos: { query: 'tag:#cliente' | 'path:Projetos' | texto, color: '#rrggbb' }
	colorByFolder: true,
	groups: [],
	// exibição
	arrows: false,
	textFade: 0.7, // zoom a partir do qual todos os nomes aparecem
	labelSize: 12,
	nodeSize: 1,
	linkWidth: 1,
	// forças
	center: 0.06,
	repel: 120,
	linkForce: 0.4,
	linkDistance: 60,
	// seções abertas no painel ⚙
	open: { filters: true, groups: true, display: false, forces: false },
};

function loadSettings() {
	try {
		const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
		return { ...structuredClone(DEFAULTS), ...saved, open: { ...DEFAULTS.open, ...saved.open } };
	} catch {
		return structuredClone(DEFAULTS);
	}
}

function el(tag, className, text) {
	const node = document.createElement(tag);
	if (className) node.className = className;
	if (text != null) node.textContent = text;
	return node;
}

/** "tag:#cliente" / "#cliente", "path:Projetos", ou texto no nome da nota. */
function compileQuery(query, tagsOf) {
	const q = query.trim().toLowerCase();
	if (!q) return () => false;
	if (q.startsWith('path:')) {
		const p = q.slice(5).trim();
		return (n) => n.kind === 'note' && n.id.toLowerCase().includes(p);
	}
	if (q.startsWith('tag:') || q.startsWith('#')) {
		const t = q.replace(/^tag:/, '').trim().replace(/^#/, '');
		return (n) => (n.kind === 'tag' ? n.tag === t : n.kind === 'note' && tagsOf(n.id).some((x) => x === t || x.startsWith(t + '/')));
	}
	const text = q.replace(/^file:/, '').trim();
	return (n) => n.label.toLowerCase().includes(text);
}

/**
 * @param {HTMLElement} root
 * @param {object} o
 * @param {Array} o.nodes  { id, label, kind: 'note' | 'ghost' }
 * @param {Array} o.links  { source, target }
 * @param {(node, opts: { newTab: boolean }) => void} o.onOpen  abre a nota no editor (o grafo fecha antes)
 * @param {(tag: string) => void} o.onTag  busca a tag no vault (o grafo fecha antes)
 * @param {(path: string) => string} o.renderNote  HTML da nota para o painel
 * @param {(href: string, from: string) => string|null} o.resolveLink
 * @param {(path: string) => { tags: string[], backlinks: number, outgoing: number }} o.noteInfo
 * @param {(path: string) => string[]} o.tagsOf  tags da nota, em minúsculas
 * @param {(url: string) => void} o.openExternal
 */
export function openGraph(root, o) {
	const { nodes, links, current, onOpen, onTag, onClose, renderNote, resolveLink, noteInfo, tagsOf, openExternal } = o;
	const S = loadSettings();
	let saveTimer = null;
	const save = () => {
		clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			try {
				localStorage.setItem(SETTINGS_KEY, JSON.stringify(S));
			} catch {}
		}, 300);
	};

	const backdrop = el('div', 'modal-backdrop');
	const box = el('div', 'graph-box');
	const noteCount = nodes.filter((n) => n.kind === 'note').length;
	const noteLinks = links.filter((l) => !String(l.target).startsWith('?')).length;

	const header = el('div', 'graph-header');
	header.innerHTML = `<span class="graph-title">Grafo · ${noteCount} notas · ${noteLinks} conexões</span>
		<span class="graph-count muted"></span>
		<input class="graph-filter" type="search" placeholder="Buscar nota… (Enter)" spellcheck="false">
		<label title="Mostrar só a nota em foco e suas conexões"><input type="checkbox" class="local"> local</label>
		<button class="icon-btn settings-btn" title="Filtros, grupos, exibição e forças">⚙</button>
		<button class="icon-btn close" title="Fechar (Esc)">✕</button>`;

	const body = el('div', 'graph-body');
	const stage = el('div', 'graph-stage');
	const canvas = document.createElement('canvas');
	const controls = el('div', 'graph-controls');
	const zoomIn = el('button', 'graph-ctl', '+');
	const zoomOut = el('button', 'graph-ctl', '−');
	const fitBtn = el('button', 'graph-ctl', '⤢');
	zoomIn.title = 'Aproximar';
	zoomOut.title = 'Afastar';
	fitBtn.title = 'Enquadrar tudo';
	controls.append(zoomIn, zoomOut, fitBtn);
	const legend = el('div', 'graph-legend');
	const hint = el('div', 'graph-hint', 'Clique para ver · duplo clique para abrir · arraste para mover');
	const settingsBox = el('div', 'graph-settings');
	settingsBox.hidden = true;
	stage.append(canvas, controls, legend, hint, settingsBox);

	const resizer = el('div', 'graph-resizer');
	const panel = el('aside', 'graph-panel');
	resizer.hidden = panel.hidden = true;
	let panelWidth = 440;
	try {
		panelWidth = Number(localStorage.getItem(PANEL_KEY)) || panelWidth;
	} catch {}
	panel.style.width = `${panelWidth}px`;

	body.append(stage, resizer, panel);
	box.append(header, body);
	backdrop.append(box);
	root.append(backdrop);

	const ctx = canvas.getContext('2d');
	const css = getComputedStyle(document.documentElement);
	const color = (name) => css.getPropertyValue(name).trim();
	const colors = {
		bg: color('--bg'),
		node: color('--graph-node'),
		ghost: color('--text-faint'),
		accent: color('--accent'),
		link: color('--graph-link'),
		text: color('--text-muted'),
		heading: color('--heading'),
		hl: color('--link'),
		tag: color('--success'),
	};

	// ---------- dados ----------
	const folders = new Map(); // pasta -> { color, count }
	for (const n of nodes) {
		const f = n.kind === 'note' ? folderOf(n.id) : '';
		if (!f) continue;
		if (!folders.has(f)) folders.set(f, { count: 0 });
		folders.get(f).count++;
	}
	[...folders.keys()]
		.sort((a, b) => folders.get(b).count - folders.get(a).count)
		.forEach((f, i) => (folders.get(f).color = PALETTE[i % PALETTE.length]));

	let allNodes = [];
	let allLinks = [];
	let byId = new Map();

	// Monta nós e ligações (com tags como nós, se ligado). Mantém as posições já calculadas.
	function buildData() {
		const prev = byId;
		const keep = (n) => {
			const old = prev.get(n.id);
			return old ? Object.assign(n, { x: old.x, y: old.y, vx: old.vx, vy: old.vy }) : n;
		};
		allNodes = nodes.map((n) => keep({ ...n, deg: 0, folder: n.kind === 'note' ? folderOf(n.id) : '' }));
		allLinks = links.map((l) => ({ source: l.source, target: l.target }));
		if (S.showTags) {
			const tagNodes = new Map();
			for (const n of nodes) {
				if (n.kind !== 'note') continue;
				for (const t of tagsOf(n.id)) {
					const id = '#' + t;
					if (!tagNodes.has(id)) tagNodes.set(id, keep({ id, label: '#' + t, tag: t, kind: 'tag', deg: 0, folder: '' }));
					allLinks.push({ source: n.id, target: id, tagLink: true });
				}
			}
			allNodes.push(...tagNodes.values());
		}
		byId = new Map(allNodes.map((n) => [n.id, n]));
		for (const l of allLinks) {
			byId.get(l.source).deg++;
			byId.get(l.target).deg++;
		}
		applyGroups();
	}

	// Cor de cada nó: grupo do usuário > pasta > padrão.
	function applyGroups() {
		const rules = S.groups.filter((g) => g.query.trim()).map((g) => ({ test: compileQuery(g.query, tagsOf), color: g.color }));
		for (const n of allNodes) {
			n.color = null;
			for (const r of rules) {
				if (r.test(n)) {
					n.color = r.color;
					break;
				}
			}
		}
	}
	const fillOf = (n) => {
		if (n.kind === 'ghost') return colors.ghost;
		if (n.color) return n.color;
		if (n.kind === 'tag') return colors.tag;
		return (S.colorByFolder && folders.get(n.folder)?.color) || colors.node;
	};
	const radius = (n) => (n.kind === 'tag' ? 3 + Math.sqrt(n.deg) * 1.2 : 4 + Math.sqrt(n.deg) * 2) * S.nodeSize;

	let localOnly = false;
	let localRoot = current;
	let filter = '';
	let legendFilter = null; // { key, test }
	let visNodes = [];
	let visLinks = [];
	let neighbors = new Map();
	let hover = null;
	let selected = null;

	// Grafos pequenos ganham mais espaço entre os nós para os nomes não se sobreporem.
	const spread = noteCount < 40 ? 1.8 : noteCount < 150 ? 1.3 : 1;
	const sim = forceSimulation()
		.force('charge', forceManyBody())
		.force('link', forceLink().id((d) => d.id))
		.force('center', forceCenter(0, 0))
		.force('collide', forceCollide((d) => radius(d) + 4))
		// gravidade: mantém notas soltas perto do centro
		.force('x', forceX(0))
		.force('y', forceY(0))
		.stop()
		.on('tick', draw);

	function applyForces() {
		sim.force('charge').strength(-S.repel * spread).distanceMax(450 * spread);
		sim.force('link').distance((l) => (l.tagLink ? 0.7 : 1) * S.linkDistance * spread).strength(S.linkForce);
		sim.force('x').strength(S.center);
		sim.force('y').strength(S.center);
		sim.force('collide').radius((d) => radius(d) + 4);
	}

	function rebuild({ settle = false, refit = true } = {}) {
		visNodes = allNodes.filter((n) => n.kind === 'note' || (n.kind === 'ghost' && S.showGhosts) || (n.kind === 'tag' && S.showTags));
		if (localOnly && localRoot) {
			// nota em foco + vizinhos até 2 saltos
			const keepIds = new Set([localRoot]);
			for (let depth = 0; depth < 2; depth++) {
				for (const l of allLinks) {
					const a = idOf(l.source);
					const b = idOf(l.target);
					if (keepIds.has(a) || keepIds.has(b)) {
						keepIds.add(a);
						keepIds.add(b);
					}
				}
			}
			visNodes = visNodes.filter((n) => keepIds.has(n.id));
		}
		let ids = new Set(visNodes.map((n) => n.id));
		visLinks = allLinks.filter((l) => ids.has(idOf(l.source)) && ids.has(idOf(l.target)));
		if (!S.showOrphans) {
			const linked = new Set(visLinks.flatMap((l) => [idOf(l.source), idOf(l.target)]));
			visNodes = visNodes.filter((n) => linked.has(n.id) || n === selected);
			ids = new Set(visNodes.map((n) => n.id));
		}
		neighbors = new Map();
		const link = (a, b) => {
			if (!neighbors.has(a)) neighbors.set(a, new Set());
			neighbors.get(a).add(b);
		};
		for (const l of visLinks) {
			link(idOf(l.source), idOf(l.target));
			link(idOf(l.target), idOf(l.source));
		}
		applyForces();
		sim.nodes(visNodes);
		sim.force('link').links(visLinks);
		if (settle) {
			// Já abre arrumado (sem a "explosão" inicial) e enquadrado.
			sim.alpha(1);
			for (let i = 0; i < 160; i++) sim.tick();
			fit(false);
			sim.alpha(0.08).restart();
		} else {
			sim.alpha(0.6).restart();
			if (refit) setTimeout(() => fit(true), 700);
		}
		renderLegend();
	}

	// ---------- câmera ----------
	let W = 0;
	let H = 0;
	let dpr = 1;
	const view = { x: 0, y: 0, k: 1 };
	let anim = null;

	function resize() {
		const r = canvas.getBoundingClientRect();
		dpr = window.devicePixelRatio || 1;
		W = r.width;
		H = r.height;
		canvas.width = Math.round(W * dpr);
		canvas.height = Math.round(H * dpr);
		draw();
	}
	const ro = new ResizeObserver(resize);
	ro.observe(canvas);

	function animateTo(target, ms = 420) {
		cancelAnimationFrame(anim);
		const from = { ...view };
		const t0 = performance.now();
		const step = (now) => {
			const p = Math.min(1, (now - t0) / ms);
			const e = 1 - (1 - p) ** 3;
			view.x = from.x + (target.x - from.x) * e;
			view.y = from.y + (target.y - from.y) * e;
			view.k = from.k + (target.k - from.k) * e;
			draw();
			if (p < 1) anim = requestAnimationFrame(step);
		};
		anim = requestAnimationFrame(step);
	}

	function fit(animated = true) {
		if (!visNodes.length || !W) return;
		let x0 = Infinity;
		let y0 = Infinity;
		let x1 = -Infinity;
		let y1 = -Infinity;
		for (const n of visNodes) {
			const r = radius(n);
			x0 = Math.min(x0, n.x - r);
			y0 = Math.min(y0, n.y - r);
			x1 = Math.max(x1, n.x + r);
			y1 = Math.max(y1, n.y + r + 16);
		}
		const k = Math.min(2.2, Math.max(0.15, Math.min(W / (x1 - x0 + 120), H / (y1 - y0 + 120))));
		const target = { k, x: -((x0 + x1) / 2) * k, y: -((y0 + y1) / 2) * k };
		if (animated) animateTo(target);
		else Object.assign(view, target);
		draw();
	}

	function centerOn(node, k = Math.max(view.k, 1.2)) {
		animateTo({ k, x: -node.x * k, y: -node.y * k });
	}

	function zoomBy(factor) {
		const k = Math.min(4, Math.max(0.15, view.k * factor));
		animateTo({ k, x: (view.x / view.k) * k, y: (view.y / view.k) * k }, 200);
	}

	const toWorld = (sx, sy) => ({ x: (sx - W / 2 - view.x) / view.k, y: (sy - H / 2 - view.y) / view.k });
	const local = (e) => {
		const r = canvas.getBoundingClientRect();
		return [e.clientX - r.left, e.clientY - r.top];
	};

	function hit(sx, sy) {
		const p = toWorld(sx, sy);
		let best = null;
		let bestDist = Infinity;
		for (const n of visNodes) {
			const d = Math.hypot(n.x - p.x, n.y - p.y);
			if (d < radius(n) + 6 / view.k && d < bestDist) {
				best = n;
				bestDist = d;
			}
		}
		return best;
	}

	// ---------- desenho ----------
	const matches = (n) => filter && n.label.toLowerCase().includes(filter);

	function drawArrow(from, to, r) {
		const dx = to.x - from.x;
		const dy = to.y - from.y;
		const len = Math.hypot(dx, dy) || 1;
		const ux = dx / len;
		const uy = dy / len;
		const tipX = to.x - ux * (r + 1.5 / view.k);
		const tipY = to.y - uy * (r + 1.5 / view.k);
		const size = (4 + S.linkWidth * 1.5) / view.k;
		ctx.beginPath();
		ctx.moveTo(tipX, tipY);
		ctx.lineTo(tipX - ux * size - uy * size * 0.55, tipY - uy * size + ux * size * 0.55);
		ctx.lineTo(tipX - ux * size + uy * size * 0.55, tipY - uy * size - ux * size * 0.55);
		ctx.closePath();
		ctx.fill();
	}

	function draw() {
		if (!W) return;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, W, H);
		ctx.translate(W / 2 + view.x, H / 2 + view.y);
		ctx.scale(view.k, view.k);

		const focus = hover ?? selected;
		const nb = focus ? neighbors.get(focus.id) ?? new Set() : null;
		const dimmed = (n) =>
			(focus && n !== focus && !nb.has(n.id)) || (!focus && filter && !matches(n)) || (!focus && legendFilter && !legendFilter.test(n));

		// ligações
		for (const l of visLinks) {
			const lit = focus && (l.source === focus || l.target === focus);
			const dim = focus ? !lit : legendFilter ? !(legendFilter.test(l.source) && legendFilter.test(l.target)) : false;
			ctx.strokeStyle = ctx.fillStyle = lit ? colors.hl : colors.link;
			ctx.lineWidth = ((lit ? 1.8 : 1) * S.linkWidth) / view.k;
			ctx.globalAlpha = dim ? 0.12 : lit ? 0.95 : 0.75;
			if (l.tagLink) ctx.setLineDash([3 / view.k, 3 / view.k]);
			ctx.beginPath();
			ctx.moveTo(l.source.x, l.source.y);
			ctx.lineTo(l.target.x, l.target.y);
			ctx.stroke();
			ctx.setLineDash([]);
			if (S.arrows && !l.tagLink) drawArrow(l.source, l.target, radius(l.target));
		}

		// nós
		for (const n of visNodes) {
			const dim = dimmed(n);
			const big = n === hover || n === selected;
			const r = radius(n) * (big ? 1.25 : 1);
			const fill = matches(n) && !focus ? colors.hl : fillOf(n);
			ctx.globalAlpha = dim ? 0.15 : 1;
			if (big && !dim) {
				ctx.shadowColor = fill;
				ctx.shadowBlur = n === selected ? 24 : 12;
			}
			ctx.beginPath();
			ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
			if (n.kind === 'ghost') {
				ctx.setLineDash([2 / view.k, 2 / view.k]);
				ctx.strokeStyle = fill;
				ctx.lineWidth = 1.2 / view.k;
				ctx.stroke();
				ctx.setLineDash([]);
			} else {
				ctx.fillStyle = fill;
				ctx.fill();
				// contorno na cor do fundo separa nós encostados
				ctx.shadowBlur = 0;
				ctx.strokeStyle = colors.bg;
				ctx.lineWidth = 1.5 / view.k;
				ctx.stroke();
			}
			ctx.shadowBlur = 0;
			// anel: nota aberta no editor (âmbar) e nota selecionada (claro)
			if (n.id === current || n === selected) {
				ctx.beginPath();
				ctx.arc(n.x, n.y, r + 3 / view.k, 0, Math.PI * 2);
				ctx.strokeStyle = n === selected ? colors.heading : colors.accent;
				ctx.lineWidth = 2 / view.k;
				ctx.stroke();
			}
		}

		// nomes: aparecem aos poucos conforme o zoom passa do limite escolhido
		const size = S.labelSize / Math.max(view.k, 0.6);
		ctx.font = `${size}px "Segoe UI", system-ui, sans-serif`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		ctx.lineJoin = 'round';
		const fade = visNodes.length < 25 ? 1 : Math.min(1, Math.max(0, (view.k - S.textFade) / 0.25 + 1));
		for (const n of visNodes) {
			const important = n === focus || n.id === current || (nb && nb.has(n.id)) || matches(n);
			const alpha = important ? 1 : fade;
			if (alpha <= 0.02) continue;
			ctx.globalAlpha = dimmed(n) ? Math.min(alpha, 0.2) : alpha;
			const y = n.y + radius(n) * 1.25 + 4 / view.k;
			ctx.strokeStyle = colors.bg;
			ctx.lineWidth = 3 / view.k;
			ctx.strokeText(n.label, n.x, y);
			ctx.fillStyle = n === focus ? colors.heading : n.kind === 'tag' ? fillOf(n) : colors.text;
			ctx.fillText(n.label, n.x, y);
		}
		ctx.globalAlpha = 1;
	}

	// ---------- legenda: grupos do usuário, ou pastas ----------
	function renderLegend() {
		legend.replaceChildren();
		const items = [];
		for (const g of S.groups.filter((x) => x.query.trim())) {
			items.push({ key: 'g:' + g.query, label: g.query, color: g.color, test: compileQuery(g.query, tagsOf) });
		}
		if (S.colorByFolder) {
			const visible = new Set(visNodes.map((n) => n.folder));
			for (const [name, info] of [...folders].sort((a, b) => b[1].count - a[1].count)) {
				if (visible.has(name)) items.push({ key: 'f:' + name, label: name, count: info.count, color: info.color, test: (n) => n.folder === name });
			}
		}
		if (legendFilter && !items.some((i) => i.key === legendFilter.key)) legendFilter = null;
		for (const it of items) {
			const item = el('button', `graph-legend-item${legendFilter?.key === it.key ? ' active' : ''}`);
			const dot = el('span', 'graph-dot');
			dot.style.background = it.color;
			item.append(dot, el('span', '', it.label));
			if (it.count != null) item.append(el('span', 'muted', String(it.count)));
			item.title = legendFilter?.key === it.key ? 'Mostrar tudo' : `Destacar ${it.label}`;
			item.onclick = () => {
				legendFilter = legendFilter?.key === it.key ? null : it;
				renderLegend();
				draw();
			};
			legend.append(item);
		}
	}

	// ---------- painel ⚙ (filtros, grupos, exibição, forças) ----------
	function renderSettings() {
		settingsBox.replaceChildren();
		const section = (key, title, build) => {
			const sec = el('div', `gs-section${S.open[key] ? ' open' : ''}`);
			const head = el('button', 'gs-head');
			head.append(el('span', 'gs-caret', '›'), el('span', '', title));
			head.onclick = () => {
				S.open[key] = !S.open[key];
				save();
				sec.classList.toggle('open', S.open[key]);
			};
			const content = el('div', 'gs-body');
			build(content);
			sec.append(head, content);
			settingsBox.append(sec);
		};
		const toggle = (parent, label, key, after) => {
			const row = el('label', 'gs-row');
			const input = el('input');
			input.type = 'checkbox';
			input.checked = !!S[key];
			input.onchange = () => {
				S[key] = input.checked;
				save();
				after();
			};
			row.append(el('span', '', label), input);
			parent.append(row);
		};
		const slider = (parent, label, key, min, max, step, after) => {
			const row = el('div', 'gs-slider');
			const top = el('div', 'gs-slider-top');
			const value = el('span', 'gs-value');
			const fmt = () => (value.textContent = Number(S[key]).toFixed(step < 1 ? (step < 0.1 ? 2 : 1) : 0));
			top.append(el('span', '', label), value);
			const input = el('input');
			Object.assign(input, { type: 'range', min, max, step, value: S[key] });
			input.oninput = () => {
				S[key] = Number(input.value);
				fmt();
				save();
				after();
			};
			fmt();
			row.append(top, input);
			parent.append(row);
		};
		const relayout = () => rebuild({ refit: false });
		const recolor = () => {
			applyGroups();
			renderLegend();
			draw();
		};

		section('filters', 'Filtros', (c) => {
			toggle(c, 'Tags como pontos', 'showTags', () => {
				buildData();
				rebuild();
			});
			toggle(c, 'Notas inexistentes', 'showGhosts', () => rebuild());
			toggle(c, 'Notas sem conexões', 'showOrphans', () => rebuild());
		});

		section('groups', 'Grupos', (c) => {
			toggle(c, 'Colorir por pasta', 'colorByFolder', recolor);
			c.append(el('div', 'gs-hint', 'Grupos pintam as notas que combinam com a busca: tag:#cliente, path:Projetos ou parte do nome.'));
			S.groups.forEach((g, i) => {
				const row = el('div', 'gs-group');
				const input = el('input', 'gs-query');
				input.value = g.query;
				input.placeholder = 'tag:#cliente';
				input.spellcheck = false;
				input.oninput = () => {
					g.query = input.value;
					save();
					recolor();
				};
				const pick = el('input', 'gs-color');
				pick.type = 'color';
				pick.value = g.color;
				pick.oninput = () => {
					g.color = pick.value;
					save();
					recolor();
				};
				const del = el('button', 'icon-btn', '✕');
				del.title = 'Remover grupo';
				del.onclick = () => {
					S.groups.splice(i, 1);
					save();
					recolor();
					renderSettings();
				};
				row.append(pick, input, del);
				c.append(row);
			});
			const add = el('button', 'btn small gs-add', 'Novo grupo');
			add.onclick = () => {
				S.groups.push({ query: '', color: PALETTE[S.groups.length % PALETTE.length] });
				save();
				renderSettings();
				settingsBox.querySelectorAll('.gs-query')[S.groups.length - 1]?.focus();
			};
			c.append(add);
		});

		section('display', 'Exibição', (c) => {
			toggle(c, 'Setas', 'arrows', draw);
			slider(c, 'Mostrar nomes a partir do zoom', 'textFade', 0.2, 2, 0.05, draw);
			slider(c, 'Tamanho dos nomes', 'labelSize', 8, 20, 1, draw);
			slider(c, 'Tamanho dos pontos', 'nodeSize', 0.4, 3, 0.1, () => {
				sim.force('collide').radius((d) => radius(d) + 4);
				sim.alpha(0.2).restart();
			});
			slider(c, 'Espessura das linhas', 'linkWidth', 0.3, 4, 0.1, draw);
		});

		section('forces', 'Forças', (c) => {
			slider(c, 'Força do centro', 'center', 0, 0.3, 0.01, relayout);
			slider(c, 'Repulsão', 'repel', 0, 500, 5, relayout);
			slider(c, 'Força das ligações', 'linkForce', 0, 1, 0.05, relayout);
			slider(c, 'Distância das ligações', 'linkDistance', 15, 250, 5, relayout);
		});

		const reset = el('button', 'btn small gs-reset', 'Restaurar padrão');
		reset.onclick = () => {
			const open = S.open;
			Object.assign(S, structuredClone(DEFAULTS), { open });
			save();
			buildData();
			rebuild();
			renderSettings();
		};
		settingsBox.append(reset);
	}

	const settingsBtn = header.querySelector('.settings-btn');
	settingsBtn.onclick = () => {
		settingsBox.hidden = !settingsBox.hidden;
		settingsBtn.classList.toggle('on', !settingsBox.hidden);
		if (!settingsBox.hidden) renderSettings();
	};

	// ---------- painel lateral ----------
	function showPanel(show) {
		panel.hidden = resizer.hidden = !show;
	}

	function select(node, { center = true } = {}) {
		selected = node;
		if (!node) {
			showPanel(false);
			draw();
			return;
		}
		hint.hidden = true; // quem já clicou não precisa mais da dica
		// Ao abrir o painel o canvas encolhe: centraliza para a nota não ficar escondida.
		const opening = panel.hidden;
		renderPanel(node);
		showPanel(true);
		panel.scrollTop = 0;
		requestAnimationFrame(() => (center || opening ? centerOn(node) : draw()));
	}

	function openNode(node, newTab = false) {
		close();
		if (node.kind === 'tag') onTag(node.tag);
		else onOpen(node, { newTab });
	}

	function renderPanel(node) {
		panel.replaceChildren();
		const head = el('div', 'graph-panel-head');
		const titles = el('div', 'graph-panel-titles');
		titles.append(el('div', 'graph-panel-title', node.label));
		const where = node.kind === 'note' ? (node.id.includes('/') ? node.id.slice(0, node.id.lastIndexOf('/')).split('/').join(' / ') : 'raiz do vault') : node.kind === 'tag' ? 'tag' : 'nota inexistente';
		titles.append(el('div', 'graph-panel-path', where));
		const x = el('button', 'icon-btn', '✕');
		x.title = 'Fechar painel (Esc)';
		x.onclick = () => select(null);
		head.append(titles, x);
		panel.append(head);

		const actions = el('div', 'graph-panel-actions');
		const button = (label, cls, fn, title) => {
			const b = el('button', cls, label);
			if (title) b.title = title;
			b.onclick = fn;
			actions.append(b);
		};
		if (node.kind === 'ghost') {
			button('Criar nota', 'btn cta', () => openNode(node));
		} else if (node.kind === 'tag') {
			button('Buscar no vault', 'btn cta', () => openNode(node), 'Lista todas as notas com esta tag');
		} else {
			button('Abrir nota', 'btn cta', () => openNode(node), 'Abrir no editor (duplo clique no grafo)');
			button('Nova aba', 'btn', () => openNode(node, true));
		}
		if (node.kind !== 'ghost') {
			button(localOnly && localRoot === node.id ? 'Ver grafo todo' : 'Focar conexões', 'btn', () => {
				const focusing = !(localOnly && localRoot === node.id);
				localOnly = focusing;
				localRoot = focusing ? node.id : current;
				header.querySelector('.local').checked = localOnly;
				rebuild();
				renderPanel(node);
			});
		}
		panel.append(actions);

		const nb = [...(neighbors.get(node.id) ?? [])].map((id) => byId.get(id)).filter(Boolean);
		if (node.kind === 'note') {
			const info = noteInfo(node.id);
			const meta = el('div', 'graph-panel-meta');
			meta.append(el('span', 'graph-chip', `${info.outgoing} links`), el('span', 'graph-chip', `${info.backlinks} backlinks`));
			for (const tag of info.tags.slice(0, 8)) meta.append(el('span', 'graph-chip tag', `#${tag}`));
			panel.append(meta);
		}

		if (nb.length) {
			panel.append(el('div', 'graph-panel-section', `${node.kind === 'tag' ? 'Notas com esta tag' : 'Conexões'} · ${nb.length}`));
			const list = el('div', 'graph-panel-links');
			for (const n of nb.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))) {
				const b = el('button', `graph-link-chip${n.kind === 'ghost' ? ' ghost' : ''}`);
				const dot = el('span', 'graph-dot');
				dot.style.background = fillOf(n);
				b.append(dot, el('span', '', n.label));
				b.onclick = () => select(n);
				b.onmouseenter = () => {
					hover = n;
					draw();
				};
				b.onmouseleave = () => {
					hover = null;
					draw();
				};
				list.append(b);
			}
			panel.append(list);
		}

		if (node.kind === 'tag') return;
		const content = el('div', 'graph-panel-body markdown');
		if (node.kind === 'ghost') {
			content.append(el('p', 'muted', 'Esta nota ainda não existe. Ela é citada por um link; crie a nota para começar a escrever.'));
		} else {
			content.innerHTML = renderNote(node.id);
		}
		panel.append(content);
	}

	// Links dentro do painel navegam no próprio grafo.
	panel.addEventListener('click', (e) => {
		const a = e.target.closest('a');
		if (!a || !selected) return;
		e.preventDefault();
		if (a.classList.contains('internal-link')) {
			const href = a.dataset.href.split('#')[0].split('|')[0];
			const path = resolveLink(href, selected.id);
			const node = byId.get(path ?? '?' + href.toLowerCase());
			if (node) {
				if (node.kind === 'ghost' && !S.showGhosts) {
					S.showGhosts = true;
					save();
					rebuild();
					if (!settingsBox.hidden) renderSettings();
				}
				select(node);
			}
		} else if (a.classList.contains('tag')) {
			const node = byId.get('#' + String(a.dataset.tag).toLowerCase());
			if (node) select(node);
		} else if (/^(https?|mailto):/i.test(a.getAttribute('href') ?? '')) {
			openExternal(a.getAttribute('href'));
		}
	});

	// Redimensionar o painel arrastando a borda.
	resizer.addEventListener('pointerdown', (e) => {
		resizer.setPointerCapture(e.pointerId);
		const startX = e.clientX;
		const startW = panel.getBoundingClientRect().width;
		const max = box.getBoundingClientRect().width * 0.7;
		const move = (ev) => {
			panelWidth = Math.round(Math.min(max, Math.max(320, startW - (ev.clientX - startX))));
			panel.style.width = `${panelWidth}px`;
		};
		const up = () => {
			resizer.removeEventListener('pointermove', move);
			resizer.removeEventListener('pointerup', up);
			try {
				localStorage.setItem(PANEL_KEY, String(panelWidth));
			} catch {}
		};
		resizer.addEventListener('pointermove', move);
		resizer.addEventListener('pointerup', up);
	});

	// ---------- interação no canvas ----------
	let drag = null;
	canvas.addEventListener('pointerdown', (e) => {
		canvas.setPointerCapture(e.pointerId);
		cancelAnimationFrame(anim);
		const [sx, sy] = local(e);
		const node = hit(sx, sy);
		drag = { node, sx, sy, startX: view.x, startY: view.y, moved: false };
		if (node) {
			node.fx = node.x;
			node.fy = node.y;
		}
	});
	canvas.addEventListener('pointermove', (e) => {
		const [sx, sy] = local(e);
		if (!drag) {
			const h = hit(sx, sy);
			if (h !== hover) {
				hover = h;
				canvas.style.cursor = h ? 'pointer' : 'grab';
				draw();
			}
			return;
		}
		if (Math.hypot(sx - drag.sx, sy - drag.sy) > 3) {
			if (!drag.moved && drag.node) sim.alphaTarget(0.3).restart();
			drag.moved = true;
		}
		if (!drag.moved) return;
		if (drag.node) {
			const p = toWorld(sx, sy);
			drag.node.fx = p.x;
			drag.node.fy = p.y;
		} else {
			canvas.style.cursor = 'grabbing';
			view.x = drag.startX + (sx - drag.sx);
			view.y = drag.startY + (sy - drag.sy);
			draw();
		}
	});
	canvas.addEventListener('pointerup', (e) => {
		const d = drag;
		drag = null;
		canvas.style.cursor = hover ? 'pointer' : 'grab';
		if (!d) return;
		if (d.node) {
			d.node.fx = null;
			d.node.fy = null;
			sim.alphaTarget(0);
		}
		if (d.moved) return;
		if (!d.node) return select(null);
		if (e.ctrlKey || e.metaKey) return openNode(d.node, true);
		select(d.node, { center: false });
	});
	canvas.addEventListener('dblclick', (e) => {
		const node = hit(...local(e));
		if (node) openNode(node);
	});
	canvas.addEventListener(
		'wheel',
		(e) => {
			e.preventDefault();
			cancelAnimationFrame(anim);
			const [sx, sy] = local(e);
			const before = toWorld(sx, sy);
			view.k = Math.min(4, Math.max(0.15, view.k * Math.exp(-e.deltaY * 0.0015)));
			view.x = sx - W / 2 - before.x * view.k;
			view.y = sy - H / 2 - before.y * view.k;
			draw();
		},
		{ passive: false },
	);
	zoomIn.onclick = () => zoomBy(1.3);
	zoomOut.onclick = () => zoomBy(1 / 1.3);
	fitBtn.onclick = () => fit(true);

	// ---------- cabeçalho ----------
	const count = header.querySelector('.graph-count');
	const filterInput = header.querySelector('.graph-filter');
	filterInput.addEventListener('input', () => {
		filter = filterInput.value.trim().toLowerCase();
		const n = filter ? visNodes.filter(matches).length : 0;
		count.textContent = filter ? `${n} encontrada${n === 1 ? '' : 's'}` : '';
		if (filter) selected = hover = null;
		draw();
	});
	filterInput.addEventListener('keydown', (e) => {
		if (e.key !== 'Enter' || !filter) return;
		// melhor resultado: começa com o texto, depois o mais conectado
		const best = visNodes
			.filter(matches)
			.sort((a, b) => b.label.toLowerCase().startsWith(filter) - a.label.toLowerCase().startsWith(filter) || b.deg - a.deg)[0];
		if (best) select(best);
	});
	header.querySelector('.close').addEventListener('click', close);
	const localBox = header.querySelector('.local');
	localBox.disabled = !current;
	localBox.checked = localOnly = !!(o.local && current);
	localBox.addEventListener('change', (e) => {
		localOnly = e.target.checked;
		localRoot = selected && selected.kind !== 'ghost' ? selected.id : current;
		localBox.disabled = !localRoot;
		rebuild();
		if (selected) renderPanel(selected);
	});
	backdrop.addEventListener('mousedown', (e) => {
		if (e.target === backdrop) close();
	});

	let closed = false;
	function close() {
		if (closed) return;
		closed = true;
		sim.stop();
		cancelAnimationFrame(anim);
		ro.disconnect();
		backdrop.remove();
		onClose?.();
	}

	// Esc fecha primeiro o painel ⚙, depois o da nota; sem painéis, o app fecha o grafo.
	close.handleEscape = () => {
		if (!settingsBox.hidden) {
			settingsBtn.click();
			return true;
		}
		if (panel.hidden) return false;
		select(null);
		return true;
	};

	resize();
	buildData();
	rebuild({ settle: true });
	return close;
}
