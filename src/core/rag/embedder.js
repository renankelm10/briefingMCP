// Embeddings locais: transforma texto em vetores de significado, rodando 100% neste PC.
// Modelo multilíngue (bom em português). Baixado uma única vez e guardado em cache.
// Opcional: com a busca por significado desligada o modelo nem é carregado.
const { modelsDir } = require('../paths');

const MODEL = 'Xenova/multilingual-e5-small';
const DIMS = 384;
const BATCH = 16;
// Sem uso por este tempo, o modelo sai da memória; volta do cache em disco em ~1 s.
const IDLE_MS = 5 * 60 * 1000;
// O onnxruntime guarda por padrão uma "arena" do tamanho do maior lote já processado e nunca a
// devolve ao sistema (era a maior parte da memória do app). Sem ela, cada lote libera o que usou.
const SESSION_OPTIONS = { enableCpuMemArena: false, enableMemPattern: false };

const defaultCacheDir = () => modelsDir();

class Embedder {
	constructor({ cacheDir = defaultCacheDir(), log = () => {}, enabled = () => true, idleMs = IDLE_MS } = {}) {
		this.cacheDir = cacheDir;
		this.log = log;
		this.isEnabled = enabled;
		this.idleMs = idleMs;
		this.model = MODEL;
		this.dims = DIMS;
		this.loading = null;
		this.error = null;
		this.loaded = false; // true quando o modelo está pronto na memória
		this.cached = false; // já carregou uma vez: recarregar é rápido (está no disco)
		this.busy = 0;
		this.idleTimer = null;
	}

	get enabled() {
		return !!this.isEnabled();
	}

	async load() {
		if (!this.enabled) throw new Error('busca por significado desligada');
		this.loading ??= (async () => {
			const { pipeline, env } = await import('@huggingface/transformers');
			env.cacheDir = this.cacheDir;
			env.allowLocalModels = true;
			if (!this.cached) this.log(`carregando modelo de embeddings ${MODEL} (primeira vez baixa ~120 MB)`);
			// O app e o servidor MCP compartilham o cache: se os dois baixarem o modelo ao mesmo
			// tempo, no Windows um não consegue substituir o arquivo que o outro já abriu (EPERM/EBUSY).
			// Esperar e tentar de novo resolve: na segunda vez o modelo já está no cache.
			for (let attempt = 1; ; attempt++) {
				try {
					const extractor = await pipeline('feature-extraction', MODEL, { dtype: 'q8', session_options: SESSION_OPTIONS });
					this.loaded = true;
					this.cached = true;
					this.touch();
					return extractor;
				} catch (err) {
					const busy = /EPERM|EBUSY|EACCES|ENOENT|ENOTEMPTY/.test(`${err?.code} ${err?.message}`);
					if (!busy || attempt >= 5) throw err;
					this.log(`modelo ocupado por outro processo; tentando de novo (${attempt}/4)`);
					await new Promise((r) => setTimeout(r, 1500 * attempt));
				}
			}
		})().catch((err) => {
			this.error = err;
			this.loading = null;
			throw err;
		});
		return this.loading;
	}

	// Reinicia a contagem de ociosidade.
	touch() {
		clearTimeout(this.idleTimer);
		if (!this.idleMs) return;
		this.idleTimer = setTimeout(() => this.unload(), this.idleMs);
		this.idleTimer.unref?.();
	}

	// Tira o modelo da memória (seguro: espera lotes em andamento).
	async unload() {
		clearTimeout(this.idleTimer);
		if (!this.loading) return;
		if (this.busy) return this.touch();
		const pending = this.loading;
		this.loading = null;
		this.loaded = false;
		try {
			const extractor = await pending;
			await extractor.dispose?.();
		} catch {
			// falhou ao carregar: nada a liberar
		}
		global.gc?.();
	}

	// O modelo e5 espera prefixos "query:" e "passage:".
	async embed(texts, kind = 'passage') {
		this.busy++;
		try {
			const extractor = await this.load();
			const out = [];
			for (let i = 0; i < texts.length; i += BATCH) {
				const batch = texts.slice(i, i + BATCH).map((t) => `${kind}: ${t}`);
				const tensor = await extractor(batch, { pooling: 'mean', normalize: true });
				const data = tensor.data;
				for (let j = 0; j < batch.length; j++) out.push(Float32Array.from(data.subarray(j * DIMS, (j + 1) * DIMS)));
				tensor.dispose?.();
			}
			return out;
		} finally {
			this.busy--;
			this.touch();
		}
	}
}

module.exports = { Embedder, MODEL, DIMS, defaultCacheDir };
