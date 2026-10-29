import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import site from '../data/site.json';
import { findPage, pages } from '../app/routes.js';
import Footer from './Footer.jsx';
import { assetUrl } from '../lib/content.js';

const linksFor = (ids) => ids.map((id) => { const page = pages.find((item) => item.id === id); return [page.path, page.title]; });
const mainLinks = linksFor(['home', 'research', 'publications', 'news', 'contact']);
const peopleLinks = linksFor(['professor', 'members', 'alumni']);

function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const peopleRef = useRef(null);
  const peopleButton = useRef(null);
  const mobileButton = useRef(null);
  const { pathname } = useLocation();
  const isHome = findPage(pathname)?.id === 'home';
  const peopleActive = ['professor', 'members', 'alumni'].includes(findPage(pathname)?.id);

  useEffect(() => {
    const closeOutside = (event) => {
      if (!peopleRef.current?.contains(event.target)) setPeopleOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, []);

  function closeNavigation() { setMobileOpen(false); setPeopleOpen(false); }
  function handleEscape(event) {
    if (event.key !== 'Escape') return;
    if (peopleOpen) { setPeopleOpen(false); peopleButton.current?.focus(); }
    else if (mobileOpen) { setMobileOpen(false); mobileButton.current?.focus(); }
  }
  const navLink = ([to, label]) => <NavLink key={to} to={to} end onClick={closeNavigation}>{label}</NavLink>;

  return <header className={`site-header${isHome ? ' site-header--overlay' : ''}${mobileOpen ? ' is-menu-open' : ''}`} onKeyDown={handleEscape}>
    <div className="container header-inner">
      <Link className="brand" to="/" onClick={closeNavigation} aria-label={`${site.name} Home`}>
        <img className="brand-logo" src={assetUrl('images/home/MLB 로고.png')} alt="" width="64" height="64" />
        <span><strong>{site.name}</strong><small>{site.subtitle}</small></span>
      </Link>
      <button ref={mobileButton} type="button" className="mobile-toggle" aria-expanded={mobileOpen}
        aria-controls="site-navigation" onClick={() => { setMobileOpen(!mobileOpen); setPeopleOpen(false); }}>
        <span className="sr-only">{mobileOpen ? '메뉴 닫기' : '메뉴 열기'}</span><span aria-hidden="true">{mobileOpen ? '×' : '☰'}</span>
      </button>
      <nav id="site-navigation" className={`navigation ${mobileOpen ? 'is-open' : ''}`} aria-label="주 메뉴">
        {navLink(mainLinks[0])}
        <div className="people-navigation" ref={peopleRef} onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setPeopleOpen(false);
        }}>
          <button ref={peopleButton} type="button" className={`people-toggle ${peopleActive ? 'active' : ''}`}
            aria-expanded={peopleOpen} aria-controls="people-navigation" onClick={() => setPeopleOpen(!peopleOpen)}>
            People <span className="chevron" aria-hidden="true">⌄</span>
          </button>
          <div id="people-navigation" className="people-dropdown" hidden={!peopleOpen}>
            {peopleLinks.map(navLink)}
          </div>
        </div>
        {mainLinks.slice(1).map(navLink)}
      </nav>
    </div>
  </header>;
}

export default function SiteLayout() {
  const location = useLocation();
  const mainRef = useRef(null);
  const previousPath = useRef(location.pathname);
  useEffect(() => {
    if (previousPath.current !== location.pathname) {
      mainRef.current?.focus();
      window.scrollTo({ top: 0, behavior: 'instant' });
      previousPath.current = location.pathname;
    }
  }, [location.pathname]);

  return <>
    <a className="skip-link" href="#main-content" onClick={(event) => {
      event.preventDefault(); mainRef.current?.focus(); mainRef.current?.scrollIntoView();
    }}>본문으로 건너뛰기</a>
    <Header key={location.pathname} />
    <main id="main-content" tabIndex="-1" ref={mainRef}><Outlet /></main>
    <Footer />
  </>;
}
