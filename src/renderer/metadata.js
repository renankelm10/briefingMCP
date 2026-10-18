// Índice em memória: resolve links, calcula backlinks, menções, tags, tarefas e o grafo.
import { noteName, escapeRegExp } from './util.js';

export class MetadataIndex {
	constructor() {
		this.meta = new Map(); // caminho -> metadados da nota
		this.byLowerPath = new Map(); // caminho em minúsculas -> caminho real
		this.byBase = new Map(); // "nome.ext" em minúsculas -> [caminhos]
	}

	clear() {
		this.meta.clear();
	}

	setFiles(files) {
		this.byLowerPath.clear();
		this.byBase.clear();
		for (const f of files) {
			if (f.type !== 'file') continue;
			const low = f.path.toLowerCase();
			this.byLowerPath.set(low, f.path);
			const base = low.slice(low.lastIndexOf('/') + 1);
			if (!this.byBase.has(base)) this.byBase.set(base, []);
			this.byBase.get(base).push(f.path);
		}
	}

	set(path, meta) {
		this.meta.set(path, meta);
	}

	delete(path) {
		this.meta.delete(path);
	}

	rename(from, to) {
		const m = this.meta.get(from);
		if (!m) return;
		this.meta.delete(from);
		this.meta.set(to, m);
	}

	// Resolve o alvo de um [[link]] a um arquivo existente (ou null).
	resolve(target, from) {
		if (!target) return from ?? null;
		const t = target.trim().replace(/\\/g, '/').replace(/^\.?\//, '').toLowerCase();
		const fromDir = from && from.includes('/') ? from.slice(0, from.lastIndexOf('/') + 1).toLowerCase() : '';
		for (const candidate of [t + '.md', t]) {
			if (this.byLowerPath.has(candidate)) return this.byLowerPath.get(candidate);
			if (fromDir && this.byLowerPath.has(fromDir + candidate)) return this.byLowerPath.get(fromDir + candidate);
			const base = candidate.slice(candidate.lastIndexOf('/') + 1);
			const list = this.byBase.get(base);
			if (!list?.length) continue;
			if (candidate.includes('/')) {
				const match = list.find((p) => p.toLowerCase().endsWith('/' + candidate));
				if (match) return match;
				continue;
			}
			// Mesmo nome em várias pastas: prefere o caminho mais raso.
			return [...list].sort((a, b) => a.split('/').length - b.split('/').length || a.length - b.length)[0];
		}
		// apelidos definidos no frontmatter (aliases)
		for (const [path, m] of this.meta) {
			if (m.aliases?.some((a) => a.toLowerCase() === t)) return path;
		}
		return null;
	}

	outgoing(path) {
		const m = this.meta.get(path);
		if (!m) return [];
		return [...m.links, ...m.embeds]
			.filter((l) => l.target)
			.map((l) => ({ ...l, resolved: this.resolve(l.target, path) }));
	}

	backlinks(path) {
		const result = [];
		for (const [source, m] of this.meta) {
			if (source === path) continue;
			const hits = [...m.links, ...m.embeds].filter((l) => l.target && this.resolve(l.target, source) === path);
			if (hits.length) result.push({ source, hits });
		}
		return result.sort((a, b) => a.source.localeCompare(b.source, 'pt-BR'));
	}

	// Notas que citam o nome desta (ou um apelido) sem criar link.
	unlinkedMentions(path, contents, limit = 30) {
		const names = [noteName(path), ...(this.meta.get(path)?.aliases ?? [])].filter((n) => n.length >= 3);
		if (!names.length) return [];
		const re = new RegExp(`(^|[^\\p{L}\\p{N}_])(${names.map(escapeRegExp).join('|')})(?=$|[^\\p{L}\\p{N}_])`, 'giu');
		const linked = new Set(this.backlinks(path).map((b) => b.source));
		const out = [];
		for (const [source, text] of contents) {
			if (source === path || linked.has(source) || !/\.md$/i.test(source)) continue;
			const lines = text.split('\n');
			for (let i = 0; i < lines.length && out.length < limit; i++) {
				// ignora o que já está dentro de [[...]] ou `código`
				const masked = lines[i].replace(/\[\[[^\]]*\]\]|`[^`]*`/g, (m) => ' '.repeat(m.length));
				re.lastIndex = 0;
				const m = re.exec(masked);
				if (m) out.push({ source, line: i, text: lines[i], index: m.index + m[1].length, match: m[2] });
			}
		}
		return out;
	}

	tags() {
		const counts = new Map();
		for (const m of this.meta.values()) {
			for (const tag of new Set(m.tags.map((t) => t.toLowerCase()))) counts.set(tag, (counts.get(tag) || 0) + 1);
		}
		return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'));
	}

	tasks() {
		const out = [];
		for (const [path, m] of this.meta) for (const t of m.tasks ?? []) out.push({ path, ...t });
		return out;
	}

	headings(path) {
		return this.meta.get(path)?.headings ?? [];
	}

	graph(noteFiles) {
		const nodes = [];
		const ids = new Set();
		for (const f of noteFiles) {
			nodes.push({ id: f.path, label: noteName(f.path), kind: 'note' });
			ids.add(f.path);
		}
		const links = [];
		const seen = new Set();
		for (const f of noteFiles) {
			const m = this.meta.get(f.path);
			if (!m) continue;
			for (const l of [...m.links, ...m.embeds]) {
				if (!l.target) continue;
				let target = this.resolve(l.target, f.path);
				if (target && !ids.has(target)) continue; // anexos (imagens etc.)
				if (!target) {
					target = '?' + l.target.toLowerCase();
					if (!ids.has(target)) {
						ids.add(target);
						nodes.push({ id: target, label: l.target, kind: 'ghost' });
					}
				}
				if (target === f.path) continue;
				const key = f.path < target ? f.path + '\0' + target : target + '\0' + f.path;
				if (seen.has(key)) continue;
				seen.add(key);
				links.push({ source: f.path, target });
			}
		}
		return { nodes, links };
	}
}
