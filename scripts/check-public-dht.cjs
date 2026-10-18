// Teste rápido na rede P2P real (DHT pública do Hyperswarm), com dois motores neste PC.
// Uso: node scripts/check-public-dht.cjs
const fs = require('fs');
const os = require('os');
const path = require('path');
const { SyncEngine } = require('../src/core/sync/engine');
const { createInviteCode } = require('../src/core/sync/invite');

(async () => {
	const code = createInviteCode();
	const a = fs.mkdtempSync(path.join(os.tmpdir(), 'pub-a-'));
	const b = fs.mkdtempSync(path.join(os.tmpdir(), 'pub-b-'));
	fs.writeFileSync(path.join(a, 'oi.md'), 'olá pela internet');
	const A = new SyncEngine({ folder: a, code, deviceName: 'A', teamName: 'Teste' });
	const B = new SyncEngine({ folder: b, code, deviceName: 'B' });
	const started = Date.now();
	await A.start();
	await B.start();
	const timer = setTimeout(async () => {
		console.log('FALHOU: sem conexão em 60 s');
		await A.stop();
		await B.stop();
		process.exit(1);
	}, 60_000);
	const check = setInterval(async () => {
		if (fs.existsSync(path.join(b, 'oi.md'))) {
			clearInterval(check);
			clearTimeout(timer);
			console.log(`OK: conectados pela DHT pública e arquivo sincronizado em ${((Date.now() - started) / 1000).toFixed(1)} s`);
			await A.stop();
			await B.stop();
			process.exit(0);
		}
	}, 200);
})();
