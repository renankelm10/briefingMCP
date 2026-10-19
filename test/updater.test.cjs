// Comparação de versões usada pelo atualizador.
// Rodar: node --test test/updater.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const { isNewer } = require('../src/main/updater');

test('compara versões numericamente, com ou sem "v"', () => {
	assert.ok(isNewer('0.3.1', '0.3.0'));
	assert.ok(isNewer('v0.3.10', '0.3.9'));
	assert.ok(isNewer('1.0.0', '0.99.99'));
	assert.ok(!isNewer('0.3.1', '0.3.1'));
	assert.ok(!isNewer('0.3.0', '0.3.1'));
	assert.ok(!isNewer('0.3.1-beta.1', '0.3.1'));
	assert.ok(!isNewer('', '0.3.1'));
});
