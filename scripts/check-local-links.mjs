import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.cwd());
const siteBase = new URL('https://portfolio.local/');
const html = await readFile(path.join(root, 'index.html'), 'utf8');
const startTagPattern = /<[a-z][^>"']*(?:(?:"[^"]*"|'[^']*')[^>"']*)*>/gi;
const attributePattern =
  /\s+([^\s"'=<>`]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
const localReferenceAttributes = new Set(['href', 'src']);
const localPaths = new Map();
const invalidReferences = [];

function describeCount(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

for (const tagMatch of html.matchAll(startTagPattern)) {
  for (const attributeMatch of tagMatch[0].matchAll(attributePattern)) {
    const [, attributeName, doubleQuotedValue, singleQuotedValue, unquotedValue] =
      attributeMatch;

    if (!localReferenceAttributes.has(attributeName.toLowerCase())) {
      continue;
    }

    const value = doubleQuotedValue ?? singleQuotedValue ?? unquotedValue;

    if (!value || value.startsWith('#')) {
      continue;
    }

    let reference;
    try {
      reference = new URL(value, siteBase);
    } catch {
      invalidReferences.push({ value, diagnostic: 'invalid URL' });
      continue;
    }

    if (reference.origin !== siteBase.origin) {
      continue;
    }

    let decodedPathname;
    try {
      decodedPathname = decodeURIComponent(reference.pathname);
    } catch {
      invalidReferences.push({ value, diagnostic: 'malformed percent-encoding' });
      continue;
    }

    const sitePath = decodedPathname.replace(/^\/+/, '');
    const resolvedPath = path.resolve(root, sitePath);
    const relativePath = path.relative(root, resolvedPath);
    const isWithinRoot =
      relativePath === '' ||
      (relativePath !== '..' &&
        !relativePath.startsWith(`..${path.sep}`) &&
        !path.isAbsolute(relativePath));

    if (!isWithinRoot) {
      invalidReferences.push({ value, diagnostic: 'resolves outside site root' });
      continue;
    }

    if (!localPaths.has(resolvedPath)) {
      localPaths.set(resolvedPath, sitePath || '.');
    }
  }
}

const missing = [];

for (const [resolvedPath, localPath] of localPaths) {
  try {
    await access(resolvedPath);
  } catch {
    missing.push(localPath);
  }
}

if (invalidReferences.length > 0) {
  console.error('Invalid local references:');
  for (const { value, diagnostic } of invalidReferences) {
    console.error(`- ${value}: ${diagnostic}`);
  }
}

if (missing.length > 0) {
  console.error('Missing local assets:');
  for (const localPath of missing) {
    console.error(`- ${localPath}`);
  }
}

console.log(`Checked ${describeCount(localPaths.size, 'local asset')}.`);

if (invalidReferences.length > 0 || missing.length > 0) {
  console.error(
    `Link check failed: ${describeCount(invalidReferences.length, 'invalid reference')}, ${describeCount(missing.length, 'missing local asset')}.`,
  );
  process.exitCode = 1;
}
