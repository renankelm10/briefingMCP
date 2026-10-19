// "Segundo cérebro": índice de busca de um vault (palavras + significado), incremental.
// Fica em <vault>/.briefing/brain/index.bin — um único arquivo, gravado de forma atômica.
// Formato: [4 bytes: tamanho do JSON][JSON com notas e trechos][Float32 com os vetores].
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const crypto = require('crypto');
const { chunkNote } = require('./chunk');
const { Bm25 } = require('./bm25');

const FORMAT = 2;
const NOTE_EXT = /\.(md|markdown|txt)$/i;
const MAX_NOTE = 5 * 1024 * 1024;
const RRF_K = 60;
const EMBED_RETRY_MS = 30_000;

const sha1 = (s) => crypto.createHash('sha1').update(s).digest('hex');

class Brain {
	constructor({ folder, embedder = null, log = () => {} }) {
		this.folder = path.resolve(folder);
		this.embedder = embedder;
		this.log = log;
		this.files = {}; // rel -> { mtime, size, hash }
		this.chunks = []; // { id, rel, title, heading, line, text, context, embedded }
		this.vectors = new Float32Array(0);
		this.dims = embedder?.dims ?? 384;
		this.model = embedder?.model ?? null;
		this.loaded = false;
		this.refreshing = null;
		this.refreshingEmbeds = false;
		this.bm25 = null;
		this.updatedAt = null;
		this.lastRefresh = 0;
		this.embedError = null;
	}

	// Uma falha ao carregar o modelo (rede, arquivo ocupado) não desliga a busca por significado
	// para sempre: depois de um tempo, tenta de novo.
	semanticReady() {
		if (this.embedError && Date.now() - this.embedErrorAt > EMBED_RETRY_MS) this.embedError = null;
		return !!this.embedder && !this.embedError;
	}

	failEmbed(err) {
		this.embedError = err;
		this.embedErrorAt = Date.now();
	}

	// Força a próxima consulta a reler o disco.
	invalidate() {
		this.lastRefresh = 0;
	}

	// Observa a pasta: qualquer nota alterada (por você, pelo Claude ou pela sincronização)
	// invalida o índice, que se atualiza na próxima busca.
	watch() {
		if (this.watcher) return;
		try {
			this.watcher = fs.watch(this.folder, { recursive: true }, (_event, filename) => {
				if (filename && NOTE_EXT.test(filename) && !filename.split(path.sep).some((s) => s.startsWith('.'))) this.invalidate();
			});
			this.watcher.on('error', () => {});
		} catch {
			// sem observador: o índice ainda se atualiza pelo intervalo
		}
	}

	close() {
		this.watcher?.close();
		this.watcher = null;
	}

	indexFile() {
		return path.join(this.folder, '.briefing', 'brain', 'index.bin');
	}

	async load() {
		if (this.loaded) return;
		this.loaded = true;
		try {
			const buf = await fsp.readFile(this.indexFile());
			const jsonLength = buf.readUInt32LE(0);
			const meta = JSON.parse(buf.subarray(4, 4 + jsonLength).toString('utf8'));
			if (meta.format !== FORMAT || (this.model && meta.model && meta.model !== this.model)) return;
			const offset = 4 + jsonLength;
			const bytes = buf.subarray(offset);
			this.vectors = new Float32Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
			this.files = meta.files;
			this.chunks = meta.chunks;
			this.dims = meta.dims;
			this.updatedAt = meta.updatedAt;
		} catch {
			// sem índice ainda
		}
	}

	async save() {
		const meta = { format: FORMAT, model: this.model, dims: this.dims, updatedAt: this.updatedAt, files: this.files, chunks: this.chunks };
		const json = Buffer.from(JSON.stringify(meta), 'utf8');
		const header = Buffer.alloc(4);
		header.writeUInt32LE(json.length);
		const vectors = Buffer.from(this.vectors.buffer, this.vectors.byteOffset, this.vectors.byteLength);
		const file = this.indexFile();
		await fsp.mkdir(path.dirname(file), { recursive: true });
		const tmp = `${file}.${process.pid}.tmp`;
		await fsp.writeFile(tmp, Buffer.concat([header, json, vectors]));
		await fsp.rename(tmp, file);
	}

