// Grafo de notas: simulação de forças (d3-force) desenhada em <canvas>, com painel lateral
// que mostra a nota clicada sem sair do grafo.
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, forceX, forceY } from 'd3-force';

const idOf = (x) => (typeof x === 'object' ? x.id : x);
const folderOf = (id) => (id.includes('/') ? id.slice(0, id.indexOf('/')) : '');
// Cores por pasta de primeiro nível (legíveis no tema claro e no escuro).
const PALETTE = ['#5aa9e6', '#7bc47f', '#c678dd', '#e06c75', '#56b6c2', '#d19a66', '#a0a8ff', '#e5c07b'];
const PANEL_KEY = 'briefing.graphPanelWidth';

function el(tag, className, text) {
	const node = document.createElement(tag);
	if (className) node.className = className;
	if (text != null) node.textContent = text;
	return node;
}

/**
 * @param {HTMLElement} root
 * @param {object} o
 * @param {Array} o.nodes  { id, label, kind: 'note' | 'ghost' }
 * @param {Array} o.links  { source, target }
 * @param {(node, opts: { newTab: boolean }) => void} o.onOpen  abre a nota no editor (o grafo fecha antes)
 * @param {(path: string) => string} o.renderNote  HTML da nota para o painel
 * @param {(href: string, from: string) => string|null} o.resolveLink
 * @param {(path: string) => { tags: string[], backlinks: number, outgoing: number }} o.noteInfo
 * @param {(url: string) => void} o.openExternal
 */
