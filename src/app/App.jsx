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
import {
  aliases,
  pages,
  pageTitle,
  pageDescription,
  pageCanonical,
} from './routes.js';

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
  useEffect(() => {
    // Update page title
    document.title = pageTitle(pathname);
  
    // Update page description
    let description = document.querySelector(
      'meta[name="description"]'
    );
  
    if (!description) {
      description = document.createElement('meta');
      description.setAttribute('name', 'description');
      document.head.appendChild(description);
    }
  
    description.setAttribute(
      'content',
      pageDescription(pathname)
    );

    // Reuse the server-rendered canonical and keep only one after client navigation.
    const canonicalUrl = pageCanonical(pathname);
    const canonicals = [...document.head.querySelectorAll('link[rel~="canonical" i]')];
    let canonical = canonicals.shift();
    canonicals.forEach((duplicate) => duplicate.remove());
    if (canonicalUrl) {
      if (!canonical) {
        canonical = document.createElement('link');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('rel', 'canonical');
      canonical.setAttribute('href', canonicalUrl);
    } else {
      canonical?.remove();
    }
  }, [pathname]);
  return <Routes><Route element={<SiteLayout />}>
    {pages.map((page) => <Route key={page.id} path={page.path} element={pageElements[page.id]} />)}
    {aliases.map((alias) => <Route key={alias.path} path={alias.path} element={<AliasRedirect target={alias.target} />} />)}
    <Route path="*" element={<NotFoundPage />} />
  </Route></Routes>;
}
