// Extração de metadados de uma nota: links, embeds, tags, títulos, tarefas e frontmatter.
// Roda dentro do Web Worker (indexer.worker.js) para não travar a interface.

// Tag precisa vir depois de espaço ou no início da linha (evita âncoras como "(#secao)").
export const TAG_RE = /(^|\s)#([\p{L}\p{N}_\/-]+)/gu;
const WIKILINK_RE = /(!?)\[\[([^\]\n]+?)\]\]/g;
const TASK_RE = /^\s*(?:[-*+]|\d+[.)])\s+\[([ xX])\]\s?(.*)$/;

// "alvo#subcaminho|apelido" -> partes
export function splitLink(inner) {
	let s = inner;
	let alias = null;
	const pipe = s.indexOf('|');
	if (pipe >= 0) {
		alias = s.slice(pipe + 1).trim();
		s = s.slice(0, pipe);
	}
	let subpath = null;
	const hash = s.indexOf('#');
	if (hash >= 0) {
		subpath = s.slice(hash + 1).trim();
		s = s.slice(0, hash);
	}
	return { target: s.trim(), subpath, alias };
}

const unquote = (s) => s.replace(/^(['"])(.*)\1$/, '$2');

// YAML simplificado: "chave: valor", listas com "- item" e listas inline "[a, b]".
function parseYamlLite(src) {
	const out = {};
	let lastKey = null;
	for (const raw of src.split(/\r?\n/)) {
		const trimmed = raw.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const item = /^\s*-\s+(.*)$/.exec(raw);
		if (item && lastKey) {
			if (!Array.isArray(out[lastKey])) out[lastKey] = out[lastKey] ? [out[lastKey]] : [];
			out[lastKey].push(unquote(item[1].trim()));
			continue;
		}
		const kv = /^([^:#\s][^:]*):\s*(.*)$/.exec(raw);
		if (!kv) continue;
		lastKey = kv[1].trim();
		const value = kv[2].trim();
		out[lastKey] = /^\[.*\]$/.test(value)
			? value.slice(1, -1).split(',').map((s) => unquote(s.trim())).filter(Boolean)
			: unquote(value);
	}
	return out;
}

// Separa o bloco "---" inicial. `offset` = linhas consumidas antes do corpo.
export function splitFrontmatter(text) {
	const m = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(text);
	if (!m) return { frontmatter: null, body: text, offset: 0 };
	return {
		frontmatter: parseYamlLite(m[1]),
		body: text.slice(m[0].length),
		offset: (m[0].match(/\n/g) || []).length,
	};
}

export function parseNote(text) {
	const { frontmatter, body, offset } = splitFrontmatter(text);
	const meta = { links: [], embeds: [], tags: [], headings: [], tasks: [], frontmatter };
	const lines = body.split(/\r?\n/);
	let fence = null;
	let comment = false;
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const ln = i + offset;
		const f = /^\s*(```|~~~)/.exec(line);
		if (f) {
			if (!fence) fence = f[1];
			else if (f[1] === fence) fence = null;
			continue;
		}
		if (fence) continue;

		// comentários %% ... %% (podem ocupar várias linhas)
		let clean = '';
		let rest = line;
		while (rest) {
			const at = rest.indexOf('%%');
			if (at < 0) {
				if (!comment) clean += rest;
				break;
			}
			if (!comment) clean += rest.slice(0, at);
			comment = !comment;
			rest = rest.slice(at + 2);
		}
		if (!clean.trim()) continue;

		const h = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(clean);
		if (h && h[2]) meta.headings.push({ level: h[1].length, text: h[2], line: ln });

		const t = TASK_RE.exec(clean);
		if (t) meta.tasks.push({ line: ln, done: t[1] !== ' ', text: t[2].trim() });

		// ignora código inline
		clean = clean.replace(/`[^`]*`/g, (m) => ' '.repeat(m.length));
		for (const m of clean.matchAll(WIKILINK_RE)) {
			(m[1] ? meta.embeds : meta.links).push({ ...splitLink(m[2]), line: ln });
		}
		for (const m of clean.matchAll(TAG_RE)) {
			if (/[^\d]/.test(m[2])) meta.tags.push(m[2].replace(/\/+$/, ''));
		}
	}
	if (frontmatter) {
		const fmTags = frontmatter.tags ?? frontmatter.tag;
		for (const value of [].concat(fmTags ?? [])) {
			if (typeof value !== 'string') continue;
			for (const part of value.split(/[\s,]+/)) if (part) meta.tags.push(part.replace(/^#/, ''));
		}
		const aliases = frontmatter.aliases ?? frontmatter.alias;
		meta.aliases = [].concat(aliases ?? []).filter((a) => typeof a === 'string' && a.trim());
	}
	return meta;
}