	async walk(dir = this.folder, prefix = '', out = []) {
		let entries;
		try {
			entries = await fsp.readdir(dir, { withFileTypes: true });
		} catch {
			return out;
		}
		for (const entry of entries) {
			if (entry.name.startsWith('.')) continue;
			const rel = (prefix ? `${prefix}/${entry.name}` : entry.name).normalize('NFC');
			if (entry.isDirectory()) await this.walk(path.join(dir, entry.name), rel, out);
			else if (entry.isFile() && NOTE_EXT.test(entry.name)) out.push(rel);
		}
		return out;
	}

	// Atualiza só o que mudou desde a última vez. `maxAge` evita varrer o disco a cada consulta.
	// `embed: false` atualiza só o texto (busca por palavras), sem esperar o modelo de IA.
	async refresh({ maxAge = 0, onProgress, embed = true } = {}) {
		await this.load();
		if (maxAge && Date.now() - this.lastRefresh < maxAge) return false;
		if (!this.refreshing) {
			this.refreshingEmbeds = embed; // a busca só espera atualizações que não dependem do modelo
			this.refreshing = this.doRefresh(onProgress, embed).finally(() => {
				this.refreshing = null;
				this.lastRefresh = Date.now();
			});
		}
		return this.refreshing;
	}

	// Prepara a busca sem bloquear: primeiro o texto (rápido), depois o modelo e os vetores.
	warmup() {
		return this.refresh({ embed: false })
			.then(() => this.embedder?.load())
			.then(() => this.refresh())
			.catch((err) => this.failEmbed(err));
	}

	async doRefresh(onProgress, embed = true) {
		const present = await this.walk();
		const nextFiles = {};
		const changed = new Map(); // rel -> chunks novos
		for (const rel of present) {
			const abs = path.join(this.folder, ...rel.split('/'));
			let st;
			try {
				st = await fsp.stat(abs);
			} catch {
				continue;
			}
			if (st.size > MAX_NOTE) continue;
			const known = this.files[rel];
			if (known && known.mtime === st.mtimeMs && known.size === st.size) {
				nextFiles[rel] = known;
				continue;
			}
			const text = await fsp.readFile(abs, 'utf8');
			const hash = sha1(text);
			nextFiles[rel] = { mtime: st.mtimeMs, size: st.size, hash };
			if (known?.hash !== hash) changed.set(rel, chunkNote(rel, text));
		}
		const removed = Object.keys(this.files).filter((rel) => !(rel in nextFiles));
		const embedderReady = embed && this.semanticReady();
		const pendingVectors = this.chunks.some((c) => !c.embedded) && embedderReady;
		if (!changed.size && !removed.length && !pendingVectors) {
			this.files = nextFiles;
			return false;
		}

		// Reaproveita vetores de trechos que não mudaram (o id inclui o conteúdo).
		const oldVector = new Map();
		this.chunks.forEach((c, i) => {
			if (c.embedded) oldVector.set(c.id, this.vectors.subarray(i * this.dims, (i + 1) * this.dims));
		});
		const chunks = [];
		for (const c of this.chunks) if (!changed.has(c.rel) && !removed.includes(c.rel) && nextFiles[c.rel]) chunks.push(c);
		for (const list of changed.values()) chunks.push(...list);

		const vectors = new Float32Array(chunks.length * this.dims);
		const toEmbed = [];
		chunks.forEach((c, i) => {
			const v = oldVector.get(c.id);
			if (v) {
				vectors.set(v, i * this.dims);
				c.embedded = true;
			} else {
				c.embedded = false;
				toEmbed.push(i);
			}
		});

		if (toEmbed.length && embedderReady) {
			try {
				const STEP = 64;
				for (let s = 0; s < toEmbed.length; s += STEP) {
					const slice = toEmbed.slice(s, s + STEP);
					const embedded = await this.embedder.embed(slice.map((i) => `${chunks[i].context}\n${chunks[i].text}`), 'passage');
					slice.forEach((chunkIndex, j) => {
						vectors.set(embedded[j], chunkIndex * this.dims);
						chunks[chunkIndex].embedded = true;
					});
					onProgress?.({ done: Math.min(s + STEP, toEmbed.length), total: toEmbed.length });
				}
			} catch (err) {
				this.failEmbed(err);
				this.log('busca por significado indisponível agora; usando só palavras (nova tentativa em 30 s)', err.message);
			}
		}

		this.files = nextFiles;
		this.chunks = chunks;
		this.vectors = vectors;
		this.bm25 = null;
		this.updatedAt = Date.now();
		await this.save();
		return true;
	}

