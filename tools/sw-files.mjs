// Works out what sw.js should list: every app file, and a VERSION made from
// their contents, so any change to any file makes iPads fetch the new copy.
//
//   node tools/sw-files.mjs    rewrites FILES and VERSION in sw.js
//
// tests/files.test.mjs fails when sw.js is out of date.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function walk(dir) {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]);
}

export function appFiles() {
  const files = [...walk('css'), ...walk('js'), ...walk('assets')]
    .filter((f) => !f.endsWith('icon.svg'))
    .sort();
  return ['./', 'index.html', 'manifest.webmanifest', ...files];
}

export function contentVersion(files = appFiles()) {
  const h = crypto.createHash('sha256');
  for (const f of files) {
    if (f === './') continue;
    h.update(f + '\0');
    h.update(fs.readFileSync(path.join(root, f)));
  }
  return 'boba-' + h.digest('hex').slice(0, 12);
}

export function expectedHead(files = appFiles()) {
  return `const VERSION = '${contentVersion(files)}';\nconst FILES = [\n${files.map((f) => `  '${f}',\n`).join('')}];`;
}

const HEAD = /const VERSION = '[^']*';\nconst FILES = \[[\s\S]*?\];/;

export function swIsCurrent() {
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const m = HEAD.exec(sw);
  return m && m[0] === expectedHead();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const file = path.join(root, 'sw.js');
  const sw = fs.readFileSync(file, 'utf8');
  if (!HEAD.test(sw)) throw new Error('sw.js: could not find VERSION and FILES');
  fs.writeFileSync(file, sw.replace(HEAD, expectedHead()));
  console.log(`sw.js: ${appFiles().length} files, version ${contentVersion()}`);
}
