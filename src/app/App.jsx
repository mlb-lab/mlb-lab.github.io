import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router';
import SiteLayout from '../components/layout.jsx';
import HomePage from '../pages/HomePage.jsx';
import ProfessorPage from '../pages/ProfessorPage.jsx';
import PeoplePage from '../pages/PeoplePage.jsx';
import ResearchPage from '../pages/ResearchPage.jsx';
import PublicationsPage from '../pages/PublicationsPage.jsx';
import NewsPage from '../pages/NewsPage.jsx';
import ContactPage from '../pages/ContactPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';
import site from '../data/site.json';
import { aliases, pages, pageTitle } from './routes.js';

const pageElements = {
  home: <HomePage />, professor: <ProfessorPage />, members: <PeoplePage kind="members" />,
  alumni: <PeoplePage kind="alumni" />, research: <ResearchPage />,
  publications: <PublicationsPage />, news: <NewsPage />, contact: <ContactPage />,
};

function AliasRedirect({ target }) {
  const { search, hash } = useLocation();
  return <Navigate to={`${target}${search}${hash}`} replace />;
}

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => { document.title = pageTitle(pathname, site.name); }, [pathname]);
  return <Routes><Route element={<SiteLayout />}>
    {pages.map((page) => <Route key={page.id} path={page.path} element={pageElements[page.id]} />)}
    {aliases.map((alias) => <Route key={alias.path} path={alias.path} element={<AliasRedirect target={alias.target} />} />)}
    <Route path="*" element={<NotFoundPage />} />
  </Route></Routes>;
}
