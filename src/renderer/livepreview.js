// Live Preview: esconde a marcação Markdown nas linhas que não estão sendo editadas
// e troca listas de tarefas, marcadores, regras e imagens por elementos visuais.
import { ViewPlugin, Decoration, WidgetType, EditorView } from '@codemirror/view';
import { StateField } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';
import { splitLink } from './parse.js';

class CheckboxWidget extends WidgetType {
	constructor(checked, at) {
		super();
		this.checked = checked;
		this.at = at; // posição do caractere entre [ ]
	}
	eq(other) {
		return other.checked === this.checked && other.at === this.at;
	}
	toDOM(view) {
		const box = document.createElement('input');
		box.type = 'checkbox';
		box.className = 'cm-lp-task';
		box.checked = this.checked;
		box.addEventListener('mousedown', (e) => e.preventDefault());
		box.addEventListener('click', (e) => {
			e.preventDefault();
			view.dispatch({ changes: { from: this.at, to: this.at + 1, insert: this.checked ? ' ' : 'x' }, userEvent: 'input' });
		});
		return box;
	}
	ignoreEvent() {
		return true;
	}
}

class BulletWidget extends WidgetType {
	eq() {
		return true;
	}
	toDOM() {
		const s = document.createElement('span');
		s.className = 'cm-lp-bullet';
		s.textContent = '•';
		return s;
	}
}

class RuleWidget extends WidgetType {
	eq() {
		return true;
	}
	toDOM() {
		const s = document.createElement('span');
		s.className = 'cm-lp-hr';
		return s;
	}
}

class ImageWidget extends WidgetType {
	constructor(url, alt, width) {
		super();
		this.url = url;
		this.alt = alt;
		this.width = width;
	}
	eq(other) {
		return other.url === this.url && other.width === this.width;
	}
	toDOM() {
		const img = document.createElement('img');
		img.className = 'cm-lp-img';
		img.src = this.url;
		img.alt = this.alt;
		if (this.width) img.width = this.width;
		return img;
	}
}

// Bloco renderizado (tabela, callout). Clicar fora de links põe o cursor no bloco e revela o texto.
class BlockWidget extends WidgetType {
	constructor(html, from, opts) {
		super();
		this.html = html;
		this.from = from;
		this.opts = opts;
	}
	eq(other) {
		return other.html === this.html && other.from === this.from;
	}
	toDOM(view) {
		const div = document.createElement('div');
		div.className = 'cm-lp-block markdown';
		div.innerHTML = this.html;
		div.addEventListener('mousedown', (e) => {
			const a = e.target.closest('a');
			e.preventDefault();
			if (a?.classList.contains('internal-link')) return this.opts.onOpenLink?.(a.dataset.href);
			if (a && /^(https?|mailto):/i.test(a.getAttribute('href') ?? '')) return this.opts.onOpenUrl?.(a.getAttribute('href'));
			view.dispatch({ selection: { anchor: this.from } });
			view.focus();
		});
		return div;
	}
	ignoreEvent() {
		return true;
	}
}

