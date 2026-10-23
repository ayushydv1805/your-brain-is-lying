import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const manifestUrl = new URL('../../public/manifest.webmanifest', import.meta.url);
const iconUrl = new URL('../../public/brain-mark.svg', import.meta.url);
const vercelUrl = new URL('../../vercel.json', import.meta.url);
const viteUrl = new URL('../../vite.config.js', import.meta.url);
const packageUrl = new URL('../../package.json', import.meta.url);

test('PWA manifest declares a standalone app and a valid icon', async () => {
  const manifest = JSON.parse(await readFile(manifestUrl, 'utf8'));
  assert.equal(manifest.name, 'Your Brain Is Lying');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, '/');
  assert.ok(manifest.icons.some((icon) => icon.src === './brain-mark.svg'));
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
  assert.ok(worker.includes("'/privacy.html'"));
  assert.ok(worker.includes("url.pathname.startsWith('/assets/')"));
  assert.ok(worker.includes('cache.addAll(APP_SHELL)'));
});

test('Vite uses relative assets and the desktop app is configured', async () => {
  const vite = await readFile(viteUrl, 'utf8');
  const pkg = JSON.parse(await readFile(packageUrl, 'utf8'));
  assert.match(vite, /base:\s*['"]\.\/['"]/);
  assert.equal(pkg.main, 'desktop/main.cjs');
  assert.equal(pkg.build.productName, 'Your Brain Is Lying');
  assert.equal(pkg.build.electronVersion, '45.0.0');
  assert.ok(pkg.build.win.target.some((target) => target.target === 'nsis'));
  assert.ok(pkg.build.win.target.some((target) => target.target === 'portable'));
});

test('Android package embeds the web app and restricts navigation', async () => {
  const gradle = await readFile(new URL('../../android/app/build.gradle', import.meta.url), 'utf8');
  const activity = await readFile(new URL('../../android/app/src/main/java/com/ayushyadav/yourbrainislying/MainActivity.java', import.meta.url), 'utf8');
  assert.match(gradle, /applicationId 'com\.ayushyadav\.yourbrainislying'/);
  assert.match(gradle, /dependsOn tasks\.named\('syncWebAssets'\)/);
  assert.match(activity, /setAllowUniversalAccessFromFileURLs\(false\)/);
  assert.match(activity, /MediaStore\.Downloads\.EXTERNAL_CONTENT_URI/);
  assert.match(activity, /AndroidBridge/);
});
