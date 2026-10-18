// Gera build/icon.png (512x512): losango âmbar sobre quadrado arredondado escuro.
// Sem dependências: desenha os pixels e codifica o PNG com zlib.
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';

const SIZE = 512;
const SS = 4; // superamostragem para bordas suaves
const BG = [26, 27, 31];
const ACCENT = [227, 164, 58];
const ACCENT_DARK = [176, 118, 30];

function insideRoundedSquare(x, y) {
	const m = 24;
	const r = 110;
	const lo = m + r;
	const hi = SIZE - m - r;
	const cx = Math.min(Math.max(x, lo), hi);
	const cy = Math.min(Math.max(y, lo), hi);
	return (x - cx) ** 2 + (y - cy) ** 2 <= r * r && x >= m && x <= SIZE - m && y >= m && y <= SIZE - m;
}

// distância "losango" (norma L1) até o centro
const diamond = (x, y) => Math.abs(x - SIZE / 2) + Math.abs(y - SIZE / 2);

function sample(x, y) {
	if (!insideRoundedSquare(x, y)) return null;
	const d = diamond(x, y);
	if (d <= 170) {
		// metade inferior um pouco mais escura: efeito de facetas
		const lower = y > SIZE / 2;
		const left = x < SIZE / 2;
		return lower !== left ? ACCENT_DARK : ACCENT;
	}
	if (d <= 186 && d > 178) return [70, 72, 82]; // contorno sutil
	return BG;
}

const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1));
for (let y = 0; y < SIZE; y++) {
	raw[y * (SIZE * 4 + 1)] = 0; // filtro "None"
	for (let x = 0; x < SIZE; x++) {
		let r = 0;
		let g = 0;
		let b = 0;
		let a = 0;
		for (let sy = 0; sy < SS; sy++) {
			for (let sx = 0; sx < SS; sx++) {
				const c = sample(x + (sx + 0.5) / SS, y + (sy + 0.5) / SS);
				if (!c) continue;
				r += c[0];
				g += c[1];
				b += c[2];
				a++;
			}
		}
		const o = y * (SIZE * 4 + 1) + 1 + x * 4;
		const n = SS * SS;
		raw[o] = a ? Math.round(r / a) : 0;
		raw[o + 1] = a ? Math.round(g / a) : 0;
		raw[o + 2] = a ? Math.round(b / a) : 0;
		raw[o + 3] = Math.round((a / n) * 255);
	}
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
	let c = n;
	for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
	return c >>> 0;
});
function crc32(buf) {
	let c = 0xffffffff;
	for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
	return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
	const len = Buffer.alloc(4);
	len.writeUInt32BE(data.length);
	const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
	const crc = Buffer.alloc(4);
	crc.writeUInt32BE(crc32(body));
	return Buffer.concat([len, body, crc]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // bits por canal
ihdr[9] = 6; // RGBA
const png = Buffer.concat([
	Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
	chunk('IHDR', ihdr),
	chunk('IDAT', deflateSync(raw, { level: 9 })),
	chunk('IEND', Buffer.alloc(0)),
]);

mkdirSync('build', { recursive: true });
writeFileSync('build/icon.png', png);
console.log(`build/icon.png (${png.length} bytes)`);
