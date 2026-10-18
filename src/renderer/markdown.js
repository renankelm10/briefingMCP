// Modo leitura: Markdown -> HTML com [[links]], embeds, #tags, ==destaques==, tarefas,
// callouts, comentários %% %% e propriedades.
import MarkdownIt from 'markdown-it';
import { splitLink, splitFrontmatter } from './parse.js';
import { escapeHtml, sectionOf, IMAGE_EXT } from './util.js';

const TAG_STICKY = /[\p{L}\p{N}_\/-]+/uy;

function renderProperties(frontmatter) {
	const rows = Object.entries(frontmatter)
		.map(([key, value]) => {
			const cell = Array.isArray(value)
				? value.map((v) => `<span class="pill">${escapeHtml(v)}</span>`).join(' ')
				: escapeHtml(value);
			return `<tr><th>${escapeHtml(key)}</th><td>${cell}</td></tr>`;
		})
		.join('');
	return `<table class="properties">${rows}</table>`;
}

// > [!tipo] Título  ->  bloco destacado
function applyCallouts(html) {
	return html.replace(
		/<blockquote>\s*<p>\[!([\w-]+)\][+-]?[ \t]*([^<\n]*)(?:<br>\s*|<\/p>\s*<p>|(<\/p>))?/g,
		(_m, type, title, closedParagraph) => {
			const label = title.trim() || type.charAt(0).toUpperCase() + type.slice(1);
			return `<blockquote class="callout" data-callout="${escapeHtml(type.toLowerCase())}"><div class="callout-title">${label}</div>${closedParagraph ? '' : '<p>'}`;
		},
	);
}

// Remove %%comentários%% preservando as quebras de linha (mantém a numeração das linhas).
const stripComments = (text) => text.replace(/%%[\s\S]*?%%/g, (m) => m.replace(/[^\n]/g, ''));

