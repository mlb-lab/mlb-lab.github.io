import test from 'node:test';
import assert from 'node:assert/strict';
import { pages, findPage, pagePath, pageTitle, pageDescription, pageCanonical } from '../src/app/routes.js';
import { normalizeBase, routerBasename, deployedPath, legacyHashUrl } from '../src/lib/routing.js';

test('base and basename agree for Organization and project sites', () => {
  assert.equal(normalizeBase('/'), '/');
  assert.equal(normalizeBase('/lab-preview'), '/lab-preview/');
  assert.equal(routerBasename('/lab-preview/'), '/lab-preview/');
  assert.equal(routerBasename('/'), '/');
  assert.equal(deployedPath('/people/members/', '/lab-preview/'), '/lab-preview/people/members/');
  for (const invalid of ['.', './', '//', 'https://example.org/', '/lab/../', '/lab?query=1']) assert.throws(() => normalizeBase(invalid));
});

test('all page SEO titles and descriptions tolerate either trailing-slash form', () => {
  assert.equal(findPage('/news').id, 'news');
  assert.equal(findPage('/news/').id, 'news');
  assert.equal(pagePath('members'), '/people/members/');
  const expectedTitles = [
    ['/', 'MLB Lab | Prof. Giltae Song | Machine Learning & Bioinformatics'],
    ['/people/professor/', 'Prof. Giltae Song | MLB Lab'],
    ['/people/members/', 'Members | MLB Lab | Prof. Giltae Song'],
    ['/people/alumni/', 'Alumni | MLB Lab | Prof. Giltae Song'],
    ['/research/', 'Research | MLB Lab | Prof. Giltae Song'],
    ['/publications/', 'Publications | MLB Lab | Prof. Giltae Song'],
    ['/news/', 'News | MLB Lab | Prof. Giltae Song'],
    ['/contact/', 'Contact | MLB Lab | Prof. Giltae Song'],
  ];
  assert.deepEqual(expectedTitles.map(([path]) => path), pages.map((page) => page.path));
  const descriptions = [];
  for (const [path, title] of expectedTitles) {
    const withoutTrailingSlash = path === '/' ? '/' : path.slice(0, -1);
    assert.equal(pageTitle(path), title, path);
    assert.equal(pageTitle(withoutTrailingSlash), title, withoutTrailingSlash);
    const description = pageDescription(path);
    assert.equal(typeof description, 'string', path);
    assert(description.trim(), `Missing description: ${path}`);
    assert.equal(pageDescription(withoutTrailingSlash), description, withoutTrailingSlash);
    descriptions.push(description);
  }
  assert.equal(new Set(descriptions).size, expectedTitles.length, 'Each page has its own description');
});

test('unknown pages retain the not-found title and Home description fallback', () => {
  for (const path of ['/missing-page', '/missing-page/', '/__not-found__/', '/people/missing/']) {
    assert.equal(findPage(path), undefined, path);
    assert.equal(pageTitle(path), 'Page not found | MLB Lab', path);
    assert.equal(pageDescription(path), pageDescription('/'), path);
  }
});

test('all canonical URLs use unique production paths and omit queries and fragments', () => {
  const expectedCanonical = [
    ['/', 'https://mlb-lab.github.io/'],
    ['/people/professor/', 'https://mlb-lab.github.io/people/professor/'],
    ['/people/members/', 'https://mlb-lab.github.io/people/members/'],
    ['/people/alumni/', 'https://mlb-lab.github.io/people/alumni/'],
    ['/research/', 'https://mlb-lab.github.io/research/'],
    ['/publications/', 'https://mlb-lab.github.io/publications/'],
    ['/news/', 'https://mlb-lab.github.io/news/'],
    ['/contact/', 'https://mlb-lab.github.io/contact/'],
  ];
  assert.deepEqual(expectedCanonical.map(([path]) => path), pages.map((page) => page.path));
  const canonicalUrls = [];
  for (const [path, canonical] of expectedCanonical) {
    const withoutTrailingSlash = path === '/' ? '/' : path.slice(0, -1);
    assert.equal(pageCanonical(path), canonical, path);
    assert.equal(pageCanonical(withoutTrailingSlash), canonical, withoutTrailingSlash);
    assert.equal(pageCanonical(`${path}?source=test#section`), canonical, path);
    canonicalUrls.push(pageCanonical(path));
  }
  assert.equal(new Set(canonicalUrls).size, expectedCanonical.length);
});

test('People aliases use the Professor canonical and unknown pages have none', () => {
  for (const path of ['/people', '/people/', '/people/?source=menu#section']) {
    assert.equal(pageCanonical(path), 'https://mlb-lab.github.io/people/professor/', path);
  }
  for (const path of ['/missing-page', '/missing-page/', '/__not-found__/', '/people/missing/', '/missing-page/?source=test#section']) {
    assert.equal(pageCanonical(path), null, path);
  }
});

test('old hash URLs migrate to clean paths and preserve both query strings', () => {
  const target = legacyHashUrl(new URL('https://mlb-lab.github.io/?source=old#/news?tag=lab#section'), '/');
  assert.equal(target, '/news/?source=old&tag=lab#section');
  assert.equal(legacyHashUrl(new URL('https://example.org/lab-preview/#/people/members'), '/lab-preview/'), '/lab-preview/people/members/');
  assert.equal(legacyHashUrl(new URL('https://example.org/#/people?source=old'), '/'), '/people/professor/?source=old');
  assert.equal(legacyHashUrl(new URL('https://example.org/#/'), '/'), '/');
});

test('ordinary anchors, unknown hashes and external-looking hashes are not redirected', () => {
  for (const hash of ['#main-content', '#/missing', '#//elsewhere.org/news', '#/\\elsewhere.org/news']) {
    assert.equal(legacyHashUrl(new URL(`https://example.org/${hash}`), '/'), null, hash);
  }
});
