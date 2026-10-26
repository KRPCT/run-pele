import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = new URL('../', import.meta.url);
const outputDirectory = new URL('../assets/readme/', import.meta.url);
await mkdir(outputDirectory, { recursive: true });
const examples = ['review-flow', 'order-handoff'];
const outputs = [];
for (const name of examples) {
  const input = fileURLToPath(new URL(`examples/${name}.mmd`, root));
  const output = fileURLToPath(new URL(`${name}.svg`, outputDirectory));
  const result = spawnSync(process.execPath, [
    fileURLToPath(new URL('./render.mjs', import.meta.url)), input, output,
    '--theme', 'light', '--keep-direction', '--id-prefix', `readme-${name}`, '--force',
  ], { encoding: 'utf8', timeout: 15000 });
  if (result.error || result.status !== 0) throw new Error(result.error?.message ?? result.stderr ?? result.stdout);
  // Keep generated artifact receipts portable; absolute local paths are not published.
  const receipt = JSON.parse(result.stdout);
  outputs.push({ source: `examples/${name}.mmd`, output: `assets/readme/${name}.svg`, type: receipt.type, width: receipt.width, height: receipt.height, bytes: receipt.bytes });
}
const packageInfo = JSON.parse(await readFile(new URL('node_modules/pele/package.json', root), 'utf8'));
await writeFile(new URL('manifest.json', outputDirectory), JSON.stringify({ renderer: 'pele', version: packageInfo.version, command: 'npm run showcase', outputs }, null, 2) + '\n');
console.log(JSON.stringify({ ok: true, renderer: 'pele', version: packageInfo.version, outputs }, null, 2));
