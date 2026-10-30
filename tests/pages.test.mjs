import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { createServer } from 'vite';
import { loadContent } from '../scripts/validate-content.mjs';

const content = loadContent();

let server;
let App;
let PersonCard;
let ImageSlot;
let ProfessorProfile;
let InlineText;
let PublicationItem;
let ContactMap;
let NewsFeed;
let NewsBody;
let Footer;
before(async () => {
  server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
  ({ default: App } = await server.ssrLoadModule('/src/app/App.jsx'));
  ({ PersonCard } = await server.ssrLoadModule('/src/components/people.jsx'));
  ({ ImageSlot } = await server.ssrLoadModule('/src/components/common.jsx'));
  ({ ProfessorProfile } = await server.ssrLoadModule('/src/pages/ProfessorPage.jsx'));
  ({ default: InlineText } = await server.ssrLoadModule('/src/components/InlineText.jsx'));
  ({ PublicationItem } = await server.ssrLoadModule('/src/pages/PublicationsPage.jsx'));
  ({ ContactMap } = await server.ssrLoadModule('/src/pages/ContactPage.jsx'));
  ({ NewsFeed, NewsBody } = await server.ssrLoadModule('/src/pages/NewsPage.jsx'));
  ({ default: Footer } = await server.ssrLoadModule('/src/components/Footer.jsx'));
});
after(async () => { await server?.close(); });

function renderPage(path) {
  return renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [path] }, createElement(App)));
}

test('all eight routes render with shared layout and no module errors', () => {
  for (const [path, title] of [['/', content.home.title], ['/people/professor', 'Professor'], ['/people/members', 'Members'], ['/people/alumni', 'Alumni'], ['/research', 'Research'], ['/publications', 'Publications'], ['/news', 'News'], ['/contact', 'Contact']]) {
    const html = renderPage(path);
    const heading = path === '/'
      ? renderToStaticMarkup(createElement('h1', { id: 'home-title', className: 'genomic-headline' }, content.home.hero.headlineLines[0], createElement('br'), createElement('em', null, content.home.hero.headlineLines[1])))
      : renderToStaticMarkup(createElement('h1', null, title));
    assert(html.includes(heading), path);
    assert(html.includes('site-header') && html.includes('site-footer'), path);
    assert(!html.includes('class="example-label"') && !html.includes('class="preview-notice"'), path);
    assert(!html.includes('페이지를 찾을 수 없습니다.'), path);
  }
});

test('Footer shares contact data, omits Links and handles missing optional details', () => {
  const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Footer)));
  for (const value of [...content.contact.addressLines, content.contact.emailDisplay, content.contact.phone, content.professor.name, content.site.footer.name]) assert(html.includes(value));
  assert(html.includes('footer-address') && html.includes('footer-contact') && !html.includes('footer-links'));
  assert(html.includes('footer-logo') && html.includes('footer-bottom'));
  assert(!html.includes('mailto:') && !html.includes('tel:'));
  const minimal = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Footer, {
    siteInfo: { ...content.site, footer: { name: 'Example Lab', affiliationLines: [] } },
    contactInfo: { addressLines: [] }, professorInfo: null,
  })));
  assert(minimal.includes('연구실 주소 등록 예정') && !minimal.includes('undefined'));
  assert(!minimal.includes('footer-professor') && !minimal.includes('footer-phone'));
});

test('unknown routes render a useful not-found page', () => {
  assert(renderPage('/missing-page').includes('페이지를 찾을 수 없습니다.'));
});

test('Home places the hero before About without preview notices or example labels', () => {
  const html = renderPage('/');
  const main = html.indexOf('<main');
  const hero = html.indexOf('class="home-hero genomic-hero"');
  const title = html.indexOf('id="home-title"');
  const introduction = html.indexOf('class="home-introduction"');
  assert(main < hero && hero < title && title < introduction);
  assert(!html.includes('class="container home-page"'));
  assert(!html.includes('class="preview-notice"') && !html.includes('class="example-label"'));
  const research = renderPage('/research/');
  assert(!research.includes('class="preview-notice"') && !research.includes('class="example-label"'));
});

test('Home About renders its headline, two paragraphs, keyword tags and English navigation', () => {
  const html = renderPage('/');
  const about = html.slice(html.indexOf('<section class="home-introduction"'), html.indexOf('<nav class="home-links"'));
  assert(about.includes(`id="about-title">${content.home.aboutHeadline}</h2>`));
  assert(about.includes(content.home.aboutLabel));
  assert.equal(content.home.introduction.length, 2);
  for (const paragraph of content.home.introduction) assert(about.includes(paragraph));
  for (const keyword of content.home.researchKeywords) assert(about.includes(`<li>${keyword}</li>`));
  assert(about.includes('href="/research/"') && about.includes('Explore Our Research'));
  const navigation = html.slice(html.indexOf('<nav class="home-links"'), html.indexOf('</nav>', html.indexOf('<nav class="home-links"')));
  for (const link of content.home.quickLinks) {
    assert(navigation.includes(`<strong>${link.title}</strong>`) && navigation.includes(link.description));
  }
  assert(navigation.includes('/people/professor/') && navigation.includes('/publications/') && navigation.includes('/news/'));
  assert.equal((navigation.match(/class="home-arrow"/g) || []).length, 3);
});

