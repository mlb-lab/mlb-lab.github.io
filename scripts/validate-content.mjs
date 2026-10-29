import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeEmailAddress } from '../src/lib/content.js';
import { pages } from '../src/app/routes.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const datasets = ['site', 'home', 'professor', 'members', 'alumni', 'research', 'publications', 'publications-note', 'news', 'contact'];

// Compare each segment explicitly: Windows otherwise hides case errors that fail on Pages.
export function publicFileExists(path) {
  let current = join(root, 'public');
  try {
    for (const segment of path.split('/')) {
      if (!readdirSync(current).includes(segment)) return false;
      current = join(current, segment);
    }
    return statSync(current).isFile();
  } catch { return false; }
}

export function loadContent() {
  return Object.fromEntries(datasets.map((name) => {
    try { return [name, JSON.parse(readFileSync(join(root, 'src/data', `${name}.json`), 'utf8'))]; }
    catch (error) { throw new Error(`${name}.json: ${error.message}`); }
  }));
}

export function validateContent(data, { fileExists = publicFileExists } = {}) {
  const errors = [];
  const fail = (path, message) => errors.push(`${path}: ${message}`);
  const text = (value, path) => { if (typeof value !== 'string' || !value.trim()) fail(path, '비어 있지 않은 문자열이 필요합니다.'); };
  const optional = (check) => (value, path) => { if (value !== undefined && value !== null) check(value, path); };
  const boolean = (value, path) => { if (typeof value !== 'boolean') fail(path, 'boolean 값이 필요합니다.'); };
  const integer = (value, path) => { if (!Number.isSafeInteger(value) || value < 0) fail(path, '0 이상의 정수가 필요합니다.'); };
  const year = (value, path) => { if (!Number.isInteger(value) || value < 1000 || value > 9999) fail(path, '네 자리 연도가 필요합니다.'); };
  const id = (value, path) => { if (typeof value !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) fail(path, 'ID는 소문자·숫자·하이픈으로 작성하세요.'); };
  const array = (check, minimum = 0) => (value, path) => {
    if (!Array.isArray(value)) return fail(path, '배열이 필요합니다.');
    if (value.length < minimum) fail(path, `항목이 ${minimum}개 이상 필요합니다.`);
    value.forEach((item, index) => check(item, `${path}[${index}]`));
  };
  const object = (fields, required = Object.keys(fields)) => (value, path) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return fail(path, '객체가 필요합니다.');
    for (const key of required) if (!(key in value)) fail(`${path}.${key}`, '필수 필드가 없습니다.');
    for (const [key, item] of Object.entries(value)) {
      if (!fields[key]) fail(`${path}.${key}`, '정의되지 않은 필드입니다. 필드 이름을 확인하세요.');
      else fields[key](item, `${path}.${key}`);
    }
  };
  const inlineRun = object({
    text: (value, path) => { if (typeof value !== 'string' || value.length === 0) fail(path, '비어 있지 않은 텍스트가 필요합니다. 구분용 공백은 사용할 수 있습니다.'); },
    bold: boolean, underline: boolean, italic: boolean,
  }, ['text']);
  const richText = (minimum = 1, runCheck = inlineRun) => (value, path) => {
    array(runCheck, minimum)(value, path);
    if (Array.isArray(value) && value.length && !value.some((run) => typeof run?.text === 'string' && run.text.trim())) fail(path, '공백 이외의 텍스트가 필요합니다.');
  };
  const author = object({
    text: (value, path) => { if (typeof value !== 'string' || value !== value.trim() || !/[\p{L}\p{N}]/u.test(value)) fail(path, '저자 한 명의 이름을 입력하세요. 쉼표·마침표·공백만인 항목은 넣지 않습니다.'); },
    bold: boolean, underline: boolean, italic: boolean,
  }, ['text']);
  const url = (value, path) => {
    try {
      const parsed = new URL(value);
      if (typeof value !== 'string' || value !== value.trim() || !['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error();
    } catch { fail(path, 'http(s) URL이 필요합니다. 인증 정보가 포함된 URL은 허용하지 않습니다.'); }
  };
  const email = (value, path) => { if (typeof value !== 'string' || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value)) fail(path, '올바른 이메일 주소가 필요합니다.'); };
  const newsRun = object({
    text: (value, path) => { if (typeof value !== 'string' || !value.length) fail(path, '텍스트가 필요합니다.'); },
    bold: boolean, underline: boolean, italic: boolean, superscript: boolean, href: url,
  }, ['text']);
  const newsParagraph = (value, path) => typeof value === 'string' ? text(value, path) : richText(1, newsRun)(value, path);
  const phone = (value, path) => { if (typeof value !== 'string' || !/^\+?[\d ()-]{5,30}$/.test(value) || !/\d{2}/.test(value)) fail(path, '전화번호에는 숫자, 공백, +, 괄호, 하이픈을 사용하세요.'); };
  const asset = (value, path, prefix) => {
    if (typeof value !== 'string' || !value.startsWith(`${prefix}/`) || !/^[\p{L}\p{M}\p{N} _.,()'&/-]+$/u.test(value) || value.split('/').some((part) => !part || part !== part.trim() || part === '.' || part.endsWith('.'))) {
      return fail(path, `public 기준 ${prefix}/... 상대 경로가 필요합니다. 한글·단어 사이 공백은 허용하며 예약문자·역슬래시·상위 경로는 허용하지 않습니다.`);
    }
    if (!fileExists(value)) fail(path, `public/${value} 파일이 없거나 대소문자가 다릅니다.`);
  };
  const imageRecord = object({ src: optional((v, p) => asset(v, p, 'images')), alt: text }, ['src', 'alt']);
  const image = optional(imageRecord);
  const objectPosition = (value, path) => {
    if (typeof value !== 'string' || !/^(?:left|center|right|\d+(?:\.\d+)?%) (?:top|center|bottom|\d+(?:\.\d+)?%)$/.test(value) || value.split(' ').some((part) => part.endsWith('%') && parseFloat(part) > 100)) {
      fail(path, '사진 위치는 50% 20% 또는 center top처럼 가로·세로를 지정하세요. 백분율은 0~100 범위입니다.');
    }
  };
  const memberImage = optional(object({ src: optional((v, p) => asset(v, p, 'images')), alt: text, objectPosition: optional(objectPosition) }, ['src', 'alt']));
  const degree = optional(object({ institution: text, department: optional(text), year: optional(year), advisor: optional(text) }, ['institution']));
  const education = object({ bs: degree, ms: degree, phd: degree }, []);
  const textEducation = object({ bs: optional(text), ms: optional(text), phd: optional(text) }, []);
  const commonPerson = { id, name: text, position: optional(text), photo: image, education: optional(education) };
  const date = (value, path) => {
    const parsed = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00Z`) : new Date(NaN);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) fail(path, '실제 달력에 존재하는 ISO 날짜 YYYY-MM-DD가 필요합니다.');
  };
  const yearMonth = (value, path) => { if (typeof value !== 'string' || !/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(value)) fail(path, 'ISO 연월 YYYY-MM 형식이 필요합니다.'); };
  const experienceItem = (value, path) => {
    object({ position: text, department: optional(text), organization: text, startDate: optional(yearMonth), endDate: optional(yearMonth), mentor: optional(text) }, ['position', 'organization'])(value, path);
    if (value?.startDate && value?.endDate && value.startDate > value.endDate) fail(path, '시작 연월이 종료 연월보다 늦습니다.');
  };
  const footer = object({ name: text, logo: image, affiliationLines: array(text), locationText: optional(text) }, ['name', 'affiliationLines']);
  const hero = object({ label: text, welcome: text, principalInvestigator: text,
    headlineLines: (value, path) => { array(text, 2)(value, path); if (Array.isArray(value) && value.length !== 2) fail(path, '제목은 두 줄로 입력하세요.'); } });
  const schema = {
    site: object({ name: text, subtitle: text, footer: optional(footer) }, ['name', 'subtitle']),
    home: object({ title: text, hero, aboutLabel: text, aboutHeadline: text, researchLinkLabel: text, researchKeywords: array(text, 1), quickLinks: array(object({ pageId: (value, path) => { if (!pages.some((page) => page.id === value)) fail(path, '등록된 페이지 ID가 필요합니다.'); }, title: text, description: text }), 1), introduction: array(text, 1) }),
    professor: optional(object({ ...commonPerson, affiliation: optional(text), biography: array(text), researchInterests: array(text), experience: array(experienceItem), email: optional(email), emailDisplay: optional(text), contact: optional(object({ addressLines: array(text), phone: optional(phone) }, [])), links: array(object({ label: text, href: url })) }, ['id', 'name'])),
    members: array(object({ ...commonPerson, photo: memberImage, education: optional(textEducation), email: optional((value, path) => email(normalizeEmailAddress(value), path)), displayOrder: optional(integer) }, ['id', 'name'])),
    alumni: array(object({ ...commonPerson, education: optional(textEducation), displayOrder: optional(integer) }, ['id', 'name'])),
    research: array(object({ id, title: text, image, description: array(text, 1), displayOrder: optional(integer) }, ['id', 'title', 'description'])),
    publications: array(object({ id, title: richText(), authors: array(author, 1), venue: richText(), year, displayOrder: optional(integer), url: optional(url) }, ['id', 'title', 'authors', 'venue', 'year'])),
    'publications-note': richText(0),
    news: array(object({ id, date, title: text, body: array(newsParagraph), images: array(imageRecord) }, ['id', 'date', 'title', 'body', 'images'])),
    contact: object({ addressLines: array(text), email: optional(email), emailDisplay: optional(text), phone: optional(phone), mapUrl: optional(url), mapQuery: optional(text) }, ['addressLines']),
  };
  for (const name of datasets) {
    if (!(name in data)) { fail(`${name}.json`, '데이터 파일이 없습니다.'); continue; }
    schema[name](data[name], `${name}.json`);
    if (Array.isArray(data[name])) {
      const seen = new Set();
      data[name].forEach((item, index) => {
        if (!item?.id) return;
        if (seen.has(item.id)) fail(`${name}.json[${index}].id`, `중복 ID: ${item.id}`);
        seen.add(item.id);
      });
    }
  }
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const errors = validateContent(loadContent());
    if (errors.length) { console.error(`콘텐츠 검증 실패 (${errors.length}):\n${errors.map((error) => `- ${error}`).join('\n')}`); process.exitCode = 1; }
    else console.log(`${datasets.length}개 JSON 콘텐츠 검증 통과`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
