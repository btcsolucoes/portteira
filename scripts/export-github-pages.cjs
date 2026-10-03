const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createRequire } = require('node:module');
const { normalizeBasePath, preparePages } = require('./github-pages.cjs');

const appDirectory = path.resolve(__dirname, '..', 'apps', 'mobile');
const appRequire = createRequire(path.join(appDirectory, 'package.json'));
const expoCli = path.join(path.dirname(appRequire.resolve('expo/package.json')), 'bin', 'cli');
const basePath = normalizeBasePath(process.env.PORTTEIRA_BASE_PATH ?? '/portteira');
const outputDirectory = path.join(appDirectory, 'dist-pages');

const result = spawnSync(
  process.execPath,
  [expoCli, 'export', '--platform', 'web', '--output-dir', outputDirectory],
  {
    cwd: appDirectory,
    stdio: 'inherit',
    env: { ...process.env, PORTTEIRA_BASE_PATH: basePath },
  },
);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

preparePages(outputDirectory, basePath);
console.log(`GitHub Pages export ready at apps/mobile/dist-pages (base path: ${basePath || '/'}).`);
