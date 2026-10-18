// Pastas do Briefing em cada sistema. Usado pelo app (Electron) e pelo servidor MCP (Node),
// para os dois sempre enxergarem os mesmos arquivos de configuração.
//   Windows: %APPDATA%\Briefing
//   macOS:   ~/Library/Application Support/Briefing
//   Linux:   $XDG_CONFIG_HOME/Briefing (ou ~/.config/Briefing)
const os = require('os');
const path = require('path');

const APP_DIR = 'Briefing';

function userDataDir() {
	if (process.env.BRIEFING_USER_DATA) return process.env.BRIEFING_USER_DATA;
	const home = os.homedir();
	switch (process.platform) {
		case 'win32':
			return path.join(process.env.APPDATA || path.join(home, 'AppData', 'Roaming'), APP_DIR);
		case 'darwin':
			return path.join(home, 'Library', 'Application Support', APP_DIR);
		default:
			return path.join(process.env.XDG_CONFIG_HOME || path.join(home, '.config'), APP_DIR);
	}
}

// O modelo de IA local (~120 MB) é compartilhado entre o app e o servidor MCP.
function modelsDir() {
	return process.env.BRIEFING_MODELS_DIR || path.join(userDataDir(), 'models');
}

// Caminhos relativos sempre em NFC: o macOS devolve nomes acentuados em NFD,
// e "Reunião.md" em NFD e em NFC seriam dois arquivos diferentes para o resto do sistema.
const toNfc = (rel) => rel.normalize('NFC');

module.exports = { userDataDir, modelsDir, toNfc, APP_DIR };
