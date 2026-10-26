import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { render } from 'pele';

const root = new URL('../', import.meta.url);
const outputDirectory = new URL('../assets/readme/', import.meta.url);
const examples = JSON.parse(await readFile(new URL('examples/showcase.json', root), 'utf8'));
const theme = await readFile(new URL('assets/readme/theme.css', root), 'utf8');
const packageInfo = JSON.parse(await readFile(new URL('node_modules/pele/package.json', root), 'utf8'));
const font = 'Segoe UI, Microsoft YaHei, PingFang SC, sans-serif';
const escapeXml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character]);
await mkdir(outputDirectory, { recursive: true });

function frame(result, entry, index) {
  const scale = Math.min(1.5, 1120 / result.width);
  const height = Math.ceil(146 + result.height * scale);
  const x = (1200 - result.width * scale) / 2;
  return {
    scale,
    height,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${height}" viewBox="0 0 1200 ${height}" role="img" aria-labelledby="board-title board-desc">
  <title id="board-title">${escapeXml(entry.title)}</title>
  <desc id="board-desc">${escapeXml(entry.features)}。使用 Pele ${packageInfo.version} 从 Mermaid 源码生成。</desc>
  <rect width="1200" height="${height}" rx="12" fill="#fcfcfa"/>
  <style>${theme}</style>
  <g font-family="${font}">
    <text x="40" y="52" font-size="24" font-weight="600" fill="#c95d43">${String(index + 1).padStart(2, '0')}</text>
    <text x="92" y="52" font-size="30" font-weight="600" fill="#242a32">${escapeXml(entry.title)}</text>
    <text x="92" y="82" font-size="18" fill="#69737f">${escapeXml(entry.features)}</text>
    <text x="1160" y="50" text-anchor="end" font-size="16" fill="#69737f">${escapeXml(entry.type.toUpperCase())}</text>
  </g>
  <path d="M40 102 H1160" stroke="#dde3e8"/>
  <g transform="translate(${x} 124) scale(${scale})">${result.svg}</g>
</svg>
`,
  };
}

const outputs = [];
for (const [index, entry] of examples.entries()) {
  const sourcePath = `examples/${entry.id}.mmd`;
  const source = await readFile(new URL(sourcePath, root), 'utf8');
  let result;
  try {
    result = render(source, {
      idPrefix: `readme-${entry.id}`, fontFamily: font, fontSize: entry.fontSize,
      maxWidth: entry.maxWidth, autoDirection: false, responsive: false,
      config: entry.config,
      links: false, images: false, now: new Date('2026-10-26T00:00:00Z'),
    });
  } catch (error) {
    throw new Error(`${entry.id}: ${error.code ?? 'render-failed'}: ${error.message}`);
  }
  if (result.type !== entry.type) throw new Error(`${entry.id}: expected ${entry.type}, got ${result.type}`);
  const board = frame(result, entry, index);
  const output = `assets/readme/${entry.id}.svg`;
  await writeFile(new URL(output, root), board.svg);
  outputs.push({ source: sourcePath, output, type: result.type, title: entry.title, naturalWidth: result.width, naturalHeight: result.height, boardWidth: 1200, boardHeight: board.height, scale: board.scale, approximateTextSizeAt900px: Number((entry.fontSize * board.scale * 0.75).toFixed(1)), sourceSha256: createHash('sha256').update(source).digest('hex'), outputSha256: createHash('sha256').update(board.svg).digest('hex') });
}

// These are the small examples used by the quick-start commands.
const quickStarts = [];
for (const name of ['review-flow', 'order-handoff']) {
  const source = await readFile(new URL(`examples/${name}.mmd`, root), 'utf8');
  const result = render(source, { idPrefix: `readme-${name}`, fontFamily: font, links: false, images: false });
  await writeFile(new URL(`${name}.svg`, outputDirectory), result.svg.replace(/(<svg[^>]*>)/, `$1<style>${theme}</style>`) + '\n');
  quickStarts.push({ source: `examples/${name}.mmd`, output: `assets/readme/${name}.svg`, type: result.type, width: result.width, height: result.height });
}

const heroDiagram = render('flowchart LR\nsource[Mermaid] --> engine[Pele]\nengine --> svg[SVG]\nengine --> html[HTML]', { idPrefix: 'hero', fontFamily: font, fontSize: 26, responsive: false, links: false, images: false });
const heroScale = Math.min(1, 520 / heroDiagram.width);
const hero = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="420" viewBox="0 0 1200 420" role="img" aria-labelledby="hero-title hero-desc">
  <title id="hero-title">Run Pele — Mermaid 图表渲染与可复用技能</title>
  <desc id="hero-desc">33 类图型，591 个官方来源示例，12 组复杂案例。将 Mermaid 渲染为 SVG 与 HTML，保留可编辑源码。</desc>
  <rect width="1200" height="420" rx="16" fill="#111821"/>
  <g font-family="${font}">
    <text x="52" y="58" font-size="18" letter-spacing="2" fill="#b5c0cc">MERMAID · SVG · HTML</text>
    <text x="48" y="151" font-size="86" font-weight="650" letter-spacing="-3" fill="#f2f3ef">Run Pele<tspan fill="#ed8b6b">.</tspan></text>
    <text x="52" y="210" font-size="32" fill="#f2f3ef">从源码到图表，</text>
    <text x="52" y="255" font-size="32" fill="#f2f3ef">把结构讲清楚。</text>
    <path d="M52 302 H1148" stroke="#344150"/>
    <text x="52" y="366" font-size="42" font-weight="600" fill="#ed8b6b">33<tspan dx="16" font-size="21" font-weight="400" fill="#c1cbd6">类图型</tspan></text>
    <text x="332" y="366" font-size="42" font-weight="600" fill="#f2f3ef">591<tspan dx="16" font-size="21" font-weight="400" fill="#c1cbd6">个示例</tspan></text>
    <text x="670" y="366" font-size="42" font-weight="600" fill="#f2f3ef">12<tspan dx="16" font-size="21" font-weight="400" fill="#c1cbd6">组深入案例</tspan></text>
    <text x="1148" y="366" text-anchor="end" font-size="19" fill="#aab7c5">Pele ${packageInfo.version}</text>
    <text x="646" y="61" font-size="20" fill="#aab7c5" font-family="Consolas, monospace">render(source).svg</text>
  </g>
  <style>.hero-diagram .pele{--pele-bg:#111821;--pele-fg:#f2f3ef;--pele-line:#b7c6d5;--pele-surface:#202e3c;--pele-border:#62788b;--pele-accent:#ed8b6b;--pele-radius:8px}</style>
  <g class="hero-diagram" transform="translate(626 100) scale(${heroScale})">${heroDiagram.svg}</g>
</svg>
`;
await writeFile(new URL('hero.svg', outputDirectory), hero);

const palettes = [
  { name: '纸面 · PAPER', bg: '#fcfcfa', fg: '#242a32', surface: '#f0f3f6', line: '#566170', border: '#a3afba' },
  { name: '夜间 · NIGHT', bg: '#16212d', fg: '#e3eaf1', surface: '#293b4d', line: '#a8bdce', border: '#6f8b9e' },
  { name: '暖色 · SAND', bg: '#f5efe3', fg: '#4b3e30', surface: '#e9dfcb', line: '#8b7158', border: '#b9a58c' },
];
const panels = palettes.map((palette, index) => {
  const result = render('flowchart LR\nA[输入] --> B[校验] --> C[图表]', { idPrefix: `theme-${index}`, fontFamily: font, fontSize: 22, responsive: false, links: false, images: false });
  const scale = Math.min(1, 320 / result.width);
  const x = 24 + index * 392;
  return `<g><rect x="${x}" y="78" width="376" height="196" rx="10" fill="${palette.bg}" stroke="#c9cdd2"/><text x="${x + 24}" y="117" font-family="${font}" font-size="20" font-weight="600" fill="${palette.fg}">${palette.name}</text><g style="--pele-bg:${palette.bg};--pele-fg:${palette.fg};--pele-surface:${palette.surface};--pele-line:${palette.line};--pele-border:${palette.border}" transform="translate(${x + 28} 164) scale(${scale})">${result.svg}</g></g>`;
}).join('\n');
const themes = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="300" viewBox="0 0 1200 300" role="img" aria-labelledby="theme-title"><title id="theme-title">同一份 Mermaid，三组 CSS 主题</title><rect width="1200" height="300" rx="12" fill="#fcfcfa"/><text x="28" y="44" font-family="${font}" font-size="30" font-weight="600" fill="#242a32">同一份源码，三种主题</text>${panels}</svg>
`;
await writeFile(new URL('theme-comparison.svg', outputDirectory), themes);
await writeFile(new URL('manifest.json', outputDirectory), JSON.stringify({ renderer: 'pele', version: packageInfo.version, command: 'npm run showcase', referenceTime: '2026-10-26T00:00:00Z', scenarioCount: outputs.length, diagramTypeCount: new Set(outputs.map(output => output.type)).size, outputs, quickStarts, composedAssets: ['assets/readme/hero.svg', 'assets/readme/theme-comparison.svg'] }, null, 2) + '\n');
console.log(JSON.stringify({ ok: true, renderer: 'pele', version: packageInfo.version, outputs }, null, 2));
