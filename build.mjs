// Empacota o renderer (app + worker) em dist/ com esbuild.
import { build } from 'esbuild';
import { cp, mkdir } from 'node:fs/promises';

await mkdir('dist', { recursive: true });
await build({
	entryPoints: { app: 'src/renderer/app.js', indexer: 'src/renderer/indexer.worker.js' },
	outdir: 'dist',
	bundle: true,
	format: 'iife',
	platform: 'browser',
	target: 'chrome130',
	sourcemap: true,
	logLevel: 'info',
});
await cp('src/renderer/index.html', 'dist/index.html');
await cp('src/renderer/styles.css', 'dist/styles.css');
