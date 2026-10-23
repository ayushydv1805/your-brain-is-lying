import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const manifestUrl = new URL('../../public/manifest.webmanifest', import.meta.url);
const iconUrl = new URL('../../public/brain-mark.svg', import.meta.url);
const vercelUrl = new URL('../../vercel.json', import.meta.url);

test('PWA manifest declares a standalone app and a valid icon', async () => {
  const manifest = JSON.parse(await readFile(manifestUrl, 'utf8'));
  assert.equal(manifest.name, 'Your Brain Is Lying');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, '/');
  assert.ok(manifest.icons.some((icon) => icon.src === '/brain-mark.svg'));
  const icon = await readFile(iconUrl, 'utf8');
  assert.match(icon, /<svg[\s>]/);
  assert.match(icon, /viewBox="0 0 512 512"/);
});

test('Vercel deployment config uses the lockfile and Vite output directory', async () => {
  const config = JSON.parse(await readFile(vercelUrl, 'utf8'));
  assert.equal(config.framework, 'vite');
  assert.equal(config.installCommand, 'npm ci');
  assert.equal(config.buildCommand, 'npm run build');
  assert.equal(config.outputDirectory, 'dist');
  assert.ok(config.headers.some((entry) => entry.source === '/sw.js'));
});

test('offline worker pre-caches the privacy page and production assets', async () => {
  const worker = await readFile(new URL('../../public/sw.js', import.meta.url), 'utf8');
  assert.match(worker, /'\/privacy\.html'/);
  assert.match(worker, /\/assets\\\//);
  assert.match(worker, /cache\.addAll\(APP_SHELL\)/);
});

