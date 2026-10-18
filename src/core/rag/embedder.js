// Embeddings locais: transforma texto em vetores de significado, rodando 100% neste PC.
// Modelo multilíngue (bom em português). Baixado uma única vez e guardado em cache.
const { modelsDir } = require('../paths');

const MODEL = 'Xenova/multilingual-e5-small';
const DIMS = 384;
const BATCH = 16;

const defaultCacheDir = () => modelsDir();

class Embedder {
	constructor({ cacheDir = defaultCacheDir(), log = () => {} } = {}) {
		this.cacheDir = cacheDir;
		this.log = log;
		this.model = MODEL;
		this.dims = DIMS;
		this.loading = null;
		this.error = null;
	}

	async load() {
		this.loading ??= (async () => {
			const { pipeline, env } = await import('@huggingface/transformers');
			env.cacheDir = this.cacheDir;
			env.allowLocalModels = true;
			this.log(`carregando modelo de embeddings ${MODEL} (primeira vez baixa ~120 MB)`);
			return pipeline('feature-extraction', MODEL, { dtype: 'q8' });
		})().catch((err) => {
			this.error = err;
			this.loading = null;
			throw err;
		});
		return this.loading;
	}

	// O modelo e5 espera prefixos "query:" e "passage:".
	async embed(texts, kind = 'passage') {
		const extractor = await this.load();
		const out = [];
		for (let i = 0; i < texts.length; i += BATCH) {
			const batch = texts.slice(i, i + BATCH).map((t) => `${kind}: ${t}`);
			const tensor = await extractor(batch, { pooling: 'mean', normalize: true });
			const data = tensor.data;
			for (let j = 0; j < batch.length; j++) out.push(Float32Array.from(data.subarray(j * DIMS, (j + 1) * DIMS)));
		}
		return out;
	}
}

module.exports = { Embedder, MODEL, DIMS, defaultCacheDir };