	async search(query, { limit = 8, pathPrefix = '' } = {}) {
		// Nunca deixa uma consulta esperando o download do modelo (o Claude desiste em 60 s):
		// sem modelo pronto, responde por palavras e o carregamento segue em segundo plano.
		const modelReady = !!this.embedder?.loaded;
		if (!modelReady && this.semanticReady()) this.embedder.load().catch((err) => this.failEmbed(err));
		// Uma indexação só de texto em andamento (ex.: a da inicialização) é rápida: espera por ela,
		// senão a busca roda num índice ainda vazio. Só não espera vetores enquanto o modelo carrega.
		if (modelReady || !this.refreshing || !this.refreshingEmbeds) await this.refresh({ maxAge: 3000, embed: modelReady });
		if (!this.chunks.length || !String(query).trim()) return [];
		const allowed = (c) => !pathPrefix || c.rel.toLowerCase().startsWith(pathPrefix.toLowerCase());
		this.bm25 ??= new Bm25(this.chunks.map((c) => `${c.context}\n${c.text}`));

		const ranks = new Map(); // índice -> { score, by }
		const add = (list, label) =>
			list.forEach(({ index }, rank) => {
				if (!allowed(this.chunks[index])) return;
				const entry = ranks.get(index) ?? { score: 0, by: [] };
				entry.score += 1 / (RRF_K + rank + 1);
				entry.by.push(label);
				ranks.set(index, entry);
			});

		add(this.bm25.search(query, 60), 'palavras');

		if (modelReady && this.semanticReady() && this.chunks.some((c) => c.embedded)) {
			try {
				const [q] = await this.embedder.embed([query], 'query');
				const scores = [];
				for (let i = 0; i < this.chunks.length; i++) {
					if (!this.chunks[i].embedded) continue;
					let dot = 0;
					const off = i * this.dims;
					for (let d = 0; d < this.dims; d++) dot += q[d] * this.vectors[off + d];
					scores.push({ index: i, score: dot });
				}
				scores.sort((a, b) => b.score - a.score);
				add(scores.slice(0, 60), 'significado');
			} catch (err) {
				this.failEmbed(err);
			}
		}

		return [...ranks.entries()]
			.sort((a, b) => b[1].score - a[1].score)
			.slice(0, limit)
			.map(([index, r]) => {
				const c = this.chunks[index];
				return { path: c.rel, title: c.title, heading: c.heading, line: c.line, text: c.text, score: Number(r.score.toFixed(4)), matchedBy: r.by };
			});
	}

	stats() {
		return {
			folder: this.folder,
			notes: Object.keys(this.files).length,
			chunks: this.chunks.length,
			embedded: this.chunks.filter((c) => c.embedded).length,
			model: this.model,
			semantic: this.semanticReady(),
			error: this.embedError?.message ?? null,
			updatedAt: this.updatedAt,
		};
	}
}

module.exports = { Brain };
