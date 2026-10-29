import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, readdir, stat, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, sep, extname, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';
import { pages, aliases } from '../src/app/routes.js';
import { deployedPath, normalizeBase } from '../src/lib/routing.js';
import { buildPages } from './build-pages.mjs';

// A directory-index static server, deliberately without Vite/SPA fallback.
export async function verifyPages({ outDir = resolve('dist'), base = '/' } = {}) {
  base = normalizeBase(base);
  const directory = resolve(outDir);
  const notFound = await readFile(join(directory, '404.html'));
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.pdf': 'application/pdf' };
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://localhost');
      if (base !== '/' && url.pathname === base.slice(0, -1)) {
        response.writeHead(301, { Location: `${base}${url.search}` }); response.end(); return;
      }
      if (!url.pathname.startsWith(base)) throw new Error('Outside base');
      const relative = decodeURIComponent(url.pathname.slice(base.length));
      let file = resolve(directory, relative);
      if (file !== directory && !file.startsWith(`${directory}${sep}`)) throw new Error('Outside root');
      if ((await stat(file)).isDirectory()) {
        if (!url.pathname.endsWith('/')) {
          response.writeHead(301, { Location: `${url.pathname}/${url.search}` }); response.end(); return;
        }
        file = join(file, 'index.html');
      }
      const body = await readFile(file);
      response.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
      response.end(body);
    } catch {
      response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }); response.end(notFound);
    }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    if (base !== '/') {
      const mount = await fetch(`${origin}${base.slice(0, -1)}`, { redirect: 'manual' });
      assert.equal(mount.status, 301);
      assert.equal(mount.headers.get('location'), base);
    }
    const checked = new Set();
    async function inspectReferences(html) {
      for (const [, attribute] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
        // React escapes attribute punctuation; browsers decode it before fetching.
        const value = attribute.replace(/&#x([0-9a-f]+);|&#([0-9]+);|&(amp|quot|apos|lt|gt);/gi, (_, hex, decimal, named) =>
          hex ? String.fromCodePoint(parseInt(hex, 16)) : decimal ? String.fromCodePoint(Number(decimal)) :
            ({ amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' })[named.toLowerCase()]);
        assert(!value.startsWith('#/'), `Old hash link: ${value}`);
        if (/^(?:https?:|mailto:|tel:|#)/.test(value)) continue;
        assert(value.startsWith(base), `Reference outside base ${base}: ${value}`);
        const url = new URL(value, origin);
        if (checked.has(url.href)) continue;
        checked.add(url.href);
        const response = await fetch(url);
        assert.equal(response.status, 200, `Broken reference: ${value}`);
        if (/\.(?:js|css)$/.test(url.pathname)) {
          assert(!response.headers.get('content-type').includes('text/html'), `HTML returned for asset: ${value}`);
        }
      }
    }
    for (const page of pages) {
      const path = deployedPath(page.path, base);
      for (let repeat = 0; repeat < 2; repeat++) {
        const response = await fetch(`${origin}${path}`);
        assert.equal(response.status, 200, path);
        const html = await response.text();
        assert.match(html, /<div id="root"><[^>]+/);
        assert.match(html, /<h1(?:\s[^>]*)?>/);
        assert(!html.includes('<h1>페이지를 찾을 수 없습니다.</h1>'), path);
        assert(html.includes(`<title>${page.title} | `), path);
        await inspectReferences(html);
      }
      if (page.path !== '/') {
        const response = await fetch(`${origin}${path.slice(0, -1)}?check=refresh`, { redirect: 'manual' });
        assert.equal(response.status, 301, path);
        assert.equal(response.headers.get('location'), `${path}?check=refresh`);
      }
    }
    for (const alias of aliases) {
      const response = await fetch(`${origin}${deployedPath(alias.path, base)}`);
      assert.equal(response.status, 200);
      const html = await response.text();
      assert(html.includes(`location.replace(${JSON.stringify(deployedPath(alias.target, base))}+location.search+location.hash)`));
      assert(html.includes('http-equiv="refresh"'));
      await inspectReferences(html);
    }
    const missing = await fetch(`${origin}${deployedPath('/missing-page/', base)}`);
    assert.equal(missing.status, 404);
    const missingHtml = await missing.text();
    assert(missingHtml.includes('<h1>페이지를 찾을 수 없습니다.</h1>'));
    await inspectReferences(missingHtml);
    // Also fetch lazy chunks: the Home WebGL scene is loaded only after hydration.
    for (const file of await readdir(join(directory, 'assets'))) {
      if (!/\.(?:js|css)$/.test(file)) continue;
      const value = `${base}assets/${file}`;
      const response = await fetch(`${origin}${value}`);
      assert.equal(response.status, 200, `Broken lazy asset: ${value}`);
      assert(!response.headers.get('content-type')?.includes('text/html'), value);
      checked.add(`${origin}${value}`);
    }
    console.log(`Static HTTP checks passed: ${pages.length} pages, alias, redirects, 404, ${checked.size} references (base: ${base})`);
  } finally {
    server.closeAllConnections();
    await new Promise((done) => server.close(done));
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const projectDirectory = await mkdtemp(join(tmpdir(), 'mlb-pages-check-'));
  try {
    await verifyPages({ base: process.env.VITE_BASE_PATH || '/' });
    await buildPages({ base: '/lab-preview/', outDir: projectDirectory, logLevel: 'error' });
    await verifyPages({ base: '/lab-preview/', outDir: projectDirectory });
  } catch (error) { console.error(error); process.exitCode = 1; }
  finally {
    if (dirname(projectDirectory) === resolve(tmpdir()) && basename(projectDirectory).startsWith('mlb-pages-check-')) {
      await rm(projectDirectory, { recursive: true, force: true });
    }
  }
}
