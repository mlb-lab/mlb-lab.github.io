import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContent, validateContent } from '../scripts/validate-content.mjs';
import { assetUrl, byDisplayOrder, groupPublications, sortNews } from '../src/lib/content.js';

const content = loadContent();
const validate = (change, options) => {
  const data = structuredClone(content);
  change(data);
  return validateContent(data, options);
};

test('current JSON files satisfy the content contract', () => {
  assert.deepEqual(validateContent(content), []);
});

test('Production content has no sample flags and retired fields are rejected', () => {
  function inspect(value) {
    if (Array.isArray(value)) return value.forEach(inspect);
    if (!value || typeof value !== 'object') return;
    for (const [key, item] of Object.entries(value)) {
      assert(!['isExample', 'isSample', 'is_sample'].includes(key));
      inspect(item);
    }
  }
  inspect(content);
  assert(!('notice' in content.site));
  assert(validate((data) => { data.news[0].isExample = true; }).some((error) => error.includes('.isExample')));
});

test('Home About validates keywords and navigation destinations', () => {
  assert(validate((data) => { data.home.researchKeywords = ['']; }).some((error) => error.includes('.researchKeywords')));
  assert(validate((data) => { data.home.quickLinks[0].pageId = 'unknown'; }).some((error) => error.includes('.quickLinks[0].pageId')));
});

test('Genomic Hero requires two heading lines and valid text copy', () => {
  assert(validate((data) => { data.home.hero.headlineLines = ['Only one']; }).some((error) => error.includes('.hero.headlineLines')));
  assert(validate((data) => { data.home.hero.label = ''; }).some((error) => error.includes('.hero.label')));
});

test('Footer validates its local logo', () => {
  assert(validate((data) => { data.site.footer.logo.src = 'images/missing-footer-logo.png'; }).some((error) => error.includes('.footer.logo.src')));
});

test('empty people collections and a null professor are supported', () => {
  assert.deepEqual(validate((data) => {
    data.professor = null;
    for (const key of ['members', 'alumni', 'research', 'publications', 'news']) data[key] = [];
  }), []);
});

test('missing required fields, wrong types and unknown keys are rejected', () => {
  const errors = validate((data) => {
    delete data.news[0].body;
    data.contact.addressLines = 'address';
    data.members[0].emial = 'typo@example.org';
  });
  assert(errors.some((e) => e.includes('news.json[0].body')));
  assert(errors.some((e) => e.includes('contact.json.addressLines')));
  assert(errors.some((e) => e.includes('.emial')));
});

test('duplicate IDs are rejected within a collection', () => {
  assert(validate((data) => data.news.push(structuredClone(data.news[0]))).some((e) => e.includes('중복 ID')));
});

test('Members and Alumni education accept strings and null and reject old objects and invalid types', () => {
  for (const collection of ['members', 'alumni']) {
    assert.deepEqual(validate((data) => {
      data[collection][0].education = { bs: 'University, Department, 2020', ms: 'Graduate school, 2022', phd: null };
    }), []);
    assert.deepEqual(validate((data) => { data[collection][0].education = { bs: null }; }), []);
    for (const bs of [{ institution: 'University' }, '', '   ', 2020, []]) {
      assert(validate((data) => { data[collection][0].education = { bs }; }).some((error) => error.includes(`${collection}.json[0].education.bs`)));
    }
  }
});

test('Members photo framing accepts supported positions and rejects invalid values', () => {
  for (const objectPosition of ['50% 20%', 'center top', '100% 0%', 'left center']) {
    assert.deepEqual(validate((data) => { data.members[0].photo.objectPosition = objectPosition; }), []);
  }
  for (const objectPosition of ['50%', '101% 20%', '-10% 20%', 'center middle', 'url(https://example.org)']) {
    assert(validate((data) => { data.members[0].photo.objectPosition = objectPosition; }).some((error) => error.includes('.objectPosition')));
  }
});

test('ISO dates reject impossible dates and timestamps; leap days work', () => {
  for (const date of ['2026-02-29', '2026-04-31', '2026-13-01', '2026-1-02', '2026-01-01T12:00:00Z']) {
    assert(validate((data) => { data.news[0].date = date; }).some((e) => e.includes('.date')), date);
  }
  assert.deepEqual(validate((data) => { data.news[0].date = '2024-02-29'; }), []);
});

test('links and email addresses are validated', () => {
  for (const url of ['javascript:alert(1)', '/relative', 'https://user:password@example.org']) {
    assert(validate((data) => { data.contact.mapUrl = url; }).some((e) => e.includes('mapUrl')));
  }
  assert(validate((data) => { data.professor.email = 'invalid'; }).some((e) => e.includes('.email')));
  assert(validate((data) => { data.publications[0].url = 'javascript:alert(1)'; }).some((e) => e.includes('publications.json[0].url')));
  assert.deepEqual(validate((data) => {
    data.professor.email = 'example@example.org';
    data.contact.mapUrl = 'https://example.org/map';
    data.publications[0].url = 'https://example.org/paper';
  }), []);
});

test('missing local assets, traversal and absolute paths are rejected', () => {
  for (const src of ['images/missing.jpg', 'images/../secret.jpg', '/images/portrait.jpg', 'images\\portrait.jpg']) {
    assert(validate((data) => { data.members[0].photo = { src, alt: 'Example' }; }).some((e) => e.includes('.photo.src')), src);
  }
  assert.deepEqual(validate((data) => {
    data.members[0].photo = { src: 'images/portrait.webp', alt: 'Example' };
  }, { fileExists: () => true }), []);
});

