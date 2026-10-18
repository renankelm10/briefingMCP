// Gerencia as equipes deste PC: cria, entra, pausa, sai e mantém um SyncEngine por equipe.
// Lista salva em <userData>/teams.json (o servidor MCP também lê esse arquivo).
const fs = require('fs');
const os = require('os');
const path = require('path');
const EventEmitter = require('events');
const { SyncEngine } = require('../core/sync/engine');
const { createInviteCode, parseInviteCode } = require('../core/sync/invite');

class TeamManager extends EventEmitter {
	// secretBox: { encrypt(text) -> base64, decrypt(base64) -> text } — cofre do sistema (opcional)
	constructor({ dataDir, trash, log = console.log, bootstrap, secretBox = null }) {
		super();
		this.file = path.join(dataDir, 'teams.json');
		this.trash = trash;
		this.secretBox = secretBox;
		this.log = log;
		this.bootstrap = bootstrap;
		this.engines = new Map(); // teamId -> engine
		let user = '';
		try {
			user = os.userInfo().username;
		} catch {
			// sem usuário
		}
		this.data = { deviceName: user || os.hostname(), teams: [] };
		this.load();
		// migra códigos antigos (em texto) para o formato cifrado
		if (this.secretBox && this.data.teams.length) this.save();
	}

	load() {
		try {
			const raw = JSON.parse(fs.readFileSync(this.file, 'utf8'));
			if (Array.isArray(raw)) this.data.teams = raw;
			else Object.assign(this.data, raw);
		} catch {
			// primeira vez
		}
		for (const team of this.data.teams) {
			if (team.codeEnc && !team.code) {
				try {
					team.code = this.secretBox.decrypt(team.codeEnc);
					delete team.codeEnc;
				} catch (err) {
					// mantém o código cifrado intacto: a equipe só fica bloqueada até o cofre voltar
					this.log(`não foi possível ler o código da equipe ${team.name} (cofre do sistema indisponível)`, err?.message);
					team.locked = true;
				}
			}
		}
	}

	// O código de convite é a chave da equipe: fica cifrado pelo cofre do sistema
	// (DPAPI no Windows, Keychain no macOS, libsecret no Linux) quando disponível.
	save() {
		const teams = this.data.teams.map((team) => {
			const { code, locked, ...rest } = team;
			if (!code) return rest; // bloqueada: preserva codeEnc como estava
			if (this.secretBox) {
				try {
					return { ...rest, codeEnc: this.secretBox.encrypt(code) };
				} catch {
					// sem cofre: grava como texto (o arquivo fica na pasta de dados do usuário)
				}
			}
			return { ...rest, code };
		});
		fs.mkdirSync(path.dirname(this.file), { recursive: true });
		fs.writeFileSync(this.file, JSON.stringify({ ...this.data, teams }, null, 2), { mode: 0o600 });
	}

	async startAll() {
		for (const team of this.data.teams) {
			if (!team.paused && team.code) await this.startEngine(team).catch((err) => this.log('falha ao iniciar equipe', team.name, err));
		}
	}

	async startEngine(team) {
		if (this.engines.has(team.id)) return;
		const engine = new SyncEngine({
			folder: team.folder,
			code: team.code,
			deviceName: this.data.deviceName,
			// quem entrou com um código ainda não sabe o nome real da equipe: recebe do parceiro
			teamName: team.role === 'criador' || team.nameConfirmed ? team.name : '',
			bootstrap: this.bootstrap,
			trash: this.trash,
			log: (...args) => this.log(`[equipe ${team.name}]`, ...args),
		});
		this.engines.set(team.id, engine);
		engine.on('status', () => this.emit('changed'));
		engine.on('team-name', (name) => {
			if (team.nameConfirmed) return;
			team.name = name;
			team.nameConfirmed = true;
			this.save();
			this.emit('changed');
		});
		engine.on('peer-joined', (name) => this.emit('event', { team: team.name, folder: team.folder, kind: 'peer-joined', text: `${name} conectou` }));
		engine.on('peer-left', (name) => this.emit('event', { team: team.name, folder: team.folder, kind: 'peer-left', text: `${name} desconectou` }));
		engine.on('remote-change', (c) =>
			this.emit('event', {
				team: team.name,
				folder: team.folder,
				kind: 'remote-change',
				path: c.path,
				text: `${c.from} ${c.deleted ? 'excluiu' : c.merged ? 'mesclou' : 'atualizou'} ${c.path}`,
			}),
		);
		engine.on('conflict', (c) => this.emit('event', { team: team.name, folder: team.folder, kind: 'conflict', path: c.copy, text: `Conflito em ${c.path} — versão de ${c.with} salva como cópia` }));
		engine.on('rejected', () => this.emit('event', { team: team.name, folder: team.folder, kind: 'rejected', text: 'Um PC sem o código desta equipe tentou se conectar e foi recusado' }));
		await engine.start();
	}

