import test from 'node:test';
import assert from 'node:assert/strict';
import { findPage, pagePath, pageTitle } from '../src/app/routes.js';
import { normalizeBase, routerBasename, deployedPath, legacyHashUrl } from '../src/lib/routing.js';

test('base and basename agree for Organization and project sites', () => {
  assert.equal(normalizeBase('/'), '/');
  assert.equal(normalizeBase('/lab-preview'), '/lab-preview/');
  assert.equal(routerBasename('/lab-preview/'), '/lab-preview/');
  assert.equal(routerBasename('/'), '/');
  assert.equal(deployedPath('/people/members/', '/lab-preview/'), '/lab-preview/people/members/');
  for (const invalid of ['.', './', '//', 'https://example.org/', '/lab/../', '/lab?query=1']) assert.throws(() => normalizeBase(invalid));
});

test('page metadata tolerates either trailing-slash form', () => {
  assert.equal(findPage('/news').id, 'news');
  assert.equal(findPage('/news/').id, 'news');
  assert.equal(pagePath('members'), '/people/members/');
  assert.equal(pageTitle('/news/', 'MLB Lab'), 'News | MLB Lab');
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
