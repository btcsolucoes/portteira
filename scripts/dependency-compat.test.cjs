const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const appRequire = createRequire(path.join(__dirname, '..', 'apps', 'mobile', 'package.json'));
const query = appRequire('query-string');

test('router query parsing keeps accents, arrays, null values and round trips', () => {
  assert.deepEqual(
    { ...query.parse('nome=%C3%89gua+%C3%81rabe&ra%C3%A7a=arabe') },
    { nome: 'Égua Árabe', raça: 'arabe' },
  );
  assert.deepEqual(
    { ...query.parse('tag=event&tag=listing&empty=&flag') },
    { tag: ['event', 'listing'], empty: '', flag: null },
  );
  const data = { name: 'Sol & Lua', registry: 'DEMO 123' };
  assert.deepEqual({ ...query.parse(query.stringify(data)) }, data);
});

test('malformed percent sequences use the patched decoder without throwing', () => {
  assert.doesNotThrow(() => query.parse('q=%FE%FF%FA%FA%ZZ'));
  assert.doesNotThrow(() => query.parse(`q=${'%FE'.repeat(10000)}`));
  const queryRequire = createRequire(appRequire.resolve('query-string'));
  const decoderPath = queryRequire.resolve('decode-uri-component');
  const decoder = JSON.parse(
    fs.readFileSync(path.join(path.dirname(decoderPath), 'package.json'), 'utf8'),
  );
  assert.equal(decoder.version, '0.5.0');
});

test('xcode generates unique build identifiers using the corrected uuid version', () => {
  const project = appRequire('xcode').project('unused-fixture.pbxproj');
  project.hash = { project: { objects: {} } };
  const identifiers = Array.from({ length: 100 }, () => project.generateUuid());
  assert.equal(new Set(identifiers).size, 100);
  assert.ok(identifiers.every((id) => /^[A-F0-9]{24}$/.test(id)));
  const xcodeRequire = createRequire(appRequire.resolve('xcode'));
  const uuidPath = xcodeRequire.resolve('uuid/package.json');
  assert.equal(JSON.parse(fs.readFileSync(uuidPath, 'utf8')).version, '11.1.1');
});