test('Genomic Hero renders reference copy and a static fallback before client WebGL initialization', () => {
  const html = renderPage('/');
  for (const text of [content.home.hero.welcome, content.home.hero.principalInvestigator]) assert(html.includes(text));
  assert(html.includes('genomic-fallback') && html.includes('data-scene-ready="false"'));
  for (const text of ['genomic-motion', 'genomic-tags', 'genomic-sub', 'Exploring intelligence in biological complexity', 'genomic-note', 'INTERACTIVE GENOMIC SPACE']) assert(!html.includes(text));
  assert(!html.includes('<iframe') && !html.includes('<canvas'));
  assert(!html.includes('hero-image') && !html.includes('IT관 사진.png'));
  assert(!html.includes('getunicorn') && !html.includes('cdn.jsdelivr.net'));
});

test('Professor displays supplied history, descending degrees, contact and photo', () => {
  const html = renderPage('/people/professor/');
  assert(html.includes('id="professor"'));
  assert(html.includes(content.professor.name) && html.includes(content.professor.affiliation));
  assert(html.includes('images/professor/교수님 사진.jpg'));
  assert(html.indexOf('>Experience</h3>') < html.indexOf('>Education</h3>'));
  assert(html.indexOf('>Education</h3>') < html.indexOf('>Contact</h3>'));
  assert(html.includes('Jul. 2012') && html.includes('Jul. 2016') && html.includes('Dr. Mike Cherry'));
  assert(html.indexOf('Ph.D.,') < html.indexOf('M.S.,') && html.indexOf('M.S.,') < html.indexOf('B.S.,'));
  assert(html.includes('Dr. Kern Koh') && html.includes('2011'));
  assert(html.includes('<h4>Email</h4><span>gsong at pusan dot ac dot kr</span>'));
  assert(html.includes('Room 620, Building 102(IT Building)') && html.includes('tel:+82515102425'));
  assert(!html.includes('학위 수여 기관 입력') && !html.includes('교수 소개를 입력'));
});

test('a minimal professor omits unavailable history and contact sections', () => {
  const html = renderToStaticMarkup(createElement(ProfessorProfile, { person: { id: 'test-professor', name: 'Example', education: {} } }));
  assert(!html.includes('professor-history') && !html.includes('mailto:') && !html.includes('tel:'));
  assert(html.includes('image-placeholder'));
});

test('nested unknown paths match the pre-rendered 404 without active-menu differences', () => {
  const notFound = renderPage('/__not-found__/');
  for (const path of ['/people/missing/', '/news/missing/', '/research/missing/']) {
    assert.equal(renderPage(path), notFound, path);
  }
});

test('navigation marks the current page and keeps disclosures hidden by default', () => {
  const html = renderPage('/people/members/');
  assert.match(html, /people-toggle active/);
  assert.match(html, /aria-current="page"[^>]*href="\/people\/members\/"/);
  assert.match(html, /id="people-navigation"[^>]*hidden=""/);
  assert.match(html, /aria-controls="site-navigation"/);
});

test('missing profile information is hidden while image placeholders remain', () => {
  const minimal = { id: 'example', name: '프로필 구성 예시', education: { bs: null, ms: null, phd: null } };
  const html = renderToStaticMarkup(createElement(PersonCard, { person: minimal, showEmail: true }));
  assert(html.includes('image-placeholder'));
  assert(!html.includes('B.S.') && !html.includes('M.S.') && !html.includes('Ph.D.'));
  assert(!html.includes('mailto:') && !html.includes('class="position"'));
});

test('available degrees and member email render, alumni email stays hidden', () => {
  const person = { id: 'example', name: '예시', email: 'example@example.org', education: { bs: '예시 기관, 학과, 연도' } };
  const member = renderToStaticMarkup(createElement(PersonCard, { person, showEmail: true, variant: 'member' }));
  const alumnus = renderToStaticMarkup(createElement(PersonCard, { person, showEmail: false, variant: 'alumni' }));
  assert(member.includes('B.S.') && member.includes('예시 기관') && member.includes('>example@example.org</span>') && !member.includes('mailto:'));
  assert(member.includes('<dl class="member-email"><dt>Email</dt><dd>'));
  const displayed = renderToStaticMarkup(createElement(PersonCard, { person: { ...person, email: 'example at example dot org' }, showEmail: true, variant: 'member' }));
  assert(!displayed.includes('mailto:') && displayed.includes('>example at example dot org</span>'));
  assert(alumnus.includes('B.S.') && alumnus.includes('예시 기관') && !alumnus.includes('mailto:'));
});

