const fs = require('node:fs');
const path = require('node:path');

const STATIC_ROUTES = [
  'marketplace',
  'marketplace/create',
  'favorites',
  'my-listings',
  'preferences',
];

function normalizeBasePath(value) {
  const basePath = value.replace(/\/$/, '');
  if (basePath && !/^\/[a-zA-Z0-9_-][a-zA-Z0-9._-]*$/.test(basePath)) {
    throw new Error('Use an empty path for a root site or a repository path such as /portteira.');
  }
  return basePath;
}

function preparePages(outputDirectory, basePath) {
  const normalizedPath = normalizeBasePath(basePath);
  const indexPath = path.join(outputDirectory, 'index.html');
  const html = fs
    .readFileSync(indexPath, 'utf8')
    .replace('<html lang="en">', '<html lang="pt-BR">')
    .replace(
      'You need to enable JavaScript to run this app.',
      'Ative o JavaScript no navegador para abrir o Portteira.',
    );
  const assetUrls = Array.from(html.matchAll(/(?:src|href)="([^"]+)"/g), (match) => match[1]);
  if (!assetUrls.some((url) => url.startsWith(`${normalizedPath}/_expo/`))) {
    throw new Error(
      'Expo export has no bundle matching the Pages base path. Rebuild before deploy.',
    );
  }
  for (const url of assetUrls) {
    if (url.startsWith('/') && !url.startsWith('//') && !url.startsWith(`${normalizedPath}/`)) {
      throw new Error(`Exported asset does not use the Pages base path: ${url}`);
    }
  }

  // Pages has no SPA rewrites. The custom 404 bootstraps the router at the
  // original URL, including listing IDs that only exist in browser storage.
  fs.writeFileSync(indexPath, html);
  fs.writeFileSync(path.join(outputDirectory, '404.html'), html);
  fs.writeFileSync(path.join(outputDirectory, '.nojekyll'), '');
  for (const route of STATIC_ROUTES) {
    const directory = path.join(outputDirectory, route);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'index.html'), html);
  }
}

module.exports = { normalizeBasePath, preparePages, STATIC_ROUTES };
