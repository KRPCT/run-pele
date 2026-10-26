#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { detectType } from 'pele';

const catalog = JSON.parse(await readFile(new URL('../assets/examples.json', import.meta.url), 'utf8'));
const { values } = parseArgs({ options: {
  type: { type: 'string' }, example: { type: 'string' }, search: { type: 'string' }, help: { type: 'boolean' },
} });
if (values.help) {
  console.log('catalog.mjs [--type <page-type>] [--example <1-based number>] [--search <text>]\nWithout flags, lists all types. --type lists examples; --example prints source only.');
  process.exit(0);
}
if (values.example && !values.type) throw new Error('--example requires --type');
const examples = [...catalog.examples, { id: 'info', page_type: 'info', source: 'info\n', origins: [{ url: 'https://pele.run/compatibility', block: 0 }] }];
let selected = examples.filter(row => !values.type || row.page_type === values.type);
if (values.type && selected.length === 0) throw new Error(`Unknown page type: ${values.type}`);
if (values.example) {
  const index = Number(values.example) - 1;
  if (!Number.isInteger(index) || !selected[index]) throw new Error('Example number is outside this type');
  process.stdout.write(selected[index].source);
} else if (values.type || values.search) {
  const rows = selected.map((row, index) => ({ number: index + 1, id: row.id, type: row.page_type, source: row.source, origins: row.origins }));
  console.log(JSON.stringify(values.search ? rows.filter(row => row.source.toLowerCase().includes(values.search.toLowerCase())).slice(0, 12) : rows, null, 2));
} else {
  console.log(JSON.stringify([...new Set(examples.map(row => row.page_type))].map(type => {
    const rows = examples.filter(row => row.page_type === type);
    return { pageType: type, moduleType: detectType(rows[0].source), examples: rows.length, url: type === 'info' ? 'https://pele.run/compatibility' : `https://pele.run/examples/${type}` };
  }), null, 2));
}
