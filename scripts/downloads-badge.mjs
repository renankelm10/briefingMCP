// Soma os downloads dos INSTALADORES de todas as releases e grava docs/downloads.json
// no formato do selo "endpoint" do shields.io.
// Não conta latest*.yml nem .blockmap: esses são baixados pela atualização automática de cada
// app instalado (a cada 6 h), o que inflaria o número muitas vezes.
// Uso: node scripts/downloads-badge.mjs [owner/repo]
import fs from 'node:fs';
import path from 'node:path';

const repo = process.argv[2] ?? 'renankelm10/briefingMCP';
const INSTALLER = /\.(exe|dmg|zip|AppImage|deb)$/i;
const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'briefing-downloads' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

let total = 0;
const perFile = {};
for (let page = 1; ; page++) {
	const res = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=100&page=${page}`, { headers });
	if (!res.ok) throw new Error(`GitHub respondeu ${res.status}`);
	const releases = await res.json();
	if (!releases.length) break;
	for (const release of releases) {
		if (release.draft) continue;
		for (const asset of release.assets) {
			if (!INSTALLER.test(asset.name)) continue;
			total += asset.download_count;
			perFile[asset.name] = asset.download_count;
		}
	}
	if (releases.length < 100) break;
}

const compact = total >= 1000 ? `${(total / 1000).toFixed(1).replace('.0', '')}k` : String(total);
const badge = { schemaVersion: 1, label: 'downloads', message: compact, color: '2ea043', namedLogo: 'github', logoColor: 'white' };
const file = path.join('docs', 'downloads.json');
const previous = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
const next = `${JSON.stringify(badge, null, '\t')}\n`;
fs.writeFileSync(file, next);
console.log(`instaladores baixados: ${total}`);
for (const [name, n] of Object.entries(perFile).sort((a, b) => b[1] - a[1])) if (n) console.log(`  ${n}x ${name}`);
console.log(previous === next ? 'docs/downloads.json sem mudanças' : `docs/downloads.json atualizado (${compact})`);
