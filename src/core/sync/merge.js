// Vetores de versão e mesclagem de texto em 3 vias.
const { diff3Merge } = require('node-diff3');

// Cada PC tem um contador próprio; o vetor diz "quais edições de cada PC esta versão já contém".
function compareVersions(a = {}, b = {}) {
	let aBigger = false;
	let bBigger = false;
	for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
		const x = a[key] ?? 0;
		const y = b[key] ?? 0;
		if (x > y) aBigger = true;
		if (y > x) bBigger = true;
	}
	if (aBigger && bBigger) return 'concurrent';
	if (aBigger) return 'greater';
	if (bBigger) return 'less';
	return 'equal';
}

function unionVersions(a = {}, b = {}) {
	const out = { ...a };
	for (const [key, value] of Object.entries(b)) out[key] = Math.max(out[key] ?? 0, value);
	return out;
}

// Mescla linha a linha (como o git). Retorna null se as duas versões mexeram no mesmo trecho.
function mergeText(base, mine, theirs) {
	if (mine === theirs) return mine;
	if (base === mine) return theirs;
	if (base === theirs) return mine;
	const regions = diff3Merge(mine.split('\n'), base.split('\n'), theirs.split('\n'), { excludeFalseConflicts: true });
	const out = [];
	for (const region of regions) {
		if (!region.ok) return null;
		out.push(...region.ok);
	}
	return out.join('\n');
}

const TEXT_EXT = /\.(md|markdown|txt|json|csv|tsv|ya?ml|canvas|html?|css|js|ts|xml|svg|ini|toml)$/i;
const isTextPath = (p) => TEXT_EXT.test(p);

module.exports = { compareVersions, unionVersions, mergeText, isTextPath };
