// Ponte entre o renderer (sem Node) e o processo principal.
// Só estas funções ficam visíveis em window.briefing.
const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel) => (...args) => ipcRenderer.invoke(channel, ...args);

contextBridge.exposeInMainWorld('briefing', {
	info: invoke('vault:info'),
	list: invoke('vault:list'),
	read: invoke('vault:read'),
	readOptional: invoke('vault:read-optional'),
	write: invoke('vault:write'),
	writeBinary: invoke('vault:write-binary'),
	create: invoke('vault:create'),
	mkdir: invoke('vault:mkdir'),
	rename: invoke('vault:rename'),
	trash: invoke('vault:trash'),
	choose: invoke('vault:choose'),
	revealVault: invoke('vault:reveal'),
	showInFolder: invoke('vault:show-in-folder'),
	openFile: invoke('vault:open-file'),
	openExternal: invoke('shell:open-external'),
	historyList: invoke('history:list'),
	historyRead: invoke('history:read'),
	exportPdf: invoke('export:pdf'),
	setTheme: invoke('theme:set'),
	openFolder: invoke('vault:open-folder'),
	app: {
		prefs: invoke('app:prefs-get'),
		setPref: invoke('app:prefs-set'),
		checkUpdate: invoke('app:update-check'),
		installUpdate: invoke('app:update-install'),
	},
	brain: {
		search: invoke('brain:search'),
		stats: invoke('brain:stats'),
		reindex: invoke('brain:reindex'),
	},
	claude: {
		info: invoke('claude:mcp-info'),
		register: invoke('claude:register'),
	},
	teams: {
		info: invoke('teams:info'),
		create: invoke('teams:create'),
		join: invoke('teams:join'),
		leave: invoke('teams:leave'),
		pause: invoke('teams:pause'),
		setDeviceName: invoke('teams:device-name'),
		chooseFolder: invoke('teams:choose-folder'),
		defaultJoinFolder: invoke('teams:default-join-folder'),
	},
	on(channel, callback) {
		const allowed = ['teams:changed', 'teams:event', 'brain:stats', 'brain:progress', 'app:update'];
		if (!allowed.includes(channel)) throw new Error(`Canal não permitido: ${channel}`);
		const listener = (_event, payload) => callback(payload);
		ipcRenderer.on(channel, listener);
		return () => ipcRenderer.removeListener(channel, listener);
	},
	writeSync: (rel, content) => ipcRenderer.sendSync('vault:write-sync', rel, content),
	onChanged(callback) {
		const listener = (_event, paths) => callback(paths);
		ipcRenderer.on('vault:changed', listener);
		return () => ipcRenderer.removeListener('vault:changed', listener);
	},
	onMenu(callback) {
		const listener = (_event, cmd) => callback(cmd);
		ipcRenderer.on('menu', listener);
		return () => ipcRenderer.removeListener('menu', listener);
	},
});
