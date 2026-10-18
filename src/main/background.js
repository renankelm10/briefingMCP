// Modo segundo plano: ícone na bandeja do sistema e início junto com o sistema.
// Fechar a janela só a esconde — a sincronização com a equipe e o "segundo cérebro"
// continuam rodando. Sair de verdade é pelo menu da bandeja (ou Arquivo → Sair).
const { app, Tray, Menu, nativeImage, Notification } = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Iniciado pelo sistema (login): abre direto na bandeja, sem janela.
function startedHidden() {
	if (process.argv.includes('--hidden')) return true;
	if (process.platform === 'darwin') return !!app.getLoginItemSettings().wasOpenedAsHidden;
	return false;
}

function linuxAutostartFile() {
	return path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'autostart', 'briefing.desktop');
}

// Windows e macOS: item de login do sistema. Linux: arquivo .desktop em ~/.config/autostart.
function setOpenAtLogin(enabled, appRoot) {
	// Em desenvolvimento o executável é o Electron "puro": precisa receber a pasta do app.
	const args = app.isPackaged ? ['--hidden'] : [appRoot, '--hidden'];
	if (process.platform === 'linux') {
		const file = linuxAutostartFile();
		if (!enabled) return fs.rmSync(file, { force: true });
		const exec = process.env.APPIMAGE || process.execPath;
		const quoted = [exec, ...args].map((a) => `"${a.replace(/"/g, '\\"')}"`).join(' ');
		fs.mkdirSync(path.dirname(file), { recursive: true });
		fs.writeFileSync(
			file,
			`[Desktop Entry]\nType=Application\nName=Briefing\nComment=Notas e sincronização da equipe\nExec=${quoted}\nTerminal=false\nX-GNOME-Autostart-enabled=true\n`,
		);
		return;
	}
	app.setLoginItemSettings({ openAtLogin: enabled, openAsHidden: enabled, args, path: process.execPath });
}

function isOpenAtLogin(appRoot) {
	if (process.platform === 'linux') return fs.existsSync(linuxAutostartFile());
	const args = app.isPackaged ? ['--hidden'] : [appRoot, '--hidden'];
	return app.getLoginItemSettings({ args, path: process.execPath }).openAtLogin;
}

function createTray({ icon, showWindow, getTeams, setAllPaused, prefs, setPref, quit }) {
	let tray = null;

	const refresh = () => {
		if (!tray) return;
		const teams = getTeams()?.teams ?? [];
		const online = [...new Set(teams.flatMap((t) => t.peers.map((p) => p.name)))];
		const active = teams.filter((t) => !t.paused);
		const allPaused = teams.length > 0 && active.length === 0;
		const status = !teams.length
			? 'Nenhuma equipe'
			: allPaused
				? 'Sincronização pausada'
				: online.length
					? `⇅ ${online.length} online: ${online.join(', ')}`
					: '⇅ Aguardando parceiros';
		tray.setToolTip(`Briefing — ${status}`);
		const p = prefs();
		tray.setContextMenu(
			Menu.buildFromTemplate([
				{ label: 'Abrir o Briefing', click: showWindow },
				{ type: 'separator' },
				{ label: status, enabled: false },
				...(teams.length
					? [{ label: allPaused ? 'Retomar sincronização' : 'Pausar sincronização', click: () => setAllPaused(!allPaused) }]
					: []),
				{ type: 'separator' },
				{ label: 'Continuar em segundo plano ao fechar', type: 'checkbox', checked: p.background, click: (i) => setPref('background', i.checked) },
				{ label: 'Iniciar com o sistema', type: 'checkbox', checked: p.openAtLogin, click: (i) => setPref('openAtLogin', i.checked) },
				{ type: 'separator' },
				{ label: 'Sair do Briefing', click: quit },
			]),
		);
	};

	try {
		const image = nativeImage.createFromPath(icon);
		tray = new Tray(image.isEmpty() ? nativeImage.createEmpty() : image.resize({ width: process.platform === 'darwin' ? 18 : 16 }));
		// Windows/Linux: clique abre; macOS: clique mostra o menu (padrão do sistema)
		if (process.platform !== 'darwin') tray.on('click', showWindow);
		refresh();
	} catch (err) {
		// Algumas áreas de trabalho Linux não têm bandeja; abrir o Briefing de novo mostra a janela.
		console.error('Bandeja do sistema indisponível', err.message);
	}
	return { refresh, destroy: () => tray?.destroy() };
}

function notify(title, body, onClick) {
	if (!Notification.isSupported()) return;
	const n = new Notification({ title, body, silent: false });
	if (onClick) n.on('click', onClick);
	n.show();
}

module.exports = { createTray, setOpenAtLogin, isOpenAtLogin, startedHidden, notify };
