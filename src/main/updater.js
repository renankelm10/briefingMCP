// Atualizações do app pelas Releases do GitHub.
// - Windows (instalador NSIS) e Linux AppImage: baixa em segundo plano e instala ao reiniciar
//   (electron-updater confere o SHA-512 publicado em latest.yml antes de instalar).
// - macOS e .deb: só avisa que há versão nova e abre a página de download
//   (no macOS a instalação automática exige app assinado pela Apple).
// Só olha releases publicadas: rascunhos e pré-lançamentos são ignorados.
const { app, shell, net } = require('electron');

const REPO = 'renankelm10/briefingMCP';
const RELEASES_URL = `https://github.com/${REPO}/releases/latest`;
const FIRST_CHECK_MS = 20_000;
const INTERVAL_MS = 6 * 60 * 60 * 1000;

/** "0.3.10" > "0.3.9"; ignora prefixo "v" e sufixos de pré-lançamento. */
function isNewer(remote, local) {
	const parts = (v) => String(v).replace(/^v/, '').split('-')[0].split('.').map((n) => Number(n) || 0);
	const [a, b] = [parts(remote), parts(local)];
	for (let i = 0; i < 3; i++) if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0);
	return false;
}

function createUpdater({ isEnabled, notify, onChange, log = console.log }) {
	const canInstall = app.isPackaged && (process.platform === 'win32' || (process.platform === 'linux' && !!process.env.APPIMAGE));
	// status: idle | checking | downloading | ready | available | latest | error | dev
	let state = { status: app.isPackaged ? 'idle' : 'dev', version: null, progress: 0, error: null, auto: canInstall, url: RELEASES_URL };
	const notified = new Set();
	let checking = null;

	const set = (patch) => {
		state = { ...state, ...patch };
		onChange?.(state);
	};
	// Sem nenhuma release publicada (só rascunhos) não há o que atualizar: não é um erro.
	const fail = (err) => {
		if (/Unable to find latest version|No published versions/i.test(err?.message ?? '')) return set({ status: 'latest', error: null });
		log('[atualização] falhou:', err?.message);
		set({ status: 'error', error: 'Não foi possível verificar agora. Tente de novo mais tarde.' });
	};

	let autoUpdater = null;
	if (canInstall) {
		({ autoUpdater } = require('electron-updater'));
		autoUpdater.autoDownload = true;
		autoUpdater.autoInstallOnAppQuit = true; // se o usuário só sair, instala na saída
		autoUpdater.allowPrerelease = false;
		autoUpdater.logger = null;
		autoUpdater.on('update-available', (info) => set({ status: 'downloading', version: info.version, progress: 0 }));
		autoUpdater.on('update-not-available', () => set({ status: 'latest', error: null }));
		autoUpdater.on('download-progress', (p) => set({ status: 'downloading', progress: Math.round(p.percent) }));
		autoUpdater.on('update-downloaded', (info) => {
			set({ status: 'ready', version: info.version, progress: 100 });
			if (!notified.has(info.version)) {
				notified.add(info.version);
				notify(`Atualização pronta: Briefing ${info.version}`, 'Ela será instalada quando você reiniciar o Briefing. Clique para reiniciar agora.', install);
			}
		});
		// erros do download (a verificação já é tratada em check())
		autoUpdater.on('error', (err) => state.status === 'downloading' && fail(err));
	}

	// macOS / .deb: consulta a última release publicada e só avisa.
	async function checkManually() {
		const res = await net.fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
			headers: { Accept: 'application/vnd.github+json', 'User-Agent': `Briefing/${app.getVersion()}` },
		});
		if (res.status === 404) return set({ status: 'latest', error: null }); // nenhuma release publicada ainda
		if (!res.ok) throw new Error(`GitHub respondeu ${res.status}`);
		const release = await res.json();
		const version = String(release.tag_name ?? '').replace(/^v/, '');
		if (!isNewer(version, app.getVersion())) return set({ status: 'latest', error: null });
		const url = /^https:\/\/github\.com\//.test(release.html_url) ? release.html_url : RELEASES_URL;
		set({ status: 'available', version, url, error: null });
		if (!notified.has(version)) {
			notified.add(version);
			notify(`Nova versão: Briefing ${version}`, 'Clique para abrir a página de download.', () => shell.openExternal(url));
		}
	}

	function check() {
		if (!app.isPackaged) return Promise.resolve(state);
		if (state.status === 'ready' || state.status === 'downloading') return Promise.resolve(state);
		checking ??= (async () => {
			set({ status: 'checking', error: null });
			try {
				if (autoUpdater) await autoUpdater.checkForUpdates();
				else await checkManually();
			} catch (err) {
				fail(err);
			}
		})().finally(() => (checking = null));
		return checking.then(() => state);
	}

	function install() {
		if (state.status === 'ready' && autoUpdater) {
			// isSilent=false mostra o progresso do instalador; isForceRunAfter=true reabre o app
			setImmediate(() => autoUpdater.quitAndInstall(false, true));
		} else if (state.status === 'available') {
			shell.openExternal(state.url);
		}
	}

	function start() {
		const tick = () => isEnabled() && check();
		setTimeout(tick, FIRST_CHECK_MS);
		setInterval(tick, INTERVAL_MS).unref?.();
	}

	return { start, check, install, get state() { return state; } };
}

module.exports = { createUpdater, isNewer };
