// Build the existing single-IIFE game from ordered, stage-focused source sections.
// Concatenation deliberately makes NO runtime/module-scope changes.
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = join(root, 'tools', 'game-sources.json');
const sources = JSON.parse(await readFile(manifestPath, 'utf8'));
if (!Array.isArray(sources) || sources.length === 0) {
  throw new Error('Missing or empty game source manifest.');
}

let combined = '';
for (const relativePath of sources) {
  if (typeof relativePath !== 'string' ||
      !/^src\/[a-z0-9/_-]+\.js$/.test(relativePath) ||
      relativePath.split('/').includes('..')) {
    throw new Error('Invalid source path in manifest: ' + relativePath);
  }
  combined += await readFile(join(root, relativePath), 'utf8');
}

const outputPath = join(root, 'game.js');
if (process.argv.includes('--check')) {
  const current = await readFile(outputPath, 'utf8');
  if (current !== combined) {
    console.error('game.js is out of sync. Run: npm run build');
    process.exitCode = 1;
  } else {
    console.log('PASS: game.js exactly matches all ' + sources.length + ' ordered source sections.');
  }
} else {
  await writeFile(outputPath, combined, 'utf8');
  console.log('Built game.js from ' + sources.length + ' source sections.');
}
