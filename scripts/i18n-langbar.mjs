// Atualiza a barra de idiomas (entre <!-- langs --> e <!-- /langs -->) em todos os READMEs.
// Uso: node scripts/i18n-langbar.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const LANGUAGES = [
	['en', 'English'],
	['pt-BR', 'Português'],
	['es', 'Español'],
	['fr', 'Français'],
	['de', 'Deutsch'],
	['it', 'Italiano'],
	['nl', 'Nederlands'],
	['pl', 'Polski'],
	['ru', 'Русский'],
	['uk', 'Українська'],
	['tr', 'Türkçe'],
	['ar', 'العربية'],
	['hi', 'हिन्दी'],
	['zh-CN', '简体中文'],
	['zh-TW', '繁體中文'],
	['ja', '日本語'],
	['ko', '한국어'],
	['id', 'Bahasa Indonesia'],
	['vi', 'Tiếng Việt'],
	['th', 'ไทย'],
];

const fileFor = (code) => (code === 'en' ? path.join(root, 'README.md') : path.join(root, 'docs', 'i18n', `README.${code}.md`));

function bar(current) {
	const from = path.dirname(fileFor(current));
	return LANGUAGES.map(([code, name]) => {
		if (code === current) return `**${name}**`;
		const rel = path.relative(from, fileFor(code)).split(path.sep).join('/');
		return `[${name}](${rel})`;
	}).join(' · ');
}

let missing = 0;
for (const [code] of LANGUAGES) {
	const file = fileFor(code);
	if (!fs.existsSync(file)) {
		console.log(`falta: ${path.relative(root, file)}`);
		missing++;
		continue;
	}
	const text = fs.readFileSync(file, 'utf8');
	const next = text.replace(/<!-- langs -->[\s\S]*?<!-- \/langs -->/, `<!-- langs -->\n${bar(code)}\n<!-- /langs -->`);
	if (next === text && !text.includes('<!-- langs -->')) console.log(`sem marcador: ${path.relative(root, file)}`);
	fs.writeFileSync(file, next);
}
console.log(`${LANGUAGES.length - missing}/${LANGUAGES.length} READMEs atualizados`);