test('Members degree strings preserve text and labels, hide null degrees and escape HTML', () => {
  const person = { id: 'example', name: '예시', education: { bs: 'University & Department, 2020', ms: null, phd: '<script>text</script>' } };
  const html = renderToStaticMarkup(createElement(PersonCard, { person }));
  assert(html.includes('<dt>B.S.</dt><dd>University &amp; Department, 2020</dd>'));
  assert(html.includes('<dt>Ph.D.</dt><dd>&lt;script&gt;text&lt;/script&gt;</dd>'));
  assert(!html.includes('M.S.') && !html.includes('<script>'));
});

test('Members and Alumni share card framing while Professor stays independent', () => {
  const members = renderPage('/people/members/');
  assert(members.includes('class="people-grid members-grid"'));
  assert(members.includes('object-position:50% 20%'));
  const alumni = renderPage('/people/alumni/');
  assert(alumni.includes('class="people-grid alumni-grid"') && alumni.includes('object-position:50% 20%'));
  assert(!alumni.includes('member-email'));
  const professor = renderPage('/people/professor/');
  assert(!professor.includes('members-grid') && !professor.includes('alumni-grid') && !professor.includes('object-position:'));
  const person = { id: 'example', name: '예시', photo: { src: 'images/example.jpg', alt: '예시 사진', objectPosition: '50% 10%' } };
  const card = renderToStaticMarkup(createElement(PersonCard, { person, variant: 'member' }));
  assert(card.includes('object-position:50% 10%'));
});

test('news renders the entire body, multiple image slots and newest post first', () => {
  const html = renderPage('/news');
  assert(html.indexOf('2024-03-21') < html.indexOf('2018-11-09'));
  const group = content.news.find((post) => post.title === 'Group Photos' && post.date === '2024-03-21');
  assert.equal(group.images.length, 5);
  assert.equal((html.match(/class="image-placeholder"/g) || []).length, 0);
  const fixture = { id: 'test-news', date: '2026-01-01', title: 'Example', body: ['First full paragraph.', 'Second full paragraph.'], images: [{ src: null, alt: 'Example one' }, { src: null, alt: 'Example two' }] };
  const feed = renderToStaticMarkup(createElement(NewsFeed, { posts: [fixture] }));
  assert(feed.includes('First full paragraph.') && feed.includes('Second full paragraph.'));
  assert.equal((feed.match(/class="image-placeholder"/g) || []).length, 2);
});

test('News rich paragraphs preserve marks, superscript and links and escape literal HTML', () => {
  const html = renderToStaticMarkup(createElement(NewsBody, { paragraphs: ['Plain paragraph', [
    { text: 'Nested', italic: true, underline: true, bold: true },
    { text: '*', superscript: true }, { text: '\nNext' },
    { text: 'Paper', href: 'https://example.org/paper?a=1&b=2', italic: true },
    { text: '<script>literal</script>' },
  ]] }));
  assert(html.includes('Plain paragraph'));
  assert(html.includes('<u><em><strong>Nested</strong></em></u>'));
  assert(html.includes('<sup>*</sup>') && html.includes('\nNext'));
  assert(html.includes('href="https://example.org/paper?a=1&amp;b=2"') && html.includes('rel="noopener noreferrer"'));
  assert(html.includes('&lt;script&gt;literal&lt;/script&gt;') && !html.includes('<script>'));
});

test('publication links are omitted without values and Contact displays supplied details', () => {
  const item = { title: [{ text: 'Example title' }], authors: [{ text: 'Example author' }], venue: [{ text: 'Example journal, 2026.' }], year: 2026, url: null };
  assert(!renderToStaticMarkup(createElement(PublicationItem, { item })).includes('publication-links'));
  const contact = renderPage('/contact');
  for (const text of ['Room 620, Building 102(IT Building)', 'School of Computer Science and Engineering', 'Pusan National University', '2 Busandaehak-ro 63 beon-gil', 'Geumjeong-gu, Busan 46241', 'South Korea', 'gsong at pusan dot ac dot kr', '+82 51-510-3644']) assert(contact.includes(text));
  assert(!contact.includes('mailto:'));
  assert(!contact.includes('tel:'));
});

