// Sobe uma rede DHT local para testar a sincronização sem depender da internet.
// Uso: node scripts/dev-testnet.cjs <arquivo-de-saída>
// Grava "host:porta,host:porta" no arquivo; use em BRIEFING_DHT_BOOTSTRAP.
const fs = require('fs');
const createTestnet = require('hyperdht/testnet');

(async () => {
	const testnet = await createTestnet(3);
	const value = testnet.bootstrap.map((b) => `${b.host}:${b.port}`).join(',');
	if (process.argv[2]) fs.writeFileSync(process.argv[2], value);
	console.log(`DHT de teste pronta: ${value}`);
	process.on('SIGINT', () => testnet.destroy().then(() => process.exit(0)));
	setInterval(() => {}, 1 << 30);
})();
