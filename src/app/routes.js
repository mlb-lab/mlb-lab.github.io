// Public routes are the shared source for the router, navigation and static build.
export const pages = [
  { id: 'home', path: '/', title: 'Home' },
  { id: 'professor', path: '/people/professor/', title: 'Professor' },
  { id: 'members', path: '/people/members/', title: 'Members' },
  { id: 'alumni', path: '/people/alumni/', title: 'Alumni' },
  { id: 'research', path: '/research/', title: 'Research' },
  { id: 'publications', path: '/publications/', title: 'Publications' },
  { id: 'news', path: '/news/', title: 'News' },
  { id: 'contact', path: '/contact/', title: 'Contact' },
];

export const aliases = [{ path: '/people/', target: '/people/professor/' }];
export const pagePath = (id) => {
  const page = pages.find((item) => item.id === id);
  if (!page) throw new Error(`Unknown page: ${id}`);
  return page.path;
};
export const normalizePath = (path) => path.replace(/\/+$/, '') || '/';
export const findPage = (path) => pages.find((page) => normalizePath(page.path) === normalizePath(path));

const CANONICAL_ORIGIN = 'https://mlb-lab.github.io';

// Canonicals identify production pages, including when viewed on localhost or a preview base.
export const pageCanonical = (path) => {
  const pathname = path.split(/[?#]/, 1)[0];
  const alias = aliases.find((item) => normalizePath(item.path) === normalizePath(pathname));
  const page = findPage(alias?.target ?? pathname);
  return page ? new URL(page.path, CANONICAL_ORIGIN).href : null;
};

const LAB_NAME = 'MLB Lab';
const PROFESSOR_NAME = 'Prof. Giltae Song';

// Page-specific SEO titles
export const pageTitle = (path) => {
  const page = findPage(path);

  if (!page) return `Page not found | ${LAB_NAME}`;

  if (page.id === 'home') {
    return `${LAB_NAME} | ${PROFESSOR_NAME} | Machine Learning & Bioinformatics`;
  }

  if (page.id === 'professor') {
    return `${PROFESSOR_NAME} | ${LAB_NAME}`;
  }

  return `${page.title} | ${LAB_NAME} | ${PROFESSOR_NAME}`;
};

// Page-specific SEO descriptions (English + Korean)
const descriptions = {
  home:
    "Machine Learning & Bioinformatics Lab (MLB Lab), led by Prof. Giltae Song at Pusan National University. 부산대학교 송길태 교수의 머신러닝 및 바이오인포매틱스 연구실.",

  professor:
    "Meet Prof. Giltae Song of Pusan National University and explore his research interests and academic background. 부산대학교 송길태 교수의 연구 분야와 학력 및 경력을 소개합니다.",

  members:
    "Meet the researchers and students of MLB Lab at Pusan National University. 부산대학교 송길태 교수 연구실의 연구원 및 학생 구성원을 소개합니다.",

  alumni:
    "Explore the alumni of MLB Lab at Pusan National University. 부산대학교 송길태 교수 연구실의 졸업생 및 이전 구성원을 소개합니다.",

  research:
    "Explore research in machine learning, bioinformatics, multimodal precision medicine, and artificial intelligence at MLB Lab. 부산대학교 송길태 교수 연구실의 머신러닝, 바이오인포매틱스, 정밀의료 및 인공지능 연구를 소개합니다.",

  publications:
    "Browse academic publications and research achievements from MLB Lab, led by Prof. Giltae Song. 부산대학교 송길태 교수 연구실의 학술 논문 및 연구 성과를 소개합니다.",

  news:
    "Discover the latest news, academic activities, and achievements from MLB Lab. 부산대학교 송길태 교수 연구실의 최신 소식, 학술 활동 및 연구 성과를 소개합니다.",

  contact:
    "Find contact information for MLB Lab at Pusan National University, led by Prof. Giltae Song. 부산대학교 송길태 교수 연구실의 위치 및 연락처를 안내합니다.",
};

export const pageDescription = (path) => {
  const page = findPage(path);
  return descriptions[page?.id] || descriptions.home;
};

