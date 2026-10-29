import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'vite';
import { aliases, pages } from '../src/app/routes.js';
import { deployedPath, normalizeBase } from '../src/lib/routing.js';
import { loadContent, validateContent } from './validate-content.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const escapeHtml = (text) => text.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

export async function buildPages({ base = process.env.VITE_BASE_PATH || '/', outDir = join(root, 'dist'), logLevel = 'info' } = {}) {
  base = normalizeBase(base);
  const errors = validateContent(loadContent());
  if (errors.length) throw new Error(errors.join('\n'));
  const serverDir = await mkdtemp(join(root, '.prerender-'));
  try {
    await build({ root, base, logLevel, build: { outDir } });
    await build({ root, base, logLevel, build: {
      ssr: 'src/entry-server.jsx', outDir: serverDir, emptyOutDir: false,
      rolldownOptions: { output: { entryFileNames: 'entry-server.mjs' } },
    } });
    const { render } = await import(pathToFileURL(join(serverDir, 'entry-server.mjs')).href);
    const template = await readFile(join(outDir, 'index.html'), 'utf8');
    if (!template.includes('<div id="root"></div>')) throw new Error('Static build requires an empty #root in index.html.');
    function htmlFor(path) {
      const { title, body } = render(path);
      return template.replace(/<title>[^<]*<\/title>/, () => `<title>${escapeHtml(title)}</title>`)
        .replace('<div id="root"></div>', () => `<div id="root">${body}</div>`);
    }
    async function writeRoute(path, html) {
      const file = join(outDir, path.replace(/^\//, ''), 'index.html');
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, html);
    }
    for (const page of pages) await writeRoute(page.path, htmlFor(page.path));
    for (const alias of aliases) {
      const target = deployedPath(alias.target, base);
      const redirect = `<script>location.replace(${JSON.stringify(target)}+location.search+location.hash)</script>`
        + `<noscript><meta http-equiv="refresh" content="0;url=${escapeHtml(target)}"></noscript>`;
      // No app hydration on the alias: Navigate only runs in the client router.
      const html = htmlFor(alias.target).replace(/<script\b[^>]*type="module"[^>]*>[\s\S]*?<\/script>/g, '')
        .replace('</head>', () => `${redirect}</head>`);
      await writeRoute(alias.path, html);
    }
    await writeFile(join(outDir, '404.html'), htmlFor('/__not-found__/'));
    console.log(`Generated ${pages.length} pages, ${aliases.length} alias and 404.html (base: ${base})`);
  } finally {
    // Only remove the temporary directory created above, never user source or output.
    if (dirname(serverDir) === root && basename(serverDir).startsWith('.prerender-')) {
      await rm(serverDir, { recursive: true, force: true });
    }
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildPages().catch((error) => { console.error(error); process.exitCode = 1; });
}