test('Contact map encodes the address, supports an external link override and hides without an address', () => {
  const addressLines = ['Room 620, IT Building', 'Pusan National University', '부산 & South Korea'];
  const query = encodeURIComponent(addressLines.join(', '));
  const html = renderToStaticMarkup(createElement(ContactMap, { addressLines }));
  assert(html.includes(`https://maps.google.com/maps?q=${query}&amp;z=17&amp;output=embed`));
  assert(html.includes(`https://www.google.com/maps/search/?api=1&amp;query=${query}`));
  assert(html.includes('loading="lazy"') && html.includes('title="MLB Lab location on Google Maps"'));
  const override = renderToStaticMarkup(createElement(ContactMap, { addressLines, mapUrl: 'https://example.org/map' }));
  assert(override.includes('href="https://example.org/map"') && override.includes('<iframe'));
  const empty = renderToStaticMarkup(createElement(ContactMap, { addressLines: [] }));
  assert(!empty.includes('<iframe') && empty.includes('연구실 주소 등록 예정'));
  const namedQuery = encodeURIComponent('부산대학교 IT관');
  const named = renderToStaticMarkup(createElement(ContactMap, { addressLines, mapQuery: '부산대학교 IT관' }));
  assert(named.includes(`maps?q=${namedQuery}&amp;z=17`));
  assert(named.includes(`api=1&amp;query=${namedQuery}`));
  const page = renderPage('/contact/');
  assert(page.includes(`maps?q=${namedQuery}&amp;z=17`));
  assert(page.includes('Room 620, Building 102(IT Building)'));
});

test('inline text supports marks and nesting while escaping HTML-like text', () => {
  const html = renderToStaticMarkup(createElement(InlineText, { runs: [
    { text: 'Student', underline: true }, { text: ', ' },
    { text: 'PI*', bold: true }, { text: ' & <script>text</script>' },
    { text: 'de novo', italic: true }, { text: 'Nested', bold: true, underline: true, italic: true },
  ] }));
  assert(html.includes('<u>Student</u>') && html.includes('<strong>PI*</strong>'));
  assert(html.includes('<em>de novo</em>') && html.includes('<u><em><strong>Nested</strong></em></u>'));
  assert(html.includes('&amp; &lt;script&gt;text&lt;/script&gt;') && !html.includes('<script>'));
});

test('publication layout retains title, authors, venue order without adding a second year', () => {
  const item = { title: [{ text: 'Title ' }, { text: 'de novo', italic: true }], authors: [{ text: 'A', underline: true }, { text: 'B*', bold: true }], venue: [{ text: 'Journal', italic: true }, { text: ', 1:2. 2026. (Invited.)' }], year: 2026, url: 'https://example.org/paper' };
  const html = renderToStaticMarkup(createElement(PublicationItem, { item }));
  assert(html.indexOf('<h3>') < html.indexOf('publication-authors') && html.indexOf('publication-authors') < html.indexOf('publication-venue'));
  assert.equal((html.match(/2026/g) || []).length, 1);
  assert(html.includes('(Invited.)') && html.includes('https://example.org/paper'));
  assert(html.includes('<p class="publication-authors"><u>A</u>, <strong>B*</strong>.</p>'));
  const oneAuthor = renderToStaticMarkup(createElement(PublicationItem, { item: { ...item, authors: [{ text: 'J. Michael Cherry', bold: true }] } }));
  assert(oneAuthor.includes('<strong>J. Michael Cherry</strong>.</p>'));
  const suffix = renderToStaticMarkup(createElement(PublicationItem, { item: { ...item, authors: [{ text: 'Name Jr.' }] } }));
  assert(suffix.includes('>Name Jr.</p>') && !suffix.includes('Jr..'));
  const page = renderPage('/publications/');
  assert(page.includes('publication-note') && page.includes("PNU students&#x27; names"));
});

test('publication co-first author daggers render as superscripts with formatting and automatic punctuation', () => {
  const item = {
    title: [{ text: 'Title' }],
    authors: [{ text: 'Author A†', underline: true }, { text: 'Author B*†', bold: true }],
    venue: [{ text: 'Journal. 2026.' }],
  };
  const html = renderToStaticMarkup(createElement(PublicationItem, { item }));
  assert(html.includes('<p class="publication-authors"><u>Author A<sup>†</sup></u>, <strong>Author B*<sup>†</sup></strong>.</p>'));
  assert(renderPage('/publications/').includes('<sup>†</sup> co-first authors'));
  const news = renderToStaticMarkup(createElement(NewsBody, { paragraphs: [[{ text: 'Author†' }, { text: '†', superscript: true }]] }));
  assert(news.includes('Author†<sup>†</sup>') && !news.includes('<sup><sup>'));
});

test('null images use a labelled placeholder and populated images use the configured base', () => {
  assert(renderToStaticMarkup(createElement(ImageSlot)).includes('이미지 등록 예정'));
  const html = renderToStaticMarkup(createElement(ImageSlot, { image: { src: 'images/example.webp', alt: '예시 사진' } }));
  assert(html.includes('src="/images/example.webp"') && html.includes('alt="예시 사진"'));
});
