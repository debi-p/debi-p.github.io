import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

async function read(relativePath) {
  return readFile(path.join(root, relativePath));
}

async function readText(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8');
}

function digest(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

test('ships two distinct, nontrivial PDF resumes', async () => {
  const paths = [
    'assets/resume/Debi_Prasad.pdf',
    'assets/resume/debi_prasad_resume.pdf',
  ];
  const files = await Promise.all(paths.map(read));
  const stats = await Promise.all(paths.map((relativePath) => {
    return stat(path.join(root, relativePath));
  }));

  for (const [index, file] of files.entries()) {
    assert.ok(file.length > 10_000, `${paths[index]} must be a nontrivial PDF`);
    assert.equal(file.subarray(0, 5).toString('ascii'), '%PDF-');
  }

  assert.notEqual(digest(files[0]), digest(files[1]), 'resume PDFs must have distinct content');
  assert.notDeepEqual(
    [stats[0].dev, stats[0].ino],
    [stats[1].dev, stats[1].ino],
    'resume PDFs must be distinct files',
  );
});

test('ships the accessible DP favicon with the approved identity colors', async () => {
  const favicon = await readText('assets/images/favicon.svg');

  assert.match(favicon, /^<svg\b[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(favicon, /\bviewBox="0 0 64 64"/);
  assert.match(favicon, /\brole="img"/);
  assert.match(favicon, /\baria-label="DP"/);
  assert.match(favicon, /#15191b/i);
  assert.match(favicon, /#6ce1bf/i);
  assert.match(favicon, /<\/svg>\s*$/);
});

test('ships an exact 1200 by 630 PNG social preview', async () => {
  const preview = await read('assets/images/social-preview.png');
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  assert.ok(preview.length > 20_000, 'social preview must be a nontrivial image');
  assert.deepEqual(preview.subarray(0, 8), pngSignature);
  assert.equal(preview.readUInt32BE(8), 13, 'the first PNG chunk must be IHDR');
  assert.equal(preview.subarray(12, 16).toString('ascii'), 'IHDR');
  assert.equal(preview.readUInt32BE(16), 1200);
  assert.equal(preview.readUInt32BE(20), 630);
});

test('loads Playwright portably without a committed machine path', async () => {
  const helper = await readText('tests/helpers/playwright.mjs');

  assert.match(helper, /export async function loadPlaywright\(\)/);
  assert.match(
    helper,
    /process\.env\.PLAYWRIGHT_MODULE_PATH\s*\|\|\s*["']playwright["']/,
  );
  assert.match(helper, /return import\(specifier\)/);
  assert.doesNotMatch(helper, /\/Users\//);
});

test('captures the live hero and always closes Chromium', async () => {
  const capture = await readText('scripts/capture-social-preview.mjs');

  assert.match(capture, /http:\/\/127\.0\.0\.1:4173/);
  assert.match(capture, /assets\/images\/social-preview\.png/);
  assert.match(capture, /mkdir\([^)]*recursive:\s*true/s);
  assert.match(capture, /chromium\.launch\([^)]*headless:\s*true/s);
  assert.match(capture, /finally\s*{[\s\S]*?browser\?\.close\(\)/);
  assert.doesNotMatch(capture, /\/Users\//);
});

test('documents local use, verification, deployment, and project curation', async () => {
  const readme = await readText('README.md');

  for (const required of [
    '# Debi Prasad Portfolio',
    'https://debi-p.github.io/',
    'npm install',
    'npm run serve',
    'http://localhost:4173',
    'npm test',
    'npm run check:links',
    'npm run test:visual',
    'GitHub Pages',
    'debi-p.github.io',
    'main',
    'repository root',
    'Cloudflare Pages',
    'Netlify',
    'Vercel',
    'no build command',
    'public.json',
    'status',
    'active',
    'order',
    'liveUrl',
    'sourceUrl',
    'coverImage',
    'github.com/debi-p/',
  ]) {
    assert.ok(readme.includes(required), `README must include: ${required}`);
  }

  assert.match(readme, /may point to the same destination/i);
  assert.match(readme, /with (?:the )?server running[,:]?\s*`npm run test:visual`/i);
});

test('keeps Task 7 documentation and JavaScript free of private environment details', async () => {
  const publicSources = await Promise.all([
    readText('README.md'),
    readText('tests/helpers/playwright.mjs'),
    readText('scripts/capture-social-preview.mjs'),
  ]);
  const combined = publicSources.join('\n').toLowerCase();
  const forbidden = [
    '/users/' + 'debi.pradhan',
    '.cache/' + 'codex-runtimes',
    'thermofisher.' + 'atlassian.net',
    'workflow ' + 'forge',
    'py' + 'wizard',
    'signed ' + 'url',
  ];

  for (const term of forbidden) {
    assert.equal(combined.includes(term), false, `private term must not be committed: ${term}`);
  }
});