export function openGraph(root, o) {
	const { nodes, links, current, onOpen, onClose, renderNote, resolveLink, noteInfo, openExternal } = o;

	const backdrop = el('div', 'modal-backdrop');
	const box = el('div', 'graph-box');
	const noteCount = nodes.filter((n) => n.kind === 'note').length;
	const noteLinks = links.filter((l) => !String(l.target).startsWith('?')).length;

	const header = el('div', 'graph-header');
	header.innerHTML = `<span class="graph-title">Grafo · ${noteCount} notas · ${noteLinks} conexões</span>
		<span class="graph-count muted"></span>
		<input class="graph-filter" type="search" placeholder="Buscar nota… (Enter)" spellcheck="false">
		<label title="Mostrar só a nota em foco e suas conexões"><input type="checkbox" class="local"> local</label>
		<label title="Links para notas que ainda não foram criadas"><input type="checkbox" class="ghosts"> notas inexistentes</label>
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
	stage.append(canvas, controls, legend, hint);

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
	};

	// ---------- dados ----------
	const allNodes = nodes.map((n) => ({ ...n, deg: 0, folder: n.kind === 'note' ? folderOf(n.id) : '' }));
	const byId = new Map(allNodes.map((n) => [n.id, n]));
	const allLinks = links.map((l) => ({ source: l.source, target: l.target }));
	for (const l of allLinks) {
		byId.get(l.source).deg++;
		byId.get(l.target).deg++;
	}
	for (const n of allNodes) n.r = 4 + Math.sqrt(n.deg) * 2;

	const folders = new Map(); // pasta -> { color, count }
	for (const n of allNodes) {
		if (n.kind !== 'note' || !n.folder) continue;
		if (!folders.has(n.folder)) folders.set(n.folder, { count: 0 });
		folders.get(n.folder).count++;
	}
	[...folders.keys()]
		.sort((a, b) => folders.get(b).count - folders.get(a).count)
		.forEach((f, i) => (folders.get(f).color = PALETTE[i % PALETTE.length]));
	const fillOf = (n) => (n.kind === 'ghost' ? colors.ghost : folders.get(n.folder)?.color ?? colors.node);

	let showGhosts = false;
	let localOnly = false;
	let localRoot = current;
	let filter = '';
	let folderFilter = null;
	let visNodes = [];
	let visLinks = [];
	let neighbors = new Map();
	let hover = null;
	let selected = null;

	// Grafos pequenos ganham mais espaço entre os nós para os nomes não se sobreporem.
	const spread = noteCount < 40 ? 1.8 : noteCount < 150 ? 1.3 : 1;
	const sim = forceSimulation()
		.force('charge', forceManyBody().strength(-120 * spread).distanceMax(450 * spread))
		.force('link', forceLink().id((d) => d.id).distance(60 * spread).strength(0.4))
		.force('center', forceCenter(0, 0))
		.force('collide', forceCollide((d) => d.r + 4))
		// gravidade leve: mantém notas soltas perto do centro
		.force('x', forceX(0).strength(0.06))
		.force('y', forceY(0).strength(0.06))
		.stop()
		.on('tick', draw);

	function rebuild({ settle = false } = {}) {
		visNodes = allNodes.filter((n) => showGhosts || n.kind === 'note');
		if (localOnly && localRoot) {
			// nota em foco + vizinhos até 2 saltos
			const keep = new Set([localRoot]);
			for (let depth = 0; depth < 2; depth++) {
				for (const l of allLinks) {
					const a = idOf(l.source);
					const b = idOf(l.target);
					if (keep.has(a) || keep.has(b)) {
						keep.add(a);
						keep.add(b);
					}
				}
			}
			visNodes = visNodes.filter((n) => keep.has(n.id));
		}
		const ids = new Set(visNodes.map((n) => n.id));
		visLinks = allLinks.filter((l) => ids.has(idOf(l.source)) && ids.has(idOf(l.target)));
		neighbors = new Map();
		const link = (a, b) => {
			if (!neighbors.has(a)) neighbors.set(a, new Set());
			neighbors.get(a).add(b);
		};
		for (const l of visLinks) {
			link(idOf(l.source), idOf(l.target));
			link(idOf(l.target), idOf(l.source));
		}
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
			setTimeout(() => fit(true), 700);
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
			x0 = Math.min(x0, n.x - n.r);
			y0 = Math.min(y0, n.y - n.r);
			x1 = Math.max(x1, n.x + n.r);
			y1 = Math.max(y1, n.y + n.r + 16);
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
			if (d < n.r + 6 / view.k && d < bestDist) {
				best = n;
				bestDist = d;
			}
		}
		return best;
	}

	// ---------- desenho ----------
	const matches = (n) => filter && n.label.toLowerCase().includes(filter);

	function draw() {
		if (!W) return;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, W, H);
		ctx.translate(W / 2 + view.x, H / 2 + view.y);
		ctx.scale(view.k, view.k);

		const focus = hover ?? selected;
		const nb = focus ? neighbors.get(focus.id) ?? new Set() : null;
		const dimmed = (n) =>
			(focus && n !== focus && !nb.has(n.id)) ||
			(!focus && filter && !matches(n)) ||
			(!focus && folderFilter != null && n.folder !== folderFilter);

		for (const l of visLinks) {
			const lit = focus && (l.source === focus || l.target === focus);
			ctx.strokeStyle = lit ? colors.hl : colors.link;
			ctx.lineWidth = (lit ? 1.8 : 1) / view.k;
			ctx.globalAlpha = focus && !lit ? 0.12 : lit ? 0.95 : 0.7;
			ctx.beginPath();
			ctx.moveTo(l.source.x, l.source.y);
			ctx.lineTo(l.target.x, l.target.y);
			ctx.stroke();
		}

		for (const n of visNodes) {
			const dim = dimmed(n);
			ctx.globalAlpha = dim ? 0.18 : 1;
			const fill = fillOf(n);
			if (n === selected) {
				ctx.shadowColor = fill;
				ctx.shadowBlur = 22;
			}
			ctx.beginPath();
			ctx.arc(n.x, n.y, n === hover || n === selected ? n.r * 1.25 : n.r, 0, Math.PI * 2);
			if (n.kind === 'ghost') {
				ctx.setLineDash([2 / view.k, 2 / view.k]);
				ctx.strokeStyle = fill;
				ctx.lineWidth = 1.2 / view.k;
				ctx.stroke();
				ctx.setLineDash([]);
			} else {
				ctx.fillStyle = matches(n) && !focus ? colors.hl : fill;
				ctx.fill();
			}
			ctx.shadowBlur = 0;
			// anel: nota aberta no editor (âmbar) e nota selecionada (claro)
			if (n.id === current || n === selected) {
				ctx.beginPath();
				ctx.arc(n.x, n.y, n.r * 1.25 + 3 / view.k, 0, Math.PI * 2);
				ctx.strokeStyle = n === selected ? colors.heading : colors.accent;
				ctx.lineWidth = 2 / view.k;
				ctx.stroke();
			}
		}

		const size = 12 / Math.max(view.k, 0.6);
		ctx.font = `${size}px "Segoe UI", system-ui, sans-serif`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		ctx.lineJoin = 'round';
		const showAll = view.k > 0.7 || visNodes.length < 40;
		for (const n of visNodes) {
			const important = n === focus || n.id === current || (nb && nb.has(n.id)) || matches(n);
			if (!showAll && !important) continue;
			ctx.globalAlpha = dimmed(n) ? 0.2 : 1;
			const y = n.y + n.r * 1.25 + 4 / view.k;
			// contorno na cor do fundo deixa o nome legível sobre as linhas
			ctx.strokeStyle = colors.bg;
			ctx.lineWidth = 3 / view.k;
			ctx.strokeText(n.label, n.x, y);
			ctx.fillStyle = n === focus ? colors.heading : colors.text;
			ctx.fillText(n.label, n.x, y);
		}
		ctx.globalAlpha = 1;
	}

	// ---------- legenda (pastas) ----------
	function renderLegend() {
		legend.replaceChildren();
		if (!folders.size) return;
		const visible = new Set(visNodes.map((n) => n.folder));
		for (const [name, info] of [...folders].sort((a, b) => b[1].count - a[1].count)) {
			if (!visible.has(name)) continue;
			const item = el('button', `graph-legend-item${folderFilter === name ? ' active' : ''}`);
			const dot = el('span', 'graph-dot');
			dot.style.background = info.color;
			item.append(dot, el('span', '', name), el('span', 'muted', String(info.count)));
			item.title = folderFilter === name ? 'Mostrar todas as pastas' : `Destacar a pasta ${name}`;
			item.onclick = () => {
				folderFilter = folderFilter === name ? null : name;
				renderLegend();
				draw();
			};
			legend.append(item);
		}
	}

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
		onOpen(node, { newTab });
	}

	function renderPanel(node) {
		panel.replaceChildren();
		const head = el('div', 'graph-panel-head');
		const titles = el('div', 'graph-panel-titles');
		titles.append(el('div', 'graph-panel-title', node.label));
		if (node.kind === 'note') titles.append(el('div', 'graph-panel-path', node.id.includes('/') ? node.id.slice(0, node.id.lastIndexOf('/')).split('/').join(' / ') : 'raiz do vault'));
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
		} else {
			button('Abrir nota', 'btn cta', () => openNode(node), 'Abrir no editor (duplo clique no grafo)');
			button('Nova aba', 'btn', () => openNode(node, true));
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
			panel.append(el('div', 'graph-panel-section', `Conexões · ${nb.length}`));
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
				if (node.kind === 'ghost' && !showGhosts) {
					showGhosts = true;
					header.querySelector('.ghosts').checked = true;
					rebuild();
				}
				select(node);
			}
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
	header.querySelector('.ghosts').addEventListener('change', (e) => {
		showGhosts = e.target.checked;
		rebuild();
	});
	const localBox = header.querySelector('.local');
	localBox.disabled = !current;
	localBox.checked = localOnly = !!(o.local && current);
	localBox.addEventListener('change', (e) => {
		localOnly = e.target.checked;
		localRoot = selected?.kind === 'note' ? selected.id : current;
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

	// Esc fecha primeiro o painel; com o painel fechado, o app fecha o grafo.
	close.handleEscape = () => {
		if (panel.hidden) return false;
		select(null);
		return true;
	};

	resize();
	rebuild({ settle: true });
	return close;
}
