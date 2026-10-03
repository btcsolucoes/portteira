// Compatibility bridge for query-string 7's CJS import and the security-fixed ESM decoder.
// Remove together with the scoped override when Expo Router adopts a compatible release.
const fs = require('node:fs');
const path = require('node:path');
const mobile = path.join(__dirname, '..', 'apps', 'mobile');
const target = require.resolve('query-string', { paths: [mobile] });
const metadata = JSON.parse(
  fs.readFileSync(path.join(path.dirname(target), 'package.json'), 'utf8'),
);
if (metadata.version !== '7.1.3') {
  throw new Error(`Review query-string compatibility patch for version ${metadata.version}`);
}
const original = "const decodeComponent = require('decode-uri-component');";
const replacement =
  "const decoder = require('decode-uri-component');\nconst decodeComponent = decoder.default ?? decoder;";
const source = fs.readFileSync(target, 'utf8');
if (source.includes(replacement)) {
  console.log('query-string compatibility patch already applied.');
} else if (source.includes(original)) {
  fs.writeFileSync(target, source.replace(original, replacement));
  console.log('Applied query-string compatibility patch for decode-uri-component 0.5.0.');
} else {
  throw new Error('Unexpected query-string source; review the patch before continuing.');
}
