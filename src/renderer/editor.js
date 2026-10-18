// Editor Markdown (CodeMirror 6): destaque, [[links]] e #tags com autocompletar,
// Live Preview, prévia ao passar o mouse, atalhos de formatação e colar/arrastar arquivos.
import { EditorState, EditorSelection, Compartment, Text, Prec } from '@codemirror/state';
import {
	EditorView,
	keymap,
	drawSelection,
	dropCursor,
	highlightActiveLine,
	placeholder,
	ViewPlugin,
	Decoration,
	MatchDecorator,
	hoverTooltip,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { yamlFrontmatter } from '@codemirror/lang-yaml';
import { syntaxHighlighting, HighlightStyle, indentOnInput, bracketMatching } from '@codemirror/language';
import { autocompletion, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { tags as t } from '@lezer/highlight';
import { livePreview } from './livepreview.js';

const heading = (size) => ({ fontSize: size, fontWeight: '700', color: 'var(--heading)' });

const highlight = HighlightStyle.define([
	{ tag: t.heading1, ...heading('1.75em') },
	{ tag: t.heading2, ...heading('1.45em') },
	{ tag: t.heading3, ...heading('1.25em') },
	{ tag: t.heading4, ...heading('1.1em') },
	{ tag: [t.heading5, t.heading6], ...heading('1em') },
	{ tag: t.strong, fontWeight: '700' },
	{ tag: t.emphasis, fontStyle: 'italic' },
	{ tag: t.strikethrough, textDecoration: 'line-through' },
	{ tag: [t.link, t.url], color: 'var(--link)' },
	{ tag: t.monospace, fontFamily: 'var(--font-mono)', fontSize: '0.9em', color: 'var(--code)' },
	{ tag: t.quote, color: 'var(--text-muted)', fontStyle: 'italic' },
	{ tag: [t.processingInstruction, t.meta, t.contentSeparator], color: 'var(--text-faint)' },
	{ tag: [t.definition(t.propertyName), t.propertyName], color: 'var(--text-muted)' },
	{ tag: t.string, color: 'var(--text)' },
]);

const theme = EditorView.theme({
	'&': { height: '100%', backgroundColor: 'transparent', color: 'var(--text)' },
	'&.cm-focused': { outline: 'none' },
	'.cm-scroller': { fontFamily: 'var(--font-text)', fontSize: 'var(--font-size)', lineHeight: '1.7' },
	'.cm-content': { maxWidth: 'var(--line-width)', margin: '0 auto', padding: '4px 32px 45vh', caretColor: 'var(--accent)' },
	'.cm-line': { padding: '0' },
	'.cm-activeLine': { backgroundColor: 'transparent' },
	'.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--accent)', borderLeftWidth: '2px' },
	'&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground': {
		backgroundColor: 'var(--selection)',
	},
	'.cm-selectionMatch': { backgroundColor: 'var(--selection-soft)' },
	'.cm-placeholder': { color: 'var(--text-faint)' },
	'.cm-tooltip': { backgroundColor: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' },
	'.cm-tooltip-autocomplete > ul': { fontFamily: 'var(--font-ui)', maxHeight: '260px' },
	'.cm-tooltip-autocomplete > ul > li': { padding: '4px 10px' },
	'.cm-tooltip-autocomplete > ul > li[aria-selected]': { backgroundColor: 'var(--accent)', color: 'var(--on-accent)' },
	'.cm-completionDetail': { color: 'var(--text-faint)', marginLeft: '8px', fontStyle: 'normal' },
	'.cm-tooltip-hover': { border: 'none', background: 'none' },
	'.cm-panels': { backgroundColor: 'var(--bg-2)', color: 'var(--text)', borderColor: 'var(--border)' },
	'.cm-panel.cm-search input, .cm-panel.cm-search button': { fontFamily: 'var(--font-ui)' },
	'.cm-wikilink': { color: 'var(--link)', textDecoration: 'underline', textDecorationColor: 'var(--link-underline)' },
	'.cm-tag': { color: 'var(--accent)' },
	'.cm-highlight': { backgroundColor: 'var(--highlight)', borderRadius: '2px' },
	'.cm-comment': { color: 'var(--text-faint)', fontStyle: 'italic' },
});

const decorate = (matcher) =>
	ViewPlugin.fromClass(
		class {
			constructor(view) {
				this.decorations = matcher.createDeco(view);
			}
			update(update) {
				this.decorations = matcher.updateDeco(update, this.decorations);
			}
		},
		{ decorations: (v) => v.decorations },
	);

const markMatcher = (regexp, cls) => decorate(new MatchDecorator({ regexp, decoration: Decoration.mark({ class: cls }) }));

/* ---------- comandos de formatação ---------- */

function toggleWrap(marker) {
	const len = marker.length;
	return (view) => {
		const { doc } = view.state;
		view.dispatch(
			view.state.changeByRange((range) => {
				const { from, to } = range;
				if (doc.sliceString(from - len, from) === marker && doc.sliceString(to, to + len) === marker) {
					return {
						changes: [{ from: from - len, to: from }, { from: to, to: to + len }],
						range: EditorSelection.range(from - len, to - len),
					};
				}
				const inner = doc.sliceString(from, to);
				if (inner.length >= 2 * len && inner.startsWith(marker) && inner.endsWith(marker)) {
					return { changes: { from, to, insert: inner.slice(len, -len) }, range: EditorSelection.range(from, to - 2 * len) };
				}
				return {
					changes: [{ from, insert: marker }, { from: to, insert: marker }],
					range: EditorSelection.range(from + len, to + len),
				};
			}),
			{ userEvent: 'input' },
		);
		return true;
	};
}

function insertLink(view) {
	view.dispatch(
		view.state.changeByRange(({ from, to }) => {
			const text = view.state.sliceDoc(from, to);
			if (/^https?:\/\/\S+$/.test(text)) {
				return { changes: { from, to, insert: `[](${text})` }, range: EditorSelection.cursor(from + 1) };
			}
			const insert = `[${text}]()`;
			return { changes: { from, to, insert }, range: EditorSelection.cursor(from + insert.length - 1) };
		}),
		{ userEvent: 'input' },
	);
	return true;
}

// Linha comum -> "- [ ] ", lista -> tarefa, tarefa -> alterna [ ]/[x]
function toggleTask(view) {
	const { state } = view;
	const changes = [];
	const seen = new Set();
	for (const r of state.selection.ranges) {
		for (let pos = r.from; pos <= r.to; ) {
			const line = state.doc.lineAt(pos);
			if (!seen.has(line.number)) {
				seen.add(line.number);
				const m = /^(\s*)([-*+]|\d+[.)])?(\s*)(\[([ xX])\]\s?)?/.exec(line.text);
				if (m[4]) {
					const at = line.from + m[1].length + (m[2]?.length ?? 0) + m[3].length + 1;
					changes.push({ from: at, to: at + 1, insert: m[5] === ' ' ? 'x' : ' ' });
				} else if (m[2]) {
					changes.push({ from: line.from + m[1].length + m[2].length + m[3].length, insert: m[3] ? '[ ] ' : ' [ ] ' });
				} else {
					changes.push({ from: line.from + m[1].length, insert: '- [ ] ' });
				}
			}
			pos = line.to + 1;
		}
	}
	view.dispatch({ changes, userEvent: 'input' });
	return true;
}

function setHeading(view, level) {
	const changes = [];
	const seen = new Set();
	for (const r of view.state.selection.ranges) {
		const line = view.state.doc.lineAt(r.head);
		if (seen.has(line.number)) continue;
		seen.add(line.number);
		const m = /^#{0,6}\s*/.exec(line.text);
		changes.push({ from: line.from, to: line.from + m[0].length, insert: level ? '#'.repeat(level) + ' ' : '' });
	}
	view.dispatch({ changes, userEvent: 'input' });
	view.focus();
}

/* ---------- editor ---------- */

export function createEditor(parent, opts) {
	let settings = { livePreview: true, spellcheck: true };
	const lpCompartment = new Compartment();
	const attrCompartment = new Compartment();

	const lpOptions = {
		resolveImage: opts.resolveImage,
		renderBlock: opts.renderBlock,
		onOpenLink: (inner) => opts.onOpenLink(inner, {}),
		onOpenUrl: opts.onOpenUrl,
	};
	const lpExtension = () => (settings.livePreview ? livePreview(lpOptions) : []);
	const attrExtension = () => EditorView.contentAttributes.of({ spellcheck: String(settings.spellcheck), lang: 'pt-BR' });

	const applyCompletion = (text, suffix) => (view, _completion, from, to) => {
		const closed = view.state.sliceDoc(to, to + suffix.length) === suffix;
		view.dispatch({
			changes: { from, to, insert: closed ? text : text + suffix },
			selection: { anchor: from + text.length + suffix.length },
			userEvent: 'input.complete',
		});
	};

	// "[[nome" -> notas; "[[nome#" -> títulos dessa nota
	const wikiComplete = (ctx) => {
		const withHeading = ctx.matchBefore(/\[\[([^\[\]|#\n]*)#([^\[\]|\n]*)/);
		if (withHeading) {
			const target = /\[\[([^\[\]|#\n]*)#/.exec(withHeading.text)[1];
			return {
				from: withHeading.from + withHeading.text.indexOf('#') + 1,
				options: opts.getHeadings(target).map((h) => ({ label: h.text, detail: 'H' + h.level, apply: applyCompletion(h.text, ']]') })),
				validFor: /^[^\[\]|\n]*$/,
			};
		}
		const m = ctx.matchBefore(/\[\[[^\[\]|#\n]*/);
		if (!m) return null;
		return {
			from: m.from + 2,
			options: opts.getNotes().map((n) => ({ label: n.name, detail: n.folder || undefined, apply: applyCompletion(n.name, ']]') })),
			validFor: /^[^\[\]|#\n]*$/,
		};
	};

	const tagComplete = (ctx) => {
		const m = ctx.matchBefore(/(?<=^|\s)#[\p{L}\p{N}_\/-]+/u);
		if (!m) return null;
		return {
			from: m.from + 1,
			options: opts.getTags().map(([tag, count]) => ({ label: tag, detail: String(count) })),
			validFor: /^[\p{L}\p{N}_\/-]*$/u,
		};
	};

	const linkAt = (view, pos) => {
		const line = view.state.doc.lineAt(pos);
		const offset = pos - line.from;
		for (const m of line.text.matchAll(/!?\[\[([^\]\n]+)\]\]/g)) {
			if (offset >= m.index && offset <= m.index + m[0].length) return { inner: m[1], from: line.from + m.index, to: line.from + m.index + m[0].length };
		}
		return null;
	};

	// Ctrl+clique abre [[links]] e URLs
	const onMouseDown = (event, view) => {
		if (!(event.ctrlKey || event.metaKey) || event.button !== 0) return false;
		const lpLink = event.target.closest?.('.cm-lp-link');
		if (lpLink?.dataset.url) {
			event.preventDefault();
			opts.onOpenUrl(lpLink.dataset.url);
			return true;
		}
		const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
		if (pos == null) return false;
		const link = linkAt(view, pos);
		if (link) {
			event.preventDefault();
			opts.onOpenLink(link.inner, { newTab: event.shiftKey });
			return true;
		}
		const line = view.state.doc.lineAt(pos);
		for (const m of line.text.matchAll(/https?:\/\/[^\s)>\]]+/g)) {
			if (pos - line.from >= m.index && pos - line.from <= m.index + m[0].length) {
				event.preventDefault();
				opts.onOpenUrl(m[0]);
				return true;
			}
		}
		return false;
	};

	const insertAt = (view, pos, text) => {
		view.dispatch({ changes: { from: pos, insert: text }, selection: { anchor: pos + text.length }, userEvent: 'input' });
		view.focus();
	};

	const insertFiles = async (view, files, pos) => {
		const links = [];
		for (const file of files) {
			const link = await opts.onFile(file);
			if (link) links.push(link);
		}
		if (links.length) insertAt(view, pos, links.join('\n'));
	};

	const domHandlers = EditorView.domEventHandlers({
		mousedown: onMouseDown,
		paste(event, view) {
			const files = [...(event.clipboardData?.files ?? [])];
			if (!files.length) return false;
			event.preventDefault();
			insertFiles(view, files, view.state.selection.main.head);
			return true;
		},
		drop(event, view) {
			const dt = event.dataTransfer;
			const pos = view.posAtCoords({ x: event.clientX, y: event.clientY }) ?? view.state.selection.main.head;
			const internal = dt?.getData('text/briefing-path');
			if (internal) {
				event.preventDefault();
				const { path } = JSON.parse(internal);
				insertAt(view, pos, opts.linkFor(path));
				return true;
			}
			const files = [...(dt?.files ?? [])];
			if (!files.length) return false;
			event.preventDefault();
			insertFiles(view, files, pos);
			return true;
		},
	});

	const hover = hoverTooltip(
		(view, pos) => {
			const link = linkAt(view, pos);
			if (!link) return null;
			const html = opts.renderPreview(link.inner);
			if (!html) return null;
			return {
				pos: link.from,
				end: link.to,
				above: false,
				create() {
					const dom = document.createElement('div');
					dom.className = 'hover-preview markdown';
					dom.innerHTML = html;
					return { dom };
				},
			};
		},
		{ hoverTime: 450 },
	);

	const formatKeymap = Prec.high(
		keymap.of([
			{ key: 'Mod-b', run: toggleWrap('**') },
			{ key: 'Mod-i', run: toggleWrap('*') },
			{ key: 'Mod-Shift-x', run: toggleWrap('~~') },
			{ key: 'Mod-Shift-h', run: toggleWrap('==') },
			{ key: 'Mod-`', run: toggleWrap('`') },
			{ key: 'Mod-k', run: insertLink },
			{ key: 'Mod-l', run: toggleTask },
		]),
	);

	const extensions = [
		history(),
		drawSelection(),
		dropCursor(),
		indentOnInput(),
		bracketMatching(),
		closeBrackets(),
		highlightActiveLine(),
		highlightSelectionMatches(),
		EditorState.languageData.of(() => [{ closeBrackets: { brackets: ['(', '[', '{', '`'] } }]),
		autocompletion({ override: [wikiComplete, tagComplete], icons: false }),
		yamlFrontmatter({ content: markdown({ base: markdownLanguage }) }),
		syntaxHighlighting(highlight),
		EditorView.lineWrapping,
		attrCompartment.of(attrExtension()),
		lpCompartment.of(lpExtension()),
		placeholder('Comece a escrever…  Use [[ para criar links e #tags para organizar.'),
		markMatcher(/!?\[\[[^\]\n]+\]\]/g, 'cm-wikilink'),
		markMatcher(/(?<=^|\s)#[\p{L}\p{N}_\/-]*[\p{L}_\/-][\p{L}\p{N}_\/-]*/gu, 'cm-tag'),
		markMatcher(/==[^=\n]+==/g, 'cm-highlight'),
		markMatcher(/%%[^%\n]*%%/g, 'cm-comment'),
		formatKeymap,
		keymap.of([...closeBracketsKeymap, ...searchKeymap, ...historyKeymap, ...defaultKeymap, indentWithTab]),
		domHandlers,
		hover,
		EditorView.updateListener.of((u) => {
			if (u.docChanged) opts.onChange(u.state.doc.toString());
			if (u.selectionSet || u.docChanged) opts.onSelection?.(u.state);
		}),
		theme,
	];

	const createState = (text, selection) => EditorState.create({ doc: text, extensions, selection });
	const view = new EditorView({ parent, state: createState('') });

	// Estados guardados por aba podem ter configuração antiga: reaplica a atual.
	const syncConfig = () => {
		view.dispatch({ effects: [lpCompartment.reconfigure(lpExtension()), attrCompartment.reconfigure(attrExtension())] });
	};

	return {
		view,
		getState: () => view.state,
		setState(state) {
			view.setState(state);
			syncConfig();
		},
		getScroll: () => view.scrollDOM.scrollTop,
		setScroll(top) {
			requestAnimationFrame(() => {
				view.scrollDOM.scrollTop = top;
			});
		},
		setDoc(text, { keepSelection = false } = {}) {
			const doc = Text.of(text.split(/\r\n?|\n/));
			const length = doc.length;
			const sel = view.state.selection.main;
			const scroll = view.scrollDOM.scrollTop;
			let selection;
			if (keepSelection) {
				selection = { anchor: Math.min(sel.anchor, length), head: Math.min(sel.head, length) };
			} else if (doc.lines > 2 && doc.line(1).text === '---') {
				// abre com o cursor logo depois das propriedades (assim elas aparecem renderizadas)
				for (let n = 2; n <= Math.min(doc.lines, 200); n++) {
					if (doc.line(n).text === '---') {
						selection = { anchor: Math.min(doc.line(n).to + 1, length) };
						break;
					}
				}
			}
			view.setState(createState(text, selection));
			syncConfig();
			view.scrollDOM.scrollTop = keepSelection ? scroll : 0;
		},
		configure(next) {
			settings = { ...settings, ...next };
			syncConfig();
		},
		focus: () => view.focus(),
		insert(text) {
			view.dispatch(view.state.replaceSelection(text));
			view.focus();
		},
		setHeading: (level) => setHeading(view, level),
		run(command) {
			const commands = { bold: toggleWrap('**'), italic: toggleWrap('*'), strike: toggleWrap('~~'), highlight: toggleWrap('=='), code: toggleWrap('`'), link: insertLink, task: toggleTask };
			commands[command]?.(view);
			view.focus();
		},
		scrollToLine(n) {
			const doc = view.state.doc;
			const line = doc.line(Math.max(1, Math.min(n + 1, doc.lines)));
			view.dispatch({
				selection: { anchor: line.from },
				effects: EditorView.scrollIntoView(line.from, { y: 'start', yMargin: 60 }),
			});
			view.focus();
		},
	};
}
