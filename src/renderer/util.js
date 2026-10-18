export function debounce(fn, ms) {
	let timer;
	const wrapped = (...args) => {
		clearTimeout(timer);
		timer = setTimeout(() => fn(...args), ms);
	};
	wrapped.cancel = () => clearTimeout(timer);
	return wrapped;
}

export function el(tag, cls, text) {
	const node = document.createElement(tag);
	if (cls) node.className = cls;
	if (text != null) node.textContent = text;
	return node;
}

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
export const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Minúsculas e sem acentos, preservando o comprimento de textos em NFC.
export const normalizeText = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Pontuação simples: substring vale mais que subsequência; -1 = não casa.
export function fuzzyScore(query, text) {
	const q = normalizeText(query.trim());
	const s = normalizeText(text);
	if (!q) return 1;
	const at = s.indexOf(q);
	if (at >= 0) return 1000 - at * 2 - (s.length - q.length) * 0.1;
	let qi = 0;
	let score = 0;
	let last = -2;
	for (let si = 0; si < s.length && qi < q.length; si++) {
		if (s[si] === q[qi]) {
			score += last === si - 1 ? 5 : 1;
			last = si;
			qi++;
		}
	}
	return qi === q.length ? score : -1;
}

export const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i;
export const isNote = (p) => /\.md$/i.test(p);
export const basename = (p) => p.slice(p.lastIndexOf('/') + 1);
export const dirname = (p) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '');
export const noteName = (p) => basename(p).replace(/\.md$/i, '');

const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
export const MONTH_NAMES = MONTHS;

// Formato com tokens: YYYY MM DD HH mm ss dddd MMMM. Texto entre [colchetes] é literal.
export function formatDate(d, fmt = 'YYYY-MM-DD') {
	const z = (n) => String(n).padStart(2, '0');
	return fmt.replace(/\[([^\]]*)\]|YYYY|MMMM|MM|DD|dddd|HH|mm|ss/g, (token, literal) => {
		if (literal != null) return literal;
		switch (token) {
			case 'YYYY': return String(d.getFullYear());
			case 'MMMM': return MONTHS[d.getMonth()];
			case 'MM': return z(d.getMonth() + 1);
			case 'DD': return z(d.getDate());
			case 'dddd': return WEEKDAYS[d.getDay()];
			case 'HH': return z(d.getHours());
			case 'mm': return z(d.getMinutes());
			case 'ss': return z(d.getSeconds());
			default: return token;
		}
	});
}

export const todayStamp = (d = new Date()) => formatDate(d, 'YYYY-MM-DD');

export function longDate(d = new Date()) {
	const s = formatDate(d, 'dddd, DD [de] MMMM [de] YYYY');
	return s.charAt(0).toUpperCase() + s.slice(1);
}

export function countWords(text) {
	return (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length;
}

// Trecho de uma nota a partir de um título até o próximo título de mesmo nível ou superior.
export function sectionOf(text, heading) {
	const lines = text.split('\n');
	const wanted = normalizeText(heading.trim());
	let start = -1;
	let level = 0;
	for (let i = 0; i < lines.length; i++) {
		const h = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(lines[i]);
		if (!h) continue;
		if (start < 0 && normalizeText(h[2]) === wanted) {
			start = i;
			level = h[1].length;
		} else if (start >= 0 && h[1].length <= level) {
			return lines.slice(start, i).join('\n');
		}
	}
	return start >= 0 ? lines.slice(start).join('\n') : null;
}
