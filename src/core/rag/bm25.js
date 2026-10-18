// Busca por palavras (BM25): ótima para nomes próprios, siglas, números e termos exatos.
const STOPWORDS = new Set(
	('a o os as um uma uns umas de do da dos das em no na nos nas por pelo pela pelos pelas para pra com sem sob sobre ' +
		'e ou mas que se como quando onde qual quais quem cujo isso isto aquilo esse essa este esta ele ela eles elas ' +
		'eu tu voce voces nos vos me te lhe lhes seu sua seus suas meu minha meus minhas nosso nossa ao aos ja nao sim ' +
		'mais menos muito muita muitos muitas ser estar ter foi era sao esta estao tem ha the of and to in is for on with').split(' '),
);

function tokenize(text) {
	return text
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.split(/[^\p{L}\p{N}]+/u)
		.filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

class Bm25 {
	constructor(docs, { k1 = 1.4, b = 0.75 } = {}) {
		this.k1 = k1;
		this.b = b;
		this.docs = docs.map((text) => {
			const tf = new Map();
			const tokens = tokenize(text);
			for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
			return { tf, length: tokens.length };
		});
		this.avgLength = this.docs.reduce((s, d) => s + d.length, 0) / Math.max(1, this.docs.length);
		this.df = new Map();
		for (const d of this.docs) for (const t of d.tf.keys()) this.df.set(t, (this.df.get(t) || 0) + 1);
	}

	search(query, limit = 50) {
		const terms = [...new Set(tokenize(query))];
		if (!terms.length) return [];
		const n = this.docs.length;
		const scores = [];
		this.docs.forEach((doc, i) => {
			let score = 0;
			for (const term of terms) {
				const f = doc.tf.get(term);
				if (!f) continue;
				const df = this.df.get(term);
				const idf = Math.log(1 + (n - df + 0.5) / (df + 0.5));
				score += (idf * f * (this.k1 + 1)) / (f + this.k1 * (1 - this.b + (this.b * doc.length) / this.avgLength));
			}
			if (score > 0) scores.push({ index: i, score });
		});
		return scores.sort((a, b) => b.score - a.score).slice(0, limit);
	}
}

module.exports = { Bm25, tokenize };
