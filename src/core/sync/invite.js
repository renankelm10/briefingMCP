// Códigos de convite da equipe.
// O código carrega 160 bits aleatórios. Dele derivamos, de forma independente:
//  - topic: onde os PCs se encontram na rede P2P (não revela o código)
//  - authKey: chave usada para provar que o outro PC conhece o código
//  - teamId: identificador estável e curto da equipe
const crypto = require('crypto');

// Base32 de Crockford: sem I, L, O, U (evita confusão ao digitar).
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const PREFIX = 'BRF';

function toBase32(buf) {
	let bits = 0;
	let value = 0;
	let out = '';
	for (const byte of buf) {
		value = (value << 8) | byte;
		bits += 8;
		while (bits >= 5) {
			out += ALPHABET[(value >>> (bits - 5)) & 31];
			bits -= 5;
		}
	}
	if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
	return out;
}

function fromBase32(str) {
	let bits = 0;
	let value = 0;
	const out = [];
	for (const ch of str) {
		const idx = ALPHABET.indexOf(ch);
		if (idx < 0) throw new Error(`Caractere inválido no código: ${ch}`);
		value = (value << 5) | idx;
		bits += 5;
		if (bits >= 8) {
			out.push((value >>> (bits - 8)) & 255);
			bits -= 8;
		}
	}
	return Buffer.from(out);
}

function createInviteCode() {
	const body = toBase32(crypto.randomBytes(20)); // 32 caracteres
	return [PREFIX, ...body.match(/.{4}/g)].join('-');
}

// Aceita o código com ou sem hífens/espaços, maiúsculas ou minúsculas.
function parseInviteCode(code) {
	const clean = String(code)
		.toUpperCase()
		.replace(/[\s-]/g, '')
		.replace(/O/g, '0')
		.replace(/[IL]/g, '1');
	if (!clean.startsWith(PREFIX)) throw new Error('Código de convite inválido (deve começar com BRF)');
	const body = clean.slice(PREFIX.length);
	if (body.length !== 32) throw new Error('Código de convite incompleto');
	const secret = fromBase32(body);
	const derive = (label) => crypto.createHash('sha256').update(`briefing/${label}/v1`).update(secret).digest();
	return {
		code: [PREFIX, ...body.match(/.{4}/g)].join('-'),
		topic: derive('topic'),
		authKey: derive('auth'),
		teamId: derive('id').toString('hex').slice(0, 16),
	};
}

// Prova de que este PC conhece o código, amarrada às chaves públicas da conexão.
function proof(authKey, fromKey, toKey) {
	return crypto.createHmac('sha256', authKey).update(fromKey).update(toKey).digest();
}

function verifyProof(authKey, fromKey, toKey, received) {
	const expected = proof(authKey, fromKey, toKey);
	const got = Buffer.from(String(received), 'hex');
	return got.length === expected.length && crypto.timingSafeEqual(got, expected);
}

module.exports = { createInviteCode, parseInviteCode, proof, verifyProof };