export function createRenderer({ resolve, fileUrl, getContent, noteName }) {
	const md = new MarkdownIt({ html: false, linkify: true, breaks: true });
	// Sem isso, "nota.md" vira link para o domínio .md (Moldávia).
	md.linkify.set({ fuzzyLink: false, fuzzyEmail: false });

	md.inline.ruler.before('link', 'wikilink', (state, silent) => {
		const src = state.src;
		let pos = state.pos;
		let embed = false;
		if (src.charCodeAt(pos) === 0x21 /* ! */) {
			if (src.charCodeAt(pos + 1) !== 0x5b || src.charCodeAt(pos + 2) !== 0x5b) return false;
			embed = true;
			pos++;
		} else if (src.charCodeAt(pos) !== 0x5b || src.charCodeAt(pos + 1) !== 0x5b) {
			return false;
		}
		const end = src.indexOf(']]', pos + 2);
		if (end < 0) return false;
		const inner = src.slice(pos + 2, end);
		if (!inner.trim() || /[\n[\]]/.test(inner)) return false;
		if (!silent) state.push('wikilink', '', 0).meta = { inner, embed };
		state.pos = end + 2;
		return true;
	});

	md.inline.ruler.push('hashtag', (state, silent) => {
		const { src, pos } = state;
		if (src.charCodeAt(pos) !== 0x23 /* # */) return false;
		if (pos > 0 && !/\s/.test(src[pos - 1])) return false;
		TAG_STICKY.lastIndex = pos + 1;
		const m = TAG_STICKY.exec(src);
		if (!m || !/[^\d]/.test(m[0])) return false;
		if (!silent) state.push('hashtag', '', 0).content = m[0];
		state.pos = pos + 1 + m[0].length;
		return true;
	});

	// ==destaque==
	md.inline.ruler.before('emphasis', 'highlight', (state, silent) => {
		const { src, pos } = state;
		if (src.charCodeAt(pos) !== 0x3d || src.charCodeAt(pos + 1) !== 0x3d) return false;
		const end = src.indexOf('==', pos + 2);
		if (end <= pos + 2 || /\n/.test(src.slice(pos + 2, end))) return false;
		if (!silent) {
			state.push('mark_open', 'mark', 1);
			const max = state.posMax;
			state.pos = pos + 2;
			state.posMax = end;
			state.md.inline.tokenize(state);
			state.posMax = max;
			state.push('mark_close', 'mark', -1);
		}
		state.pos = end + 2;
		return true;
	});

	// "- [ ] tarefa" -> caixa de seleção clicável (data-line = linha no arquivo)
	md.core.ruler.after('inline', 'tasks', (state) => {
		const tokens = state.tokens;
		for (let i = 2; i < tokens.length; i++) {
			const tok = tokens[i];
			if (tok.type !== 'inline' || tokens[i - 1].type !== 'paragraph_open' || tokens[i - 2].type !== 'list_item_open') continue;
			const m = /^\[([ xX])\]\s/.exec(tok.content);
			const first = tok.children?.[0];
			if (!m || first?.type !== 'text' || !first.content.startsWith(m[0].slice(0, 3))) continue;
			first.content = first.content.slice(3).replace(/^\s/, '');
			const checked = m[1] !== ' ';
			const line = (tokens[i - 1].map?.[0] ?? -1) + (state.env.offset ?? 0);
			const box = new state.Token('html_inline', '', 0);
			box.content = `<input type="checkbox" class="task-checkbox" data-line="${line}"${checked ? ' checked' : ''}${state.env.depth ? ' disabled' : ''}> `;
			tok.children.unshift(box);
			tokens[i - 2].attrJoin('class', checked ? 'task-item done' : 'task-item');
		}
	});

	// Títulos recebem data-line para o painel de tópicos rolar até eles.
	md.core.ruler.push('heading_lines', (state) => {
		for (const tok of state.tokens) {
			if (tok.type === 'heading_open' && tok.map) tok.attrSet('data-line', String(tok.map[0] + (state.env.offset ?? 0)));
		}
	});

	md.renderer.rules.hashtag = (tokens, idx) => {
		const tag = escapeHtml(tokens[idx].content);
		return `<a href="#" class="tag" data-tag="${tag}">#${tag}</a>`;
	};

	md.renderer.rules.wikilink = (tokens, idx, _options, env) => {
		const { inner, embed } = tokens[idx].meta;
		const { target, subpath, alias } = splitLink(inner);
		const resolved = resolve(target, env.fromPath);
		if (embed && resolved) {
			if (IMAGE_EXT.test(resolved)) {
				const width = alias && /^\d+$/.test(alias) ? ` width="${alias}"` : '';
				return `<img class="embed-image" src="${escapeHtml(fileUrl(resolved))}" alt="${escapeHtml(width ? target : alias || target)}"${width}>`;
			}
			if (/\.md$/i.test(resolved) && env.depth < 2) {
				let content = getContent(resolved);
				if (content != null && subpath) content = sectionOf(content, subpath) ?? content;
				if (content != null) {
					return `<div class="embed"><a href="#" class="embed-title internal-link" data-href="${escapeHtml(inner.split('|')[0])}">${escapeHtml(noteName(resolved))}${subpath ? ' › ' + escapeHtml(subpath) : ''}</a>${render(content, resolved, env.depth + 1)}</div>`;
				}
			}
		}
		const label = alias || [target, subpath].filter(Boolean).join(' › ') || inner;
		const href = inner.split('|')[0];
		return `<a href="#" class="internal-link${resolved ? '' : ' unresolved'}" data-href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
	};

	function render(text, fromPath, depth = 0) {
		const { frontmatter, body, offset } = splitFrontmatter(text);
		let html = '';
		if (frontmatter && depth === 0 && Object.keys(frontmatter).length) html += renderProperties(frontmatter);
		html += md.render(stripComments(body), { fromPath, depth, offset });
		return applyCallouts(html);
	}

	return render;
}
