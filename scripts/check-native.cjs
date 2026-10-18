// Verifica se os módulos nativos (P2P e embeddings) carregam no runtime atual (Node ou Electron).
const Hyperswarm = require('hyperswarm');
const swarm = new Hyperswarm();
console.log('runtime', process.versions.electron ? `electron ${process.versions.electron}` : `node ${process.version}`);
console.log('hyperswarm ok', swarm.keyPair.publicKey.length === 32);
swarm.destroy();
import('@huggingface/transformers')
	.then((t) => console.log('transformers ok', typeof t.pipeline))
	.catch((err) => console.log('transformers FALHOU', err.message));
