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
export const pageTitle = (path, siteName) => `${findPage(path)?.title || 'Page not found'} | ${siteName}`;
