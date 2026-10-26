import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { render, parse, supports, PeleError, detectType } from 'pele';

const root = fileURLToPath(new URL('../', import.meta.url));
const cli = fileURLToPath(new URL('./render.mjs', import.meta.url));
const catalog = JSON.parse(await readFile(new URL('../assets/examples.json', import.meta.url), 'utf8'));
const packageInfo = JSON.parse(await readFile(new URL('../node_modules/pele/package.json', import.meta.url), 'utf8'));
const temporary = await mkdtemp(join(tmpdir(), 'run-pele-verify-'));
const checks = [];

function run(args, expected = 0) {
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', timeout: 15000 });
  assert.ifError(result.error);
  assert.equal(result.status, expected, result.stderr || result.stdout);
  return result;
}

try {
  assert.equal(packageInfo.version, '1.10.0');
  const types = new Set();
  for (const entry of catalog.examples) {
    types.add(detectType(entry.source));
    for (const maxWidth of [undefined, 320]) {
      const result = render(entry.source, { idPrefix: `verify-${entry.id}`, links: false, images: false, now: new Date('2026-10-26T00:00:00Z'), ...(maxWidth ? { maxWidth } : {}) });
      assert(result.svg.startsWith('<svg'));
      assert(Number.isFinite(result.width) && result.width > 0);
      assert(Number.isFinite(result.height) && result.height > 0);
    }
  }
  types.add(render('info').type);
  const declared = (await readdir(new URL('../node_modules/pele/dist/entries/', import.meta.url))).filter(name => name.endsWith('.d.ts')).map(name => name.slice(0, -5));
  assert.deepEqual([...types].sort(), declared.sort());
  checks.push(`All ${catalog.examples.length} captured examples render at natural width and 320 px; all ${types.size} installed diagram types represented`);

  const broken = 'flowchart TD\n A[broken --> B';
  assert.equal(supports(broken), true);
  assert.throws(() => render(broken), error => error instanceof PeleError && error.code === 'syntax');
  assert.throws(() => render('zenuml\nA->B'), error => error.code === 'unsupported-diagram');
  assert.throws(() => render('flowchart LR\nA-->B', { limit: 5 }), error => error.code === 'limit');
  assert.throws(() => render('flowchart LR\nA-->B', { outputLimit: 5 }), error => error.code === 'limit');
  const linked = 'flowchart LR\nA[Open]\nclick A "https://example.com"';
  assert.equal(render(linked, { links: false, images: false }).links.length, 0);
  assert.equal(render(linked, { links: true }).links.length, 1);
  const scriptLink = 'flowchart LR\nA[Open]\nclick A "javascript:alert(1)"';
  assert.equal(render(scriptLink).links.length, 0);
  checks.push('Invalid syntax, unsupported type, source/output limits, disabled links and blocked javascript URLs behave as expected');

  const source = 'flowchart LR\naccTitle: Review\nA[Draft]-->B[Published]';
  const model = parse(source);
  assert.equal(render(model, { idPrefix: 'one' }).type, 'flowchart');
  assert(!render(model, { idPrefix: 'two' }).svg.includes('id="one-'));
  run(['--input-type=module', '-e', "import assert from 'node:assert/strict'; import {supports,register,render} from 'pele/core'; import flowchart from 'pele/diagrams/flowchart'; assert.equal(supports('flowchart LR\\nA-->B'),false); register(flowchart); assert.equal(render('flowchart LR\\nA-->B').type,'flowchart');"]);
  run(['--input-type=module', '-e', "import assert from 'node:assert/strict'; import {renderAsync} from 'pele/lazy'; assert.equal((await renderAsync('sequenceDiagram\\nA->>B: Hi')).type,'sequence');"]);
  checks.push('parse/render, isolated core registration and lazy loading work');

  const input = join(temporary, 'diagram.mmd');
  const svg = join(temporary, 'diagram.svg');
  const html = join(temporary, 'diagram.html');
  await writeFile(input, source);
  const receipt = JSON.parse(run([cli, input, svg]).stdout);
  assert.equal(receipt.type, 'flowchart');
  assert((await readFile(svg, 'utf8')).includes('<style>'));
  run([cli, input, html, '--theme', 'dark', '--lang', 'zh-CN']);
  assert((await readFile(html, 'utf8')).includes('data-theme="dark"'));
  assert((await readFile(html, 'utf8')).includes('lang="zh-CN"'));
  const before = await readFile(svg);
  assert.equal(JSON.parse(run([cli, input, svg], 1).stderr).code, 'EEXIST');
  assert.deepEqual(await readFile(svg), before);
  run([cli, input, svg, '--force', '--max-width', '320']);
  checks.push('CLI produces SVG/HTML, reports results and preserves existing output unless force is explicit');

  const markdown = join(temporary, 'notes.md');
  await writeFile(markdown, '# Note\n\n```mermaid\n' + source + '\n```\n\n~~~~text\n```mermaid\ninvalid\n```\n~~~~\n\n~~~mermaid\nsequenceDiagram\nA->>B: Hi\n~~~\n');
  const checked = JSON.parse(run([cli, '--check', markdown]).stdout);
  assert.equal(checked.checked, 2);
  await writeFile(markdown, '# Note\n\n```mermaid\n' + broken + '\n```\n');
  const failed = JSON.parse(run([cli, '--check', markdown], 1).stdout);
  assert.equal(failed.results[0].code, 'syntax');
  assert(failed.results[0].line >= 4);
  await writeFile(markdown, '# No diagram');
  run([cli, '--check', markdown], 1);
  const timeout = run([cli, input, join(temporary, 'timeout.svg'), '--timeout-ms', '1'], 1);
  assert.equal(JSON.parse(timeout.stderr).code, 'timeout');
  checks.push('Markdown extraction avoids nested examples, maps error lines, rejects empty work and terminates an expired render worker');
  console.log(JSON.stringify({ ok: true, pele: packageInfo.version, types: types.size, examples: catalog.examples.length, renderCalls: catalog.examples.length * 2, checks }, null, 2));
} finally {
  await rm(temporary, { recursive: true, force: true });
}
