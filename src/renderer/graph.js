// Grafo de notas: simulação de forças (d3-force) desenhada em <canvas>.
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, forceX, forceY } from 'd3-force';

const idOf = (x) => (typeof x === 'object' ? x.id : x);

export function openGraph(root, { nodes, links, current, onOpen, onClose, local: startLocal = false }) {
	const backdrop = document.createElement('div');
	backdrop.className = 'modal-backdrop';
	const box = document.createElement('div');
	box.className = 'graph-box';
	const noteCount = nodes.filter((n) => n.kind === 'note').length;
	const noteLinks = links.filter((l) => !String(l.target).startsWith('?')).length;
	const header = document.createElement('div');
	header.className = 'graph-header';
	header.innerHTML = `<span class="graph-title">Grafo · ${noteCount} notas · ${noteLinks} conexões</span>
		<input class="graph-filter" type="search" placeholder="Destacar…" spellcheck="false">
		<label title="Mostrar só a nota atual e suas conexões"><input type="checkbox" class="local"${current ? '' : ' disabled'}> local</label>
		<label><input type="checkbox" class="ghosts"> notas inexistentes</label>
		<button class="icon-btn close" title="Fechar (Esc)">✕</button>`;
	const canvas = document.createElement('canvas');
	box.append(header, canvas);
	backdrop.append(box);
	root.append(backdrop);

	const ctx = canvas.getContext('2d');
	const css = getComputedStyle(document.documentElement);
	const color = (name) => css.getPropertyValue(name).trim();
	const colors = {
		node: color('--graph-node'),
		ghost: color('--text-faint'),
		current: color('--accent'),
		link: color('--graph-link'),
		text: color('--text-muted'),
		hl: color('--link'),
	};

	const allNodes = nodes.map((n) => ({ ...n, deg: 0 }));
	const byId = new Map(allNodes.map((n) => [n.id, n]));
	const allLinks = links.map((l) => ({ source: l.source, target: l.target }));
	for (const l of allLinks) {
		byId.get(l.source).deg++;
		byId.get(l.target).deg++;
	}
	for (const n of allNodes) n.r = 3.5 + Math.sqrt(n.deg) * 1.8;

	let showGhosts = false;
	let localOnly = startLocal && !!current;
	let filter = '';
	let visNodes = [];
	let visLinks = [];
	let neighbors = new Map();
	let hover = null;

	// Grafos pequenos ganham mais espaço entre os nós para os nomes não se sobreporem.
	const spread = noteCount < 40 ? 1.8 : noteCount < 150 ? 1.3 : 1;
	const sim = forceSimulation()
		.force('charge', forceManyBody().strength(-110 * spread).distanceMax(450 * spread))
		.force('link', forceLink().id((d) => d.id).distance(55 * spread).strength(0.4))
		.force('center', forceCenter(0, 0))
		.force('collide', forceCollide((d) => d.r + 3))
		// gravidade leve: mantém notas soltas perto do centro
		.force('x', forceX(0).strength(0.06))
		.force('y', forceY(0).strength(0.06))
		.on('tick', draw);

	function rebuild() {
		visNodes = allNodes.filter((n) => showGhosts || n.kind === 'note');
		if (localOnly) {
			// nota atual + vizinhos até 2 saltos
			const keep = new Set([current]);
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
		sim.alpha(1).restart();
	}

	let W = 0;
	let H = 0;
	let dpr = 1;
	// vaults pequenos começam mais aproximados
	const view = { x: 0, y: 0, k: noteCount < 15 ? 1.3 : noteCount < 60 ? 1.1 : 0.8 };

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
			if (d < n.r + 5 / view.k && d < bestDist) {
				best = n;
				bestDist = d;
			}
		}
		return best;
	}

	function draw() {
		if (!W) return;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, W, H);
		ctx.translate(W / 2 + view.x, H / 2 + view.y);
		ctx.scale(view.k, view.k);

		const nb = hover ? neighbors.get(hover.id) ?? new Set() : null;
		ctx.lineWidth = 1 / view.k;
		for (const l of visLinks) {
			const lit = hover && (l.source === hover || l.target === hover);
			ctx.strokeStyle = lit ? colors.hl : colors.link;
			ctx.globalAlpha = hover && !lit ? 0.2 : 0.9;
			ctx.beginPath();
			ctx.moveTo(l.source.x, l.source.y);
			ctx.lineTo(l.target.x, l.target.y);
			ctx.stroke();
		}
		const matches = (n) => filter && n.label.toLowerCase().includes(filter);
		for (const n of visNodes) {
			const dim = (hover && n !== hover && !nb.has(n.id)) || (filter && !hover && !matches(n));
			ctx.globalAlpha = dim ? 0.2 : 1;
			ctx.fillStyle =
				n.id === current ? colors.current : n === hover || matches(n) ? colors.hl : n.kind === 'ghost' ? colors.ghost : colors.node;
			ctx.beginPath();
			ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.font = `${12 / view.k}px "Segoe UI", system-ui, sans-serif`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		ctx.fillStyle = colors.text;
		const showAll = view.k > 0.85;
		for (const n of visNodes) {
			const important = n === hover || n.id === current || (nb && nb.has(n.id)) || matches(n);
			if (!showAll && !important) continue;
			ctx.globalAlpha = hover && !important ? 0.25 : 1;
			ctx.fillText(n.label, n.x, n.y + n.r + 3 / view.k);
		}
		ctx.globalAlpha = 1;
	}

	let drag = null;
	canvas.addEventListener('pointerdown', (e) => {
		canvas.setPointerCapture(e.pointerId);
		const [sx, sy] = local(e);
		const node = hit(sx, sy);
		drag = { node, sx, sy, startX: view.x, startY: view.y, moved: false };
		if (node) {
			node.fx = node.x;
			node.fy = node.y;
			sim.alphaTarget(0.3).restart();
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
		if (Math.hypot(sx - drag.sx, sy - drag.sy) > 3) drag.moved = true;
		if (drag.node) {
			const p = toWorld(sx, sy);
			drag.node.fx = p.x;
			drag.node.fy = p.y;
		} else {
			view.x = drag.startX + (sx - drag.sx);
			view.y = drag.startY + (sy - drag.sy);
			draw();
		}
	});
	canvas.addEventListener('pointerup', () => {
		const d = drag;
		drag = null;
		if (!d?.node) return;
		d.node.fx = null;
		d.node.fy = null;
		sim.alphaTarget(0);
		if (!d.moved) {
			close();
			onOpen(d.node);
		}
	});
	canvas.addEventListener(
		'wheel',
		(e) => {
			e.preventDefault();
			const [sx, sy] = local(e);
			const before = toWorld(sx, sy);
			view.k = Math.min(4, Math.max(0.15, view.k * Math.exp(-e.deltaY * 0.0015)));
			view.x = sx - W / 2 - before.x * view.k;
			view.y = sy - H / 2 - before.y * view.k;
			draw();
		},
		{ passive: false },
	);

	let closed = false;
	function close() {
		if (closed) return;
		closed = true;
		sim.stop();
		ro.disconnect();
		backdrop.remove();
		onClose?.();
	}
	header.querySelector('.close').addEventListener('click', close);
	header.querySelector('.ghosts').addEventListener('change', (e) => {
		showGhosts = e.target.checked;
		rebuild();
	});
	const localBox = header.querySelector('.local');
	localBox.checked = localOnly;
	localBox.addEventListener('change', (e) => {
		localOnly = e.target.checked;
		rebuild();
	});
	header.querySelector('.graph-filter').addEventListener('input', (e) => {
		filter = e.target.value.trim().toLowerCase();
		draw();
	});
	backdrop.addEventListener('mousedown', (e) => {
		if (e.target === backdrop) close();
	});

	rebuild();
	return close;
}
