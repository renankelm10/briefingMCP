// Recalcula o SHA-512 e o tamanho do instalador em release/latest.yml.
// Necessário depois da assinatura (SignPath): o .exe assinado é outro arquivo, e o
// atualizador recusa a instalação se o hash publicado não bater.
// Uso: node scripts/update-latest-yml.mjs [release/latest.yml]
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const file = process.argv[2] ?? 'release/latest.yml';
let yml = fs.readFileSync(file, 'utf8');
const url = yml.match(/^path:\s*(.+)$/m)?.[1].trim().replace(/^['"]|['"]$/g, '');
if (!url) throw new Error(`"path" não encontrado em ${file}`);
const installer = path.join(path.dirname(file), url);
const data = fs.readFileSync(installer);
const sha512 = crypto.createHash('sha512').update(data).digest('base64');

// Há um único instalador: todas as entradas sha512/size se referem a ele.
yml = yml.replace(/^(\s*sha512:\s*).+$/gm, `$1${sha512}`).replace(/^(\s*size:\s*).+$/gm, `$1${data.length}`);
fs.writeFileSync(file, yml);
// O .blockmap (atualização diferencial) descreve o arquivo antigo: sem ele, baixa o instalador inteiro.
fs.rmSync(`${installer}.blockmap`, { force: true });
console.log(`${file}: ${url} · ${data.length} bytes · sha512 ${sha512.slice(0, 16)}…`);
