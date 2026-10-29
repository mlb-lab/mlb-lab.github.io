import { aliases, findPage, normalizePath } from '../app/routes.js';

export function normalizeBase(base = '/') {
  if (!/^\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]*$/.test(base)) {
    throw new Error('VITE_BASE_PATH must be / or an absolute directory path such as /repository/.');
  }
  return base === '/' ? '/' : `${base.replace(/\/+$/, '')}/`;
}

export function routerBasename(base) {
  // Keep the trailing slash so Router links to Home also use the directory URL.
  return normalizeBase(base);
}

export function deployedPath(path, base) {
  return `${normalizeBase(base)}${path.replace(/^\//, '')}`;
}

// Only migrate known old router hashes. Ordinary anchors and unknown hashes stay intact.
export function legacyHashUrl(location, base) {
  if (!location.hash.startsWith('#/') || location.hash.startsWith('#//')) return null;
  const legacy = new URL(location.hash.slice(1), location.origin);
  if (legacy.origin !== location.origin) return null;
  const page = findPage(legacy.pathname);
  const alias = aliases.find((item) => normalizePath(item.path) === normalizePath(legacy.pathname));
  const target = page?.path || alias?.target;
  if (!target) return null;
  const search = new URLSearchParams(location.search);
  for (const [key, value] of legacy.searchParams) search.append(key, value);
  const query = search.toString();
  return `${deployedPath(target, base)}${query ? `?${query}` : ''}${legacy.hash}`;
}
