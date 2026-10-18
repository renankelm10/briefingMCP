// Motor de sincronização P2P de uma pasta compartilhada pela equipe.
//
// Como funciona:
//  1. Os PCs se encontram pela rede Hyperswarm (DHT pública e descentralizada) usando um
//     "topic" derivado do código de convite. A conexão é direta e criptografada (Noise).
//  2. Cada lado prova que conhece o código (HMAC) antes de qualquer arquivo ser trocado.
//  3. Cada arquivo tem um vetor de versão {pc: contador}. Ao conectar, os PCs trocam o
//     manifesto e pedem o que falta. Depois, toda mudança no disco é enviada na hora.
//  4. Se dois PCs mudaram o mesmo arquivo ao mesmo tempo, o texto é mesclado em 3 vias;
//     se as mudanças colidirem, a versão perdedora vira uma "cópia de conflito".
//     A escolha é determinística: os dois PCs chegam ao mesmo resultado.
const fs = require('fs');
const fsp = fs.promises;
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const EventEmitter = require('events');
const Hyperswarm = require('hyperswarm');
const { parseInviteCode, proof, verifyProof } = require('./invite');
const { encode, FrameReader } = require('./framing');
const { compareVersions, unionVersions, mergeText, isTextPath } = require('./merge');
const { toNfc } = require('../paths');

const SYNC_DIR = ['.briefing', 'sync'];
const HISTORY_DIR = ['.briefing', 'historico'];
const TRASH_DIR = ['.briefing', 'lixeira'];
const MAX_FILE = 100 * 1024 * 1024;
const MAX_FRAME_BEFORE_AUTH = 64 * 1024; // um PC ainda não autenticado não manda mais que isso
const PROTOCOL = 1;
const TMP_SUFFIX = '.briefing-tmp';
const SNAPSHOT_INTERVAL = 5 * 60 * 1000;
const SNAPSHOT_KEEP = 40;
// Nomes que o Windows trata como dispositivos (CON, NUL…): gravar "con.md" não cria um arquivo.
const WINDOWS_RESERVED = /^(con|prn|aux|nul|com[0-9¹²³]|lpt[0-9¹²³])(\..*)?$/i;

const sha256 = (data) => crypto.createHash('sha256').update(data).digest('hex');

// Ignora pastas/arquivos ocultos (.git, .briefing, .obsidian…), temporários do Office e afins.
function isIgnored(rel) {
	return (
		rel.split('/').some((seg) => seg.startsWith('.') || seg.startsWith('~$') || /^(thumbs\.db|desktop\.ini)$/i.test(seg)) ||
		/\.(tmp|swp|crdownload|part)$/i.test(rel) ||
		rel.endsWith(TMP_SUFFIX)
	);
}

