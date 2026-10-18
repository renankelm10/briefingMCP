// Configurações por vault, salvas em <vault>/.briefing/config.json
export const SETTINGS_FILE = '.briefing/config.json';
export const WORKSPACE_FILE = '.briefing/workspace.json';

export const DEFAULT_SETTINGS = {
	theme: 'system',
	accent: '',
	fontSize: 16,
	lineWidth: 760,
	livePreview: true,
	spellcheck: true,
	defaultMode: 'edit',
	newNoteFolder: '',
	attachmentsFolder: 'Anexos',
	showAttachments: true,
	sort: 'name',
	confirmDelete: true,
	dailyFolder: 'Diário',
	dailyFormat: 'YYYY-MM-DD',
	dailyTemplate: '',
	templatesFolder: 'Modelos',
	briefingFolder: 'Briefings',
	favorites: [],
};

export const SETTINGS_SCHEMA = [
	{
		section: 'Aparência',
		items: [
			{ key: 'theme', label: 'Tema', type: 'select', options: [['system', 'Seguir o Windows'], ['dark', 'Escuro'], ['light', 'Claro']] },
			{ key: 'accent', label: 'Cor de destaque', hint: 'Deixe vazio para a cor padrão', type: 'color' },
			{ key: 'fontSize', label: 'Tamanho do texto', type: 'number', min: 12, max: 26, step: 1 },
			{ key: 'lineWidth', label: 'Largura máxima da linha (px)', type: 'number', min: 480, max: 1600, step: 20 },
		],
	},
	{
		section: 'Editor',
		items: [
			{ key: 'livePreview', label: 'Live Preview', hint: 'Esconde a marcação Markdown fora da linha em edição', type: 'toggle' },
			{ key: 'spellcheck', label: 'Corretor ortográfico', type: 'toggle' },
			{ key: 'defaultMode', label: 'Modo ao abrir nota', type: 'select', options: [['edit', 'Edição'], ['read', 'Leitura']] },
		],
	},
	{
		section: 'Arquivos',
		items: [
			{ key: 'newNoteFolder', label: 'Pasta para notas novas', hint: 'Vazio = raiz do vault', type: 'text' },
			{ key: 'attachmentsFolder', label: 'Pasta de anexos', hint: 'Onde imagens coladas são salvas', type: 'text' },
			{ key: 'showAttachments', label: 'Mostrar anexos no explorador', type: 'toggle' },
			{ key: 'sort', label: 'Ordenar arquivos por', type: 'select', options: [['name', 'Nome'], ['modified', 'Modificação mais recente']] },
			{ key: 'confirmDelete', label: 'Confirmar antes de excluir', type: 'toggle' },
		],
	},
	{
		section: 'Notas diárias, modelos e briefings',
		items: [
			{ key: 'dailyFolder', label: 'Pasta das notas diárias', type: 'text' },
			{ key: 'dailyFormat', label: 'Formato do nome', hint: 'Tokens: YYYY MM DD dddd MMMM', type: 'text' },
			{ key: 'dailyTemplate', label: 'Modelo da nota diária', hint: 'Caminho no vault, ex.: Modelos/Diário.md', type: 'text' },
			{ key: 'templatesFolder', label: 'Pasta de modelos', type: 'text' },
			{ key: 'briefingFolder', label: 'Pasta para novos briefings', type: 'text' },
		],
	},
];

export function mergeSettings(raw) {
	const out = { ...DEFAULT_SETTINGS };
	if (raw && typeof raw === 'object') {
		for (const key of Object.keys(DEFAULT_SETTINGS)) {
			if (key in raw && typeof raw[key] === typeof DEFAULT_SETTINGS[key]) out[key] = raw[key];
		}
	}
	return out;
}