test('news galleries require image objects and image alternative text', () => {
  assert.deepEqual(validate((data) => { data.news[0].body = []; }), []);
  assert(validate((data) => { data.news[0].images = [null]; }).some((e) => e.includes('.images[0]')));
  assert(validate((data) => { data.news[0].images = [{ src: null, alt: '' }]; }).some((e) => e.includes('.alt')));
});

test('News accepts rich paragraphs and rejects unsafe links or unsupported markup fields', () => {
  assert.deepEqual(validate((data) => { data.news[0].body = ['Plain', [{ text: 'Paper', italic: true, underline: true, bold: true, superscript: true, href: 'https://example.org/paper' }]]; }), []);
  for (const run of [{ text: 'X', href: 'javascript:alert(1)' }, { text: 'X', italic: 'true' }, { text: 'X', html: '<em>X</em>' }]) {
    assert(validate((data) => { data.news[0].body = [[run]]; }).some((error) => error.includes('.body[0]')));
  }
});

test('Unicode asset names and spaces are accepted without allowing reserved characters or traversal', () => {
  assert.deepEqual(validate((data) => {
    data.news[0].images = [{ src: "images/news/Professor's visit (Texas A&M, 2024.03.21), photo 2.jpg", alt: 'Visit photo' }];
  }, { fileExists: () => true }), []);
  assert.deepEqual(validate((data) => {
    data.members[0].photo = { src: 'images/프로필/연구원 사진.webp', alt: '예시 사진' };
  }, { fileExists: () => true }), []);
  for (const src of ['images/../비공개.png', 'images/./사진.png', 'images//사진.png', 'images/%2e%2e/사진.png', 'images/사진.png?q=1', 'images/사진#1.png', 'images/사진:1.png', 'images/사진\\1.png', 'images/사진*.png', 'images/사진\n1.png', 'images/ 사진.png', 'images/사진.png ', 'images/하위./사진.png']) {
    const errors = validate((data) => { data.members[0].photo = { src, alt: '예시 사진' }; }, { fileExists: () => true });
    assert(errors.some((error) => error.includes('.photo.src')), src);
  }
});

test('ordering is deterministic and never mutates imported content', () => {
  const rows = [{ id: 'b', displayOrder: 2, year: 2025, date: '2025-01-01' }, { id: 'a', displayOrder: 1, year: 2026, date: '2026-01-01' }];
  const original = structuredClone(rows);
  assert.deepEqual(byDisplayOrder(rows).map((item) => item.id), ['a', 'b']);
  assert.deepEqual(groupPublications(rows).map((group) => group.year), [2026, 2025]);
  assert.deepEqual(sortNews(rows).map((item) => item.id), ['a', 'b']);
  assert.deepEqual(rows, original);
});

test('publications sort years and displayOrder descending without changing other collections or source data', () => {
  const rows = [
    { id: 'one', year: 2026, displayOrder: 1 },
    { id: 'two', year: 2026, displayOrder: 2 },
    { id: 'three', year: 2026, displayOrder: 3 },
    { id: 'four', year: 2026, displayOrder: 4 },
    { id: 'five', year: 2026, displayOrder: 5 },
    { id: 'older', year: 2025, displayOrder: 99 },
    { id: 'c', year: 2025 },
    { id: 'b', year: 2025, displayOrder: null },
    { id: 'a', year: 2025, displayOrder: 0 },
  ];
  const original = structuredClone(rows);
  rows.forEach(Object.freeze);
  Object.freeze(rows);

  const groups = groupPublications(rows);
  assert.deepEqual(groups.map((group) => group.year), [2026, 2025]);
  assert.deepEqual(groups[0].items.map((item) => item.displayOrder), [5, 4, 3, 2, 1]);
  assert.deepEqual(groups[1].items.map((item) => item.id), ['older', 'a', 'b', 'c']);
  assert.deepEqual(byDisplayOrder(rows.filter((item) => item.year === 2026)).map((item) => item.displayOrder), [1, 2, 3, 4, 5]);
  assert.deepEqual(rows, original);
});

test('publication runs accept supported boolean marks and separator spaces only', () => {
  assert.deepEqual(validate((data) => {
    data.publications[0].authors = [{ text: 'A†', bold: true, underline: true }, { text: 'B*†', italic: false }];
    data['publications-note'] = [];
  }), []);
  for (const title of ['plain string', [], [{ text: '' }], [{ text: ' ' }], [{ text: 'Title', bold: 'true' }], [{ text: 'Title', html: '<b>Title</b>' }]]) {
    assert(validate((data) => { data.publications[0].title = title; }).some((error) => error.includes('publications.json[0].title')));
  }
  for (const text of [', ', '.', ' ', '*', '†']) {
    assert(validate((data) => { data.publications[0].authors = [{ text }]; }).some((error) => error.includes('.authors[0].text')));
  }
});

test('professor experience dates and contact use validated formats', () => {
  assert(validate((data) => { data.professor.experience[0].startDate = '2012-13'; }).some((error) => error.includes('.startDate')));
  assert(validate((data) => { data.professor.experience[0].endDate = '2011-01'; }).some((error) => error.includes('시작 연월')));
  assert(validate((data) => { data.professor.contact.phone = 'not-a-phone'; }).some((error) => error.includes('.phone')));
  assert(validate((data) => { data.professor.education.phd.advisor = ''; }).some((error) => error.includes('.advisor')));
});

test('asset URLs support root and project-site base paths', () => {
  assert.equal(assetUrl('images/example.jpg', '/'), '/images/example.jpg');
  assert.equal(assetUrl('images/example.jpg', '/lab/'), '/lab/images/example.jpg');
  assert.equal(assetUrl(null, '/'), null);
});