// Caminhos vindos da rede: relativos, sem "..", sem unidade, sem itens ignorados e
// válidos em Windows, macOS e Linux (a equipe pode misturar sistemas).
function isSafeRemotePath(rel) {
	return (
		typeof rel === 'string' &&
		rel.length > 0 &&
		rel.length < 1024 &&
		!rel.includes('\\') &&
		!/[\u0000-\u001f]/.test(rel) &&
		!rel.startsWith('/') &&
		!/^[a-zA-Z]:/.test(rel) &&
		!rel
			.split('/')
			.some(
				(seg) =>
					seg === '' || seg === '.' || seg === '..' || /[<>:"|?*]/.test(seg) || /[. ]$/.test(seg) || WINDOWS_RESERVED.test(seg) || seg.length > 255,
			) &&
		!isIgnored(rel)
	);
}

function conflictPath(rel, who, hash) {
	const dir = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/') + 1) : '';
	const file = rel.slice(dir.length);
	const dot = file.lastIndexOf('.');
	const name = dot > 0 ? file.slice(0, dot) : file;
	const ext = dot > 0 ? file.slice(dot) : '';
	const safeWho = String(who).replace(/[\\/:*?"<>|#^[\]]/g, '').trim() || 'parceiro';
	return `${dir}${name} (conflito de ${safeWho} ${String(hash).slice(0, 6)})${ext}`;
}

class SyncEngine extends EventEmitter {
	constructor({ folder, code, deviceName, teamName = '', bootstrap, trash, log } = {}) {
		super();
		this.folder = path.resolve(folder);
		this.invite = parseInviteCode(code);
		this.deviceName = String(deviceName || os.hostname()).slice(0, 60);
		this.teamName = teamName;
		this.bootstrap = bootstrap;
		this.systemTrash = trash ?? null;
		this.lastSnapshot = new Map();
		this.log = log ?? (() => {});
		this.peers = new Map();
		this.state = { deviceId: null, files: {} };
		this.pendingScans = new Map();
		this.queue = Promise.resolve();
		this.stats = { sent: 0, received: 0, lastSync: null };
		this.conflicts = [];
		this.running = false;
		this.saveTimer = null;
	}

	/* ---------- utilidades ---------- */

	abs(rel) {
		return path.join(this.folder, ...rel.split('/'));
	}

	syncPath(...parts) {
		return path.join(this.folder, ...SYNC_DIR, ...parts);
	}

	// Todas as operações (disco e rede) passam por esta fila: nada acontece em paralelo.
	enqueue(fn) {
		const run = this.queue.then(() => (this.running || fn.allowStopped ? fn() : undefined));
		this.queue = run.catch((err) => this.log('erro na sincronização', err));
		return run;
	}

	async writeAtomic(abs, data) {
		await fsp.mkdir(path.dirname(abs), { recursive: true });
		await this.assertInside(path.dirname(abs));
		const tmp = abs + TMP_SUFFIX;
		await fsp.writeFile(tmp, data);
		await fsp.rename(tmp, abs);
	}

	// Impede que um link simbólico dentro da pasta leve a gravação/exclusão para fora dela.
	async assertInside(dir) {
		this.realFolder ??= await fsp.realpath(this.folder);
		const real = await fsp.realpath(dir);
		const rel = path.relative(this.realFolder, real);
		if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`Caminho fora da pasta da equipe: ${dir}`);
	}

	// Lixeira do sistema; se não houver (alguns Linux), move para .briefing/lixeira dentro da pasta.
	async trash(abs) {
		await this.assertInside(path.dirname(abs));
		if (this.systemTrash) {
			try {
				return await this.systemTrash(abs);
			} catch (err) {
				this.log('lixeira do sistema indisponível; usando .briefing/lixeira', err.message);
			}
		}
		const target = path.join(this.folder, ...TRASH_DIR, `${Date.now()}-${path.basename(abs)}`);
		await fsp.mkdir(path.dirname(target), { recursive: true });
		await fsp.rename(abs, target);
	}

	// Antes de uma versão do parceiro substituir uma nota, guarda a atual no histórico
	// (o mesmo que o app mostra em "Histórico de versões").
	async snapshot(rel, abs) {
		if (!isTextPath(rel)) return;
		const now = Date.now();
		if (now - (this.lastSnapshot.get(rel) ?? 0) < SNAPSHOT_INTERVAL) return;
		let previous;
		try {
			previous = await fsp.readFile(abs);
		} catch {
			return;
		}
		if (!previous.length) return;
		this.lastSnapshot.set(rel, now);
		const dir = path.join(this.folder, ...HISTORY_DIR, ...rel.split('/'));
		await fsp.mkdir(dir, { recursive: true });
		await fsp.writeFile(path.join(dir, `${new Date(now).toISOString().replace(/[:.]/g, '-')}.md`), previous);
		const versions = (await fsp.readdir(dir)).filter((n) => n.endsWith('.md')).sort();
		for (const old of versions.slice(0, Math.max(0, versions.length - SNAPSHOT_KEEP))) await fsp.rm(path.join(dir, old), { force: true });
	}

	/* ---------- estado persistido ---------- */

	async loadState() {
		try {
			this.state = JSON.parse(await fsp.readFile(this.syncPath('state.json'), 'utf8'));
		} catch {
			this.state = { files: {} };
		}
		this.state.files ??= {};
		this.state.deviceId ??= crypto.randomBytes(6).toString('hex');
	}

	saveState() {
		clearTimeout(this.saveTimer);
		this.saveTimer = setTimeout(() => this.saveStateNow().catch((err) => this.log('falha ao salvar estado', err)), 300);
	}

	async saveStateNow() {
		clearTimeout(this.saveTimer);
		await this.writeAtomic(this.syncPath('state.json'), JSON.stringify(this.state));
	}

	async storeBase(hash, data, rel) {
		if (!hash || !isTextPath(rel)) return;
		const file = this.syncPath('base', hash);
		if (!fs.existsSync(file)) await this.writeAtomic(file, data);
	}

	async readBase(hash) {
		if (!hash) return null;
		try {
			return await fsp.readFile(this.syncPath('base', hash), 'utf8');
		} catch {
			return null;
		}
	}

	async pruneBases() {
		const keep = new Set(Object.values(this.state.files).map((f) => f.base).filter(Boolean));
		let names = [];
		try {
			names = await fsp.readdir(this.syncPath('base'));
		} catch {
			return;
		}
		for (const name of names) if (!keep.has(name)) await fsp.rm(this.syncPath('base', name), { force: true });
	}

	/* ---------- ciclo de vida ---------- */

	async start() {
		await fsp.mkdir(this.folder, { recursive: true });
		await this.loadState();
		this.running = true;
		await this.enqueue(() => this.fullScan());
		await this.saveStateNow();
		this.pruneBases().catch(() => {});
		this.startWatcher();

		this.swarm = new Hyperswarm(this.bootstrap ? { bootstrap: this.bootstrap } : {});
		this.swarm.on('connection', (socket) => this.onConnection(socket));
		this.discovery = this.swarm.join(this.invite.topic, { server: true, client: true });
		this.announced = this.discovery.flushed().then(
			() => this.emitStatus(),
			(err) => this.log('falha ao anunciar na rede', err),
		);
		this.rescanTimer = setInterval(() => this.enqueue(() => this.fullScan()), 60_000);
		this.emitStatus();
	}

	async stop() {
		if (!this.running) return;
		this.running = false;
		clearInterval(this.rescanTimer);
		for (const t of this.pendingScans.values()) clearTimeout(t);
		this.pendingScans.clear();
		this.watcher?.close();
		await this.queue.catch(() => {});
		await this.saveStateNow().catch(() => {});
		await this.swarm?.destroy().catch(() => {});
		this.peers.clear();
		this.emitStatus();
	}

	/* ---------- disco local ---------- */

	async walk(dir, prefix, out) {
		let entries;
		try {
			entries = await fsp.readdir(dir, { withFileTypes: true });
		} catch {
			return out;
		}
		for (const entry of entries) {
			// links simbólicos são ignorados (isDirectory/isFile não os seguem)
			const rel = toNfc(prefix ? `${prefix}/${entry.name}` : entry.name);
			if (isIgnored(rel)) continue;
			if (entry.isDirectory()) await this.walk(path.join(dir, entry.name), rel, out);
			else if (entry.isFile()) out.push(rel);
		}
		return out;
	}

	async fullScan() {
		const present = await this.walk(this.folder, '', []);
		const seen = new Set(present);
		for (const rel of present) await this.scanPath(rel);
		for (const [rel, entry] of Object.entries(this.state.files)) {
			if (!entry.deleted && !seen.has(rel)) await this.scanPath(rel);
		}
	}

	// Compara o arquivo no disco com o estado; se mudou, gera nova versão e avisa os parceiros.
	async scanPath(rel) {
		if (isIgnored(rel)) return;
		const abs = this.abs(rel);
		let st = null;
		try {
			st = await fsp.lstat(abs); // lstat: um link simbólico não é seguido (não vaza arquivos de fora)
		} catch {
			// não existe
		}
		if (st && !st.isFile()) return;
		const entry = this.state.files[rel];
		if (!st) {
			if (entry && !entry.deleted) {
				this.bump(rel, { hash: null, deleted: true, size: 0, mtime: 0 });
				await this.broadcastFile(rel);
			}
			return;
		}
		if (st.size > MAX_FILE) return;
		if (entry && !entry.deleted && entry.size === st.size && entry.mtime === st.mtimeMs) return;
		const data = await fsp.readFile(abs);
		const hash = sha256(data);
		if (entry && !entry.deleted && entry.hash === hash) {
			entry.size = st.size;
			entry.mtime = st.mtimeMs;
			this.saveState();
			return;
		}
		this.bump(rel, { hash, deleted: false, size: st.size, mtime: st.mtimeMs });
		await this.broadcastFile(rel, data);
	}

	// Caminho pode ser pasta (renomeada/apagada inteira): examina tudo o que estava dentro.
	async scanDeep(rel) {
		let st = null;
		try {
			st = await fsp.lstat(this.abs(rel));
		} catch {
			// removido
		}
		if (st?.isFile()) return this.scanPath(rel);
		const seen = new Set(st?.isDirectory() ? await this.walk(this.abs(rel), rel, []) : []);
		for (const child of seen) await this.scanPath(child);
		for (const [known, entry] of Object.entries(this.state.files)) {
			if ((known === rel || known.startsWith(rel + '/')) && !entry.deleted && !seen.has(known)) await this.scanPath(known);
		}
	}

	bump(rel, fields) {
		const prev = this.state.files[rel];
		const vv = { ...(prev?.vv ?? {}) };
		vv[this.state.deviceId] = (vv[this.state.deviceId] ?? 0) + 1;
		this.state.files[rel] = { ...prev, ...fields, vv };
		this.saveState();
		this.emit('local-change', rel);
	}

	startWatcher() {
		try {
			this.watcher = fs.watch(this.folder, { recursive: true }, (_event, filename) => {
				if (!filename) return;
				const rel = toNfc(filename.split(path.sep).join('/'));
				if (isIgnored(rel)) return;
				clearTimeout(this.pendingScans.get(rel));
				this.pendingScans.set(
					rel,
					setTimeout(() => {
						this.pendingScans.delete(rel);
						this.enqueue(() => this.scanDeep(rel));
					}, 400),
				);
			});
			this.watcher.on('error', (err) => this.log('observador de arquivos falhou', err));
		} catch (err) {
			this.log('não foi possível observar a pasta', err);
		}
	}

	/* ---------- rede ---------- */

	send(peer, message) {
		if (peer.socket.destroyed) return;
		peer.socket.write(encode(message));
	}

	authedPeers() {
		return [...this.peers.values()].filter((p) => p.authed);
	}

	manifest() {
		const out = {};
		for (const [rel, f] of Object.entries(this.state.files)) out[rel] = { hash: f.hash, vv: f.vv, deleted: !!f.deleted };
		return out;
	}

	async fileMessage(rel, data) {
		const entry = this.state.files[rel];
		if (!entry) return null;
		const message = { type: 'file', path: rel, hash: entry.hash, vv: entry.vv, deleted: !!entry.deleted, from: this.deviceName };
		if (!entry.deleted) {
			try {
				data ??= await fsp.readFile(this.abs(rel));
			} catch {
				return null; // sumiu do disco; o próximo scan registra a exclusão
			}
			if (sha256(data) !== entry.hash) return null; // mudou no meio do caminho; o scan resolve
			message.data = data.toString('base64');
		}
		return message;
	}

	async sendFile(peer, rel, data) {
		const message = await this.fileMessage(rel, data);
		if (!message) return;
		this.send(peer, message);
		this.stats.sent++;
	}

	async broadcastFile(rel, data) {
		const peers = this.authedPeers();
		if (!peers.length) return;
		const message = await this.fileMessage(rel, data);
		if (!message) return;
		const frame = encode(message);
		for (const peer of peers) if (!peer.socket.destroyed) peer.socket.write(frame);
		this.stats.sent += peers.length;
	}

	onConnection(socket) {
		const remoteKey = socket.remotePublicKey;
		const id = remoteKey.toString('hex');
		const peer = { id, socket, authed: false, name: null, deviceId: null, since: Date.now() };
		const previous = this.peers.get(id);
		if (previous) previous.socket.destroy();
		this.peers.set(id, peer);

		socket.on('error', (err) => this.log('conexão com parceiro', err.message));
		socket.on('close', () => {
			clearTimeout(peer.authTimer);
			if (this.peers.get(id) !== peer) return;
			this.peers.delete(id);
			if (peer.authed) this.emit('peer-left', peer.name);
			this.emitStatus();
		});
		const reader = new FrameReader(
			(message) => this.enqueue(() => this.onMessage(peer, message)),
			(err) => {
				this.log('mensagem inválida do parceiro', err.message);
				socket.destroy();
			},
		);
		reader.max = MAX_FRAME_BEFORE_AUTH;
		peer.reader = reader;
		socket.on('data', (chunk) => reader.push(chunk));

		this.send(peer, {
			type: 'hello',
			protocol: PROTOCOL,
			proof: proof(this.invite.authKey, socket.publicKey, remoteKey).toString('hex'),
			deviceId: this.state.deviceId,
			name: this.deviceName,
			team: this.teamName,
		});
		peer.authTimer = setTimeout(() => {
			if (!peer.authed) socket.destroy();
		}, 20_000);
	}

	async onMessage(peer, message) {
		if (!message || typeof message !== 'object') return;
		if (!peer.authed) {
			if (message.type !== 'hello') return peer.socket.destroy();
			if (!verifyProof(this.invite.authKey, peer.socket.remotePublicKey, peer.socket.publicKey, message.proof)) {
				this.log('conexão recusada: o outro PC não tem o código desta equipe');
				this.emit('rejected');
				return peer.socket.destroy();
			}
			peer.authed = true;
			peer.reader.max = undefined; // autenticado: libera arquivos grandes
			clearTimeout(peer.authTimer);
			peer.name = String(message.name ?? 'Parceiro').slice(0, 60);
			peer.deviceId = String(message.deviceId ?? '');
			if (message.team && !this.teamName) {
				this.teamName = String(message.team).slice(0, 80);
				this.emit('team-name', this.teamName);
			}
			this.emit('peer-joined', peer.name);
			this.emitStatus();
			this.send(peer, { type: 'manifest', files: this.manifest() });
			return;
		}
		switch (message.type) {
			case 'manifest':
				return this.onManifest(peer, message.files);
			case 'request':
				return this.onRequest(peer, message.paths);
			case 'file':
				return this.onFile(peer, message);
			case 'ack':
				return this.onAck(message);
		}
	}

	async onManifest(peer, files) {
		const want = [];
		for (const [rawRel, remote] of Object.entries(files ?? {})) {
			const rel = typeof rawRel === 'string' ? toNfc(rawRel) : rawRel;
			if (!isSafeRemotePath(rel) || !remote || typeof remote !== 'object') {
				if (typeof rel === 'string' && !isIgnored(rel)) this.log(`arquivo do parceiro ignorado (nome inválido neste sistema): ${rel}`);
				continue;
			}
			await this.scanPath(rel); // garante que o estado reflete o disco antes de comparar
			const local = this.state.files[rel];
			if (local && local.hash === remote.hash && !!local.deleted === !!remote.deleted) {
				if (compareVersions(local.vv, remote.vv) !== 'equal') {
					local.vv = unionVersions(local.vv, remote.vv);
					this.saveState();
				}
				continue;
			}
			const cmp = local ? compareVersions(local.vv, remote.vv) : 'less';
			if (cmp === 'greater') continue; // o parceiro vai pedir a nossa versão
			if (remote.deleted && cmp === 'less') await this.applyRemote(peer, rel, { ...remote, deleted: true });
			else want.push(rel);
		}
		if (want.length) this.send(peer, { type: 'request', paths: want });
		this.stats.lastSync = Date.now();
		this.emitStatus();
	}

	async onRequest(peer, paths) {
		for (const rel of Array.isArray(paths) ? paths : []) {
			if (typeof rel === 'string' && this.state.files[rel]) await this.sendFile(peer, rel);
		}
	}

	async onFile(peer, message) {
		const rel = typeof message.path === 'string' ? toNfc(message.path) : null;
		if (!isSafeRemotePath(rel) || typeof message.vv !== 'object' || !message.vv) return;
		let data = null;
		if (!message.deleted) {
			if (typeof message.data !== 'string') return;
			data = Buffer.from(message.data, 'base64');
			if (sha256(data) !== message.hash) return this.log(`arquivo corrompido na transferência: ${rel}`);
		}
		const remote = { hash: message.deleted ? null : message.hash, vv: message.vv, deleted: !!message.deleted };
		await this.scanPath(rel); // edições locais ainda não registradas entram antes da comparação
		const local = this.state.files[rel];
		if (!local) return this.applyRemote(peer, rel, remote, data);
		if (local.hash === remote.hash && !!local.deleted === remote.deleted) {
			local.vv = unionVersions(local.vv, remote.vv);
			this.saveState();
			if (data) await this.acknowledge(peer, rel, remote.hash, data);
			return;
		}
		const cmp = compareVersions(local.vv, remote.vv);
		if (cmp === 'less') return this.applyRemote(peer, rel, remote, data);
		if (cmp === 'greater') return this.sendFile(peer, rel);
		if (cmp === 'equal') {
			// mesmas edições, conteúdos diferentes (mesclas divergentes): desempate determinístico
			return (remote.hash ?? '') > (local.hash ?? '') ? this.applyRemote(peer, rel, remote, data) : this.sendFile(peer, rel);
		}
		return this.resolveConflict(peer, rel, local, remote, data);
	}

	async acknowledge(peer, rel, hash, data) {
		await this.storeBase(hash, data, rel);
		const entry = this.state.files[rel];
		if (entry && entry.hash === hash) entry.base = hash;
		this.send(peer, { type: 'ack', path: rel, hash });
	}

	// O parceiro confirmou que tem a nossa versão: ela vira a "base comum" para futuras mesclas.
	async onAck(message) {
		const entry = this.state.files[message.path];
		if (!entry || entry.deleted || entry.hash !== message.hash || entry.base === message.hash) return;
		try {
			const data = await fsp.readFile(this.abs(message.path));
			if (sha256(data) !== message.hash) return;
			await this.storeBase(message.hash, data, message.path);
			entry.base = message.hash;
			this.saveState();
		} catch {
			// arquivo mudou ou sumiu; sem problema
		}
	}

	async applyRemote(peer, rel, remote, data) {
		const abs = this.abs(rel);
		const prev = this.state.files[rel];
		const vv = unionVersions(prev?.vv, remote.vv);
		if (remote.deleted) {
			this.state.files[rel] = { ...prev, hash: null, deleted: true, size: 0, mtime: 0, vv };
			this.saveState();
			if (fs.existsSync(abs)) {
				try {
					await this.trash(abs);
				} catch (err) {
					this.log(`não foi possível remover ${rel}`, err);
				}
			}
			this.emit('remote-change', { path: rel, deleted: true, from: peer.name });
		} else {
			if (prev && !prev.deleted) await this.snapshot(rel, abs).catch((err) => this.log('falha no histórico', err));
			await this.writeAtomic(abs, data);
			const st = await fsp.stat(abs);
			this.state.files[rel] = { hash: remote.hash, deleted: false, size: st.size, mtime: st.mtimeMs, vv, base: prev?.base };
			await this.acknowledge(peer, rel, remote.hash, data);
			this.saveState();
			this.emit('remote-change', { path: rel, deleted: false, from: peer.name });
		}
		this.stats.received++;
		this.stats.lastSync = Date.now();
		this.emitStatus();
	}

	async resolveConflict(peer, rel, local, remote, data) {
		const vv = unionVersions(local.vv, remote.vv);
		if (local.deleted && remote.deleted) {
			local.vv = vv;
			this.saveState();
			return;
		}
		if (remote.deleted) {
			// edição vence exclusão: mantemos o arquivo e reenviamos
			local.vv = vv;
			this.saveState();
			return this.broadcastFile(rel);
		}
		if (local.deleted) return this.applyRemote(peer, rel, { ...remote, vv }, data);

		const abs = this.abs(rel);
		const mine = await fsp.readFile(abs);
		let result = null;
		if (isTextPath(rel)) {
			const base = (await this.readBase(local.base)) ?? '';
			const merged = mergeText(base, mine.toString('utf8'), data.toString('utf8'));
			if (merged != null) result = Buffer.from(merged, 'utf8');
		}
		let copy = null;
		if (!result) {
			// Colisão no mesmo trecho: vence o maior hash (os dois PCs escolhem igual).
			const localWins = local.hash > remote.hash;
			result = localWins ? mine : data;
			const loser = localWins ? data : mine;
			const loserName = localWins ? peer.name : this.deviceName;
			const loserHash = localWins ? remote.hash : local.hash;
			copy = conflictPath(rel, loserName, loserHash);
			if (!fs.existsSync(this.abs(copy))) {
				await this.writeAtomic(this.abs(copy), loser);
				const st = await fsp.stat(this.abs(copy));
				// versão determinística: a mesma cópia criada nos dois PCs é reconhecida como igual
				this.state.files[copy] = { hash: sha256(loser), deleted: false, size: st.size, mtime: st.mtimeMs, vv: { [`conflito-${loserHash.slice(0, 8)}`]: 1 } };
			}
			const info = { path: rel, copy, with: peer.name, at: Date.now() };
			this.conflicts = [info, ...this.conflicts].slice(0, 50);
			this.emit('conflict', info);
		}
		await this.snapshot(rel, abs).catch((err) => this.log('falha no histórico', err));
		await this.writeAtomic(abs, result);
		const st = await fsp.stat(abs);
		this.state.files[rel] = { hash: sha256(result), deleted: false, size: st.size, mtime: st.mtimeMs, vv, base: local.base };
		this.saveState();
		this.emit('remote-change', { path: rel, deleted: false, from: peer.name, merged: !copy });
		await this.broadcastFile(rel, result);
		if (copy) await this.broadcastFile(copy);
		this.stats.lastSync = Date.now();
		this.emitStatus();
	}

	/* ---------- status ---------- */

	status() {
		return {
			teamId: this.invite.teamId,
			teamName: this.teamName,
			folder: this.folder,
			deviceName: this.deviceName,
			running: this.running,
			peers: this.authedPeers().map((p) => ({ name: p.name, since: p.since })),
			files: Object.values(this.state.files).filter((f) => !f.deleted).length,
			conflicts: this.conflicts.slice(0, 20),
			sent: this.stats.sent,
			received: this.stats.received,
			lastSync: this.stats.lastSync,
		};
	}

	emitStatus() {
		this.emit('status', this.status());
	}
}

module.exports = { SyncEngine, isIgnored, isSafeRemotePath, conflictPath };
