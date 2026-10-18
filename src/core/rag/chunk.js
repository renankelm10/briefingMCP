// Divide uma nota em trechos pequenos e autocontidos para a busca.
// Cada trecho leva o título da nota e o caminho de títulos ("Nota › Seção › Subseção"),
// assim um trecho isolado ainda faz sentido para o Claude.
const crypto = require('crypto');

const MAX_CHARS = 1400;
const MIN_CHARS = 200;

function splitFrontmatter(text) {
	const m = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(text);
	if (!m) return { props: '', body: text, offset: 0 };
	return { props: m[1].trim(), body: text.slice(m[0].length), offset: (m[0].match(/\n/g) || []).length };
}

// Quebra um bloco grande em pedaços nos limites de parágrafo (ou de linha, se preciso).
function splitLong(text) {
	if (text.length <= MAX_CHARS) return [text];
	const parts = [];
	let current = '';
	for (const para of text.split(/\n{2,}/)) {
		const pieces = para.length > MAX_CHARS ? para.match(new RegExp(`[\\s\\S]{1,${MAX_CHARS}}(?=\\s|$)`, 'g')) ?? [para] : [para];
		for (const piece of pieces) {
			if (current && current.length + piece.length + 2 > MAX_CHARS) {
				parts.push(current);
				current = '';
			}
			current = current ? `${current}\n\n${piece}` : piece;
		}
	}
	if (current) parts.push(current);
	return parts;
}

function chunkNote(rel, text) {
	const title = rel.split('/').pop().replace(/\.(md|markdown|txt)$/i, '');
	const { props, body, offset } = splitFrontmatter(text.replace(/^﻿/, ''));
	const lines = body.split(/\r?\n/);
	const sections = [];
	let trail = [];
	let current = { heading: '', line: offset, lines: [] };
	let fence = false;
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (/^\s*(```|~~~)/.test(line)) fence = !fence;
		const h = !fence && /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
		if (h) {
			sections.push(current);
			const level = h[1].length;
			trail = [...trail.filter((t) => t.level < level), { level, text: h[2] }];
			current = { heading: trail.map((t) => t.text).join(' › '), line: offset + i, lines: [] };
			continue;
		}
		current.lines.push(line);
	}
	sections.push(current);

	const chunks = [];
	const push = (heading, line, content) => {
		const clean = content.replace(/%%[\s\S]*?%%/g, '').trim();
		if (!clean) return;
		const context = heading ? `${title} › ${heading}` : title;
		chunks.push({ rel, title, heading, line, text: clean, context });
	};
	if (props) push('Propriedades', 0, props);

	// Junta seções muito curtas com a seguinte para não gerar trechos sem conteúdo.
	let pending = null;
	for (const section of sections) {
		const content = section.lines.join('\n').trim();
		if (!content && !pending) continue;
		if (pending) {
			pending.content = [pending.content, section.heading ? `## ${section.heading.split(' › ').pop()}` : '', content].filter(Boolean).join('\n');
		} else {
			pending = { heading: section.heading, line: section.line, content };
		}
		if (pending.content.length >= MIN_CHARS) {
			for (const piece of splitLong(pending.content)) push(pending.heading, pending.line, piece);
			pending = null;
		}
	}
	if (pending) for (const piece of splitLong(pending.content)) push(pending.heading, pending.line, piece);
	if (!chunks.length) push('', 0, title); // nota vazia ainda é encontrável pelo nome

	for (const c of chunks) {
		c.id = crypto.createHash('sha1').update(`${c.context}\n${c.text}`).digest('hex').slice(0, 16);
	}
	return chunks;
}

module.exports = { chunkNote };
