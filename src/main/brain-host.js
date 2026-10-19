// Processo separado (utilityProcess) que mantém o "segundo cérebro" de cada vault.
// Fica fora do processo principal para a vetorização não travar a interface.
const { Brain } = require('../core/rag/brain');
const { Embedder } = require('../core/rag/embedder');

const port = process.parentPort;
// Busca por significado (modelo de IA local): opcional, desligada até o app dizer o contrário.
let semanticOn = false;
const embedder = new Embedder({ log: (...a) => port.postMessage({ type: 'log', text: a.join(' ') }), enabled: () => semanticOn });
const brains = new Map(); // pasta -> { brain, name }
let indexing = false;
let again = false;

function stats() {
	return [...brains.values()].map(({ brain, name }) => ({ name, ...brain.stats() }));
}

async function indexAll() {
	if (indexing) {
		again = true;
		return;
	}
	indexing = true;
	try {
		do {
			again = false;
			for (const { brain, name } of brains.values()) {
				await brain.refresh({
					onProgress: (p) => port.postMessage({ type: 'progress', name, ...p }),
				});
			}
			port.postMessage({ type: 'stats', stats: stats() });
		} while (again);
	} catch (err) {
		port.postMessage({ type: 'log', text: `erro ao indexar: ${err.message}` });
	} finally {
		indexing = false;
	}
}

port.on('message', async ({ data }) => {
	switch (data.type) {
		case 'set-folders': {
			const wanted = new Map(data.folders.map((f) => [f.folder.toLowerCase(), f]));
			for (const [key, entry] of brains) {
				if (!wanted.has(key)) {
					entry.brain.close();
					brains.delete(key);
				}
			}
			for (const [key, f] of wanted) {
				if (brains.has(key)) {
					brains.get(key).name = f.name;
					continue;
				}
				const brain = new Brain({ folder: f.folder, embedder });
				brain.watch();
				brains.set(key, { brain, name: f.name });
			}
			port.postMessage({ type: 'stats', stats: stats() });
			indexAll();
			break;
		}
		case 'semantic':
			semanticOn = !!data.on;
			if (semanticOn) indexAll(); // vetoriza o que ficou pendente enquanto estava desligada
			else await embedder.unload(); // libera a memória do modelo na hora
			port.postMessage({ type: 'stats', stats: stats() });
			break;
		case 'reindex':
			for (const { brain } of brains.values()) brain.invalidate();
			indexAll();
			break;
		case 'search': {
			try {
				const results = [];
				for (const [key, { brain, name }] of brains) {
					if (data.folder && data.folder.toLowerCase() !== key) continue;
					for (const r of await brain.search(data.query, { limit: data.limit ?? 12 })) results.push({ ...r, vault: name, folder: brain.folder });
				}
				results.sort((a, b) => b.score - a.score);
				port.postMessage({ type: 'result', id: data.id, results: results.slice(0, data.limit ?? 12) });
			} catch (err) {
				port.postMessage({ type: 'result', id: data.id, error: err.message });
			}
			break;
		}
		case 'stats':
			port.postMessage({ type: 'stats', stats: stats() });
			break;
	}
});

// Reindexa periodicamente o que mudou (o watcher já invalida; isto só processa em segundo plano).
setInterval(() => {
	if ([...brains.values()].some(({ brain }) => brain.lastRefresh === 0)) indexAll();
}, 5000);
