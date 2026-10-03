const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { normalizeBasePath, preparePages, STATIC_ROUTES } = require('./github-pages.cjs');

test('Pages paths support repository and custom-domain hosting without accepting external URLs', () => {
  assert.equal(normalizeBasePath('/portteira/'), '/portteira');
  assert.equal(normalizeBasePath(''), '');
  assert.equal(normalizeBasePath('/'), '');
  for (const invalid of ['https://example.com', '//example.com', '/../', '/repo?x', '/a/b']) {
    assert.throws(() => normalizeBasePath(invalid));
  }
});

test('Pages bootstraps fixed routes and unknown local listing IDs with the same subpath bundle', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'portteira-pages-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const html = '<html><script src="/portteira/_expo/static/js/web/app.js"></script></html>';
  fs.writeFileSync(path.join(directory, 'index.html'), html);
  preparePages(directory, '/portteira');
  assert.equal(fs.readFileSync(path.join(directory, '404.html'), 'utf8'), html);
  assert.ok(fs.existsSync(path.join(directory, '.nojekyll')));
  for (const route of STATIC_ROUTES) {
    assert.equal(fs.readFileSync(path.join(directory, route, 'index.html'), 'utf8'), html);
  }
});

test('Pages rejects a root build or an asset whose prefix would break on the published subpath', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'portteira-pages-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.writeFileSync(path.join(directory, 'index.html'), '<script src="/_expo/app.js"></script>');
  assert.throws(() => preparePages(directory, '/portteira'), /base path/);
  fs.writeFileSync(
    path.join(directory, 'index.html'),
    '<script src="/portteira/_expo/app.js"></script><link href="/favicon.png">',
  );
  assert.throws(() => preparePages(directory, '/portteira'), /base path/);
});

test('Pages root-domain exports keep root assets usable for direct navigation', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'portteira-pages-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.writeFileSync(path.join(directory, 'index.html'), '<script src="/_expo/app.js"></script>');
  assert.doesNotThrow(() => preparePages(directory, ''));
});
