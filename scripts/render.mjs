#!/usr/bin/env node
import { readFile, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, extname } from 'node:path';
import { parseArgs } from 'node:util';
import { Worker } from 'node:worker_threads';

const help = `Render locally with the pinned Pele package; no automatic installs or uploads.
  node scripts/render.mjs INPUT.mmd OUTPUT.svg
  node scripts/render.mjs INPUT.mmd OUTPUT.html --theme dark
  node scripts/render.mjs --check FILE.mmd [FILE.md ...]
Options: --max-width N --font FAMILY --font-size N --id-prefix ID
         --fixed --keep-direction --allow-links --allow-images --force
         --theme light|dark|auto --lang BCP47 --timeout-ms N (default 10000)
SVG/HTML output is browser-oriented. PNG/PDF conversion needs CSS-variable
resolution and a separately verified exporter. Existing output is preserved
unless --force is given. Markdown inputs are supported in --check mode only.`;

function positiveNumber(value, fallback, maximum = Infinity) {
  if (value === undefined) return fallback;
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0 || number > maximum) throw new Error(`Invalid positive numeric option: ${value}`);
  return number;
}

function extractMarkdown(text, file) {
  const lines = text.split('\n');
  const diagrams = [];
  let fence = null;
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (!fence) {
      const match = line.match(/^ {0,3}(`{3,}|~{3,})([^\n]*)$/);
      if (match) fence = { marker: match[1][0], length: match[1].length, mermaid: /^mermaid(?:\s|$)/i.test(match[2].trim()), start: index + 1, lines: [] };
    } else if (new RegExp(`^ {0,3}${fence.marker}{${fence.length},}\\s*$`).test(line)) {
      if (fence.mermaid) diagrams.push({ file, source: fence.lines.join('\n'), lineOffset: fence.start, index: diagrams.length + 1 });
      fence = null;
    } else {
      fence.lines.push(line);
    }
  }
  if (fence?.mermaid) throw new Error(`${file}: unclosed Mermaid fence`);
  if (!diagrams.length) throw new Error(`${file}: no top-level Mermaid fences found`);
  return diagrams;
}

async function renderBounded(diagrams, options, check, timeout) {
  const worker = new Worker(new URL('./render-worker.mjs', import.meta.url), { workerData: { diagrams, options, check } });
  let timer;
  try {
    return await new Promise((accept, reject) => {
      timer = setTimeout(() => reject(Object.assign(new Error(`Rendering exceeded ${timeout} ms`), { code: 'timeout' })), timeout);
      worker.once('message', accept);
      worker.once('error', reject);
      worker.once('exit', code => reject(new Error(`Renderer exited before a result (exit ${code})`)));
    });
  } finally {
    clearTimeout(timer);
    await worker.terminate();
  }
}

async function main() {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    help: { type: 'boolean' }, check: { type: 'boolean' }, force: { type: 'boolean' },
    fixed: { type: 'boolean' }, 'keep-direction': { type: 'boolean' },
    'allow-links': { type: 'boolean' }, 'allow-images': { type: 'boolean' },
    'max-width': { type: 'string' }, font: { type: 'string' }, 'font-size': { type: 'string' },
    'id-prefix': { type: 'string' }, 'timeout-ms': { type: 'string' }, theme: { type: 'string', default: 'auto' },
    lang: { type: 'string', default: 'und' },
  } });
  if (values.help) return console.log(help);
  if (values.check ? positionals.length === 0 : positionals.length !== 2) throw new Error(help);
  if (!['light', 'dark', 'auto'].includes(values.theme)) throw new Error('Theme must be light, dark or auto');
  const language = Intl.getCanonicalLocales(values.lang)[0];
  if (!language || !/^[a-zA-Z0-9-]+$/.test(language)) throw new Error('lang must be a valid BCP 47 language tag');
  const files = values.check ? positionals : [positionals[0]];
  const diagrams = [];
  for (const input of files) {
    const file = resolve(input);
    if ((await stat(file)).size > 2_000_000) throw new Error(`${file}: input exceeds the 2 MB file limit`);
    const text = (await readFile(file, 'utf8')).replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
    if (/\.md(?:own)?$/i.test(file)) {
      if (!values.check) throw new Error('Use --check for Markdown, or save one diagram as a .mmd file before rendering');
      diagrams.push(...extractMarkdown(text, file));
    } else diagrams.push({ file, source: text, lineOffset: 0, index: 1 });
  }
  const prefix = values['id-prefix'] ?? `pele-${createHash('sha256').update(files.map(file => resolve(file)).join('|')).digest('hex').slice(0, 10)}`;
  if (!/^[a-zA-Z0-9_-]+$/.test(prefix)) throw new Error('id-prefix must contain only letters, digits, hyphens or underscores');
  const options = {
    idPrefix: prefix, links: values['allow-links'] ?? false, images: values['allow-images'] ?? false,
    responsive: !values.fixed, autoDirection: !values['keep-direction'],
    fontFamily: values.font ?? 'sans-serif', fontSize: positiveNumber(values['font-size'], 16),
    ...(values['max-width'] ? { maxWidth: positiveNumber(values['max-width']) } : {}),
  };
  const results = await renderBounded(diagrams, options, values.check, positiveNumber(values['timeout-ms'], 10000, 120000));
  const failures = results.filter(result => !result.ok);
  if (values.check || failures.length) {
    console.log(JSON.stringify({ ok: !failures.length, pele: '1.10.0', checked: results.length, results }, null, 2));
    if (failures.length) process.exitCode = 1;
    return;
  }
  const output = resolve(positionals[1]);
  if (files.some(file => resolve(file).toLowerCase() === output.toLowerCase())) throw new Error('Output must differ from input');
  const suffix = extname(output).toLowerCase();
  if (!['.svg', '.html'].includes(suffix)) throw new Error('Output extension must be .svg or .html');
  const css = await readFile(new URL('../assets/theme.css', import.meta.url), 'utf8');
  const { svg, ...receipt } = results[0];
  const themedSvg = svg.replace(/<svg\b/, `<svg data-theme="${values.theme}"`).replace(/(<svg\b[^>]*>)/, `$1<style>${css}</style>`);
  const content = suffix === '.html' ? `<!doctype html>\n<html lang="${language}"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Pele diagram</title><style>body{margin:clamp(12px,4vw,32px);font-family:sans-serif}figure{margin:0;overflow:auto}</style><figure>${themedSvg}</figure></html>\n` : themedSvg + '\n';
  await writeFile(output, content, { encoding: 'utf8', flag: values.force ? 'w' : 'wx' });
  console.log(JSON.stringify({ ...receipt, output, pele: '1.10.0', bytes: Buffer.byteLength(content) }));
}

try { await main(); } catch (error) {
  console.error(JSON.stringify({ ok: false, code: error.code ?? 'usage', message: error.message }));
  process.exitCode = 1;
}