	async stopEngine(id) {
		const engine = this.engines.get(id);
		if (!engine) return;
		this.engines.delete(id);
		await engine.stop();
	}

	list() {
		return this.data.teams.map((team) => {
			const status = this.engines.get(team.id)?.status();
			return {
				id: team.id,
				name: team.name,
				folder: team.folder,
				code: team.code,
				paused: !!team.paused,
				role: team.role,
				createdAt: team.createdAt,
				peers: status?.peers ?? [],
				files: status?.files ?? 0,
				lastSync: status?.lastSync ?? null,
				conflicts: status?.conflicts ?? [],
				sent: status?.sent ?? 0,
				received: status?.received ?? 0,
			};
		});
	}

	info() {
		return { deviceName: this.data.deviceName, teams: this.list() };
	}

	assertFolderFree(folder) {
		const key = path.resolve(folder).toLowerCase();
		for (const t of this.data.teams) {
			const other = path.resolve(t.folder).toLowerCase();
			if (key === other || key.startsWith(other + path.sep) || other.startsWith(key + path.sep)) {
				throw new Error(`Essa pasta já faz parte da equipe "${t.name}"`);
			}
		}
	}

	async create({ name, folder }) {
		if (!name?.trim()) throw new Error('Dê um nome para a equipe');
		if (!folder || !fs.existsSync(folder)) throw new Error('Escolha uma pasta existente para compartilhar');
		this.assertFolderFree(folder);
		const code = createInviteCode();
		const team = { id: parseInviteCode(code).teamId, name: name.trim(), folder: path.resolve(folder), code, role: 'criador', createdAt: Date.now(), paused: false };
		this.data.teams.push(team);
		this.save();
		await this.startEngine(team);
		this.emit('changed');
		return team;
	}

	async join({ code, folder, name }) {
		const parsed = parseInviteCode(code); // valida o formato
		if (this.data.teams.some((t) => t.id === parsed.teamId)) throw new Error('Você já participa desta equipe');
		if (!folder) throw new Error('Escolha a pasta onde os arquivos da equipe serão guardados');
		fs.mkdirSync(folder, { recursive: true });
		this.assertFolderFree(folder);
		const team = {
			id: parsed.teamId,
			name: name?.trim() || `Equipe ${parsed.code.slice(4, 8)}`,
			folder: path.resolve(folder),
			code: parsed.code,
			role: 'membro',
			createdAt: Date.now(),
			paused: false,
		};
		this.data.teams.push(team);
		this.save();
		await this.startEngine(team);
		this.emit('changed');
		return team;
	}

	async setPaused(id, paused) {
		const team = this.data.teams.find((t) => t.id === id);
		if (!team) return;
		team.paused = !!paused;
		this.save();
		if (paused) await this.stopEngine(id);
		else if (team.code) await this.startEngine(team);
		this.emit('changed');
	}

	// Sair não apaga nada: a pasta continua no PC, só para de sincronizar.
	async leave(id) {
		await this.stopEngine(id);
		this.data.teams = this.data.teams.filter((t) => t.id !== id);
		this.save();
		this.emit('changed');
	}

	async setDeviceName(name) {
		const clean = String(name ?? '').trim().slice(0, 60);
		if (!clean) return;
		this.data.deviceName = clean;
		this.save();
		// reinicia as conexões para os parceiros verem o novo nome
		for (const team of this.data.teams) {
			if (team.paused || !team.code) continue;
			await this.stopEngine(team.id);
			await this.startEngine(team);
		}
		this.emit('changed');
	}

	folders() {
		return this.data.teams.map((t) => ({ folder: t.folder, name: t.name }));
	}

	async stopAll() {
		for (const id of [...this.engines.keys()]) await this.stopEngine(id);
	}
}

module.exports = { TeamManager };