const isCallout = (state, from) => /^\s*>\s*\[!/.test(state.doc.lineAt(from).text);

function buildBlocks(state, opts) {
	if (!opts.renderBlock) return Decoration.none;
	const out = [];
	// Frontmatter (--- no início): vira a tabela de propriedades enquanto o cursor está fora.
	const doc = state.doc;
	if (doc.lines > 2 && doc.line(1).text === '---') {
		for (let n = 2; n <= Math.min(doc.lines, 200); n++) {
			if (doc.line(n).text !== '---') continue;
			const from = 0;
			const to = doc.line(n).to;
			if (!state.selection.ranges.some((r) => r.from <= to && r.to >= from)) {
				const html = opts.renderBlock(state.sliceDoc(from, to) + '\n', { properties: true });
				if (html.trim()) out.push(Decoration.replace({ widget: new BlockWidget(html, from, opts), block: true }).range(from, to));
			}
			break;
		}
	}
	syntaxTree(state).iterate({
		enter(ref) {
			if (ref.name === 'FencedCode' || ref.name === 'CodeBlock') return false;
			if (ref.name !== 'Table' && !(ref.name === 'Blockquote' && isCallout(state, ref.from))) return;
			const from = state.doc.lineAt(ref.from).from;
			const to = state.doc.lineAt(ref.to).to;
			const touched = state.selection.ranges.some((r) => r.from <= to && r.to >= from);
			if (!touched) {
				const html = opts.renderBlock(state.sliceDoc(from, to));
				out.push(Decoration.replace({ widget: new BlockWidget(html, from, opts), block: true }).range(from, to));
			}
			return false;
		},
	});
	return Decoration.set(out);
}

// Decorações de bloco (que cobrem várias linhas) precisam vir de um StateField.
const blockField = (opts) =>
	StateField.define({
		create: (state) => buildBlocks(state, opts),
		update(value, tr) {
			if (tr.docChanged || tr.selection || syntaxTree(tr.startState) !== syntaxTree(tr.state)) return buildBlocks(tr.state, opts);
			return value;
		},
		provide: (field) => EditorView.decorations.from(field),
	});

const CODE_NODE = /^(InlineCode|CodeText|FencedCode|CodeBlock|CodeMark|CodeInfo)$/;

function build(view, opts) {
	const { state } = view;
	const doc = state.doc;
	const tree = syntaxTree(state);
	const items = []; // { from, to, deco, replace }

	const activeLines = new Set();
	for (const r of state.selection.ranges) {
		const a = doc.lineAt(r.from).number;
		const b = doc.lineAt(r.to).number;
		for (let n = a; n <= b; n++) activeLines.add(n);
	}
	const lineActive = (pos) => activeLines.has(doc.lineAt(pos).number);
	const touchesSelection = (from, to) => state.selection.ranges.some((r) => r.from <= to && r.to >= from);
	const hide = (from, to) => {
		if (to > from) items.push({ from, to, deco: Decoration.replace({}), replace: true });
	};
	const widget = (from, to, w) => items.push({ from, to, deco: Decoration.replace({ widget: w }), replace: true });
	const lineClass = (from, to, cls) => {
		for (let pos = from; pos <= to; ) {
			const line = doc.lineAt(pos);
			items.push({ from: line.from, to: line.from, deco: Decoration.line({ class: cls }) });
			pos = line.to + 1;
		}
	};

	for (const { from, to } of view.visibleRanges) {
		tree.iterate({
			from,
			to,
			enter(ref) {
				const name = ref.name;
				const node = ref.node;
				if (name === 'FencedCode' || name === 'CodeBlock') {
					lineClass(ref.from, ref.to, 'cm-lp-code');
					return false;
				}
				if (name === 'Blockquote') {
					lineClass(ref.from, ref.to, 'cm-lp-quote');
					return;
				}
				if (lineActive(ref.from)) {
					// marcas de tarefa continuam visíveis como caixa mesmo na linha ativa
					if (name !== 'ListMark') return;
				}
				switch (name) {
					case 'HeaderMark': {
						if (doc.lineAt(ref.from).from !== ref.from) return; // só a marca inicial
						hide(ref.from, doc.sliceString(ref.to, ref.to + 1) === ' ' ? ref.to + 1 : ref.to);
						return;
					}
					case 'EmphasisMark':
					case 'StrikethroughMark':
						hide(ref.from, ref.to);
						return;
					case 'CodeMark':
						if (node.parent?.name === 'InlineCode') hide(ref.from, ref.to);
						return;
					case 'QuoteMark':
						hide(ref.from, doc.sliceString(ref.to, ref.to + 1) === ' ' ? ref.to + 1 : ref.to);
						return;
					case 'HorizontalRule':
						widget(ref.from, ref.to, new RuleWidget());
						return false;
					case 'ListMark': {
						const item = node.parent;
						const marker = item?.getChild('Task')?.getChild('TaskMarker');
						if (marker) {
							if (!touchesSelection(ref.from, marker.to)) {
								const checked = /x/i.test(doc.sliceString(marker.from, marker.to));
								widget(ref.from, marker.to, new CheckboxWidget(checked, marker.from + 1));
							}
						} else if (item?.parent?.name === 'BulletList' && !lineActive(ref.from)) {
							widget(ref.from, ref.to, new BulletWidget());
						}
						return;
					}
					case 'Image': {
						const url = node.getChild('URL');
						const src = url ? doc.sliceString(url.from, url.to) : '';
						if (/^(https?:|data:image\/)/i.test(src)) {
							const alt = doc.sliceString(ref.from, ref.to).replace(/^!\[|\]\(.*$/gs, '');
							widget(ref.from, ref.to, new ImageWidget(src, alt));
						}
						return false;
					}
					case 'Link': {
						const marks = node.getChildren('LinkMark');
						const url = node.getChild('URL');
						if (marks.length >= 2 && url) {
							hide(ref.from, marks[0].to);
							if (marks[1].from > marks[0].to) {
								items.push({
									from: marks[0].to,
									to: marks[1].from,
									deco: Decoration.mark({ class: 'cm-lp-link', attributes: { 'data-url': doc.sliceString(url.from, url.to) } }),
								});
							}
							hide(marks[1].from, ref.to);
						}
						return false;
					}
				}
			},
		});

		// [[links]] e ![[embeds]] — não fazem parte da sintaxe do CommonMark
		for (let pos = from; pos <= to; ) {
			const line = doc.lineAt(pos);
			if (!activeLines.has(line.number)) {
				for (const m of line.text.matchAll(/(!?)\[\[([^\]\n]+?)\]\]/g)) {
					const start = line.from + m.index;
					if (CODE_NODE.test(tree.resolveInner(start, 1).name)) continue;
					const inner = m[2];
					if (m[1]) {
						const { target, alias } = splitLink(inner);
						const url = opts.resolveImage?.(target);
						if (url) {
							widget(start, start + m[0].length, new ImageWidget(url, target, alias && /^\d+$/.test(alias) ? Number(alias) : null));
							continue;
						}
					}
					const pipe = inner.indexOf('|');
					const openEnd = start + m[1].length + 2;
					hide(start, pipe >= 0 ? openEnd + pipe + 1 : openEnd);
					hide(start + m[0].length - 2, start + m[0].length);
				}
				// ==destaque==
				for (const m of line.text.matchAll(/==[^=\n]+==/g)) {
					const start = line.from + m.index;
					if (CODE_NODE.test(tree.resolveInner(start, 1).name)) continue;
					hide(start, start + 2);
					hide(start + m[0].length - 2, start + m[0].length);
				}
			}
			pos = line.to + 1;
		}
	}

	// Decorações de substituição não podem se sobrepor.
	items.sort((a, b) => a.from - b.from || a.to - b.to);
	const result = [];
	let lastEnd = -1;
	for (const it of items) {
		if (it.replace) {
			// plugins de visualização não podem substituir quebras de linha
			if (it.from < lastEnd || doc.lineAt(it.from).number !== doc.lineAt(it.to).number) continue;
			lastEnd = it.to;
		}
		result.push(it.deco.range(it.from, it.to));
	}
	return Decoration.set(result, true);
}

const lpTheme = EditorView.baseTheme({
	'.cm-lp-task': { margin: '0 6px 0 2px', verticalAlign: 'middle', cursor: 'pointer', accentColor: 'var(--accent)' },
	'.cm-lp-bullet': { color: 'var(--accent)', padding: '0 4px 0 2px' },
	'.cm-lp-hr': { display: 'inline-block', width: '100%', borderTop: '1px solid var(--border)', verticalAlign: 'middle' },
	'.cm-lp-quote': { borderLeft: '3px solid var(--accent)', paddingLeft: '14px !important', color: 'var(--text-muted)' },
	'.cm-lp-code': { fontFamily: 'var(--font-mono)', fontSize: '0.9em', backgroundColor: 'var(--bg-2)', paddingLeft: '12px !important' },
	'.cm-lp-img': { maxWidth: '100%', borderRadius: '6px', verticalAlign: 'middle', margin: '4px 0' },
	'.cm-lp-link': { color: 'var(--link)', textDecoration: 'underline', textDecorationColor: 'var(--link-underline)', cursor: 'pointer' },
	'.cm-lp-block': { padding: '2px 0', cursor: 'text', whiteSpace: 'normal' },
	'.cm-lp-block > *:first-child': { marginTop: '4px' },
});

export function livePreview(opts = {}) {
	const plugin = ViewPlugin.fromClass(
		class {
			constructor(view) {
				this.decorations = build(view, opts);
			}
			update(u) {
				if (u.docChanged || u.selectionSet || u.viewportChanged || syntaxTree(u.startState) !== syntaxTree(u.state)) {
					this.decorations = build(u.view, opts);
				}
			}
		},
		{ decorations: (v) => v.decorations },
	);
	return [plugin, blockField(opts), lpTheme];
}
