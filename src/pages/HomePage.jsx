import { Link } from 'react-router';
import home from '../data/home.json';
import { Paragraphs } from '../components/common.jsx';
import HeroSection from '../components/HeroSection.jsx';
import { pagePath } from '../app/routes.js';

function ArrowIcon() {
  return <svg className="home-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
    <path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

export default function HomePage() {
  return <div className="home-page">
    <HeroSection content={home.hero} />
    <div className="container home-body">
      <section className="home-introduction" aria-labelledby="about-title">
        <div className="home-about-heading"><p className="home-about-label">{home.aboutLabel}</p>
          <h2 id="about-title">{home.aboutHeadline}</h2>
        </div>
        <div className="home-about-content"><Paragraphs paragraphs={home.introduction} />
          <ul className="home-research-tags" aria-label="Research keywords">{home.researchKeywords.map((keyword) => <li key={keyword}>{keyword}</li>)}</ul>
          <Link className="text-link home-research-link" to={pagePath('research')}>{home.researchLinkLabel}<ArrowIcon /></Link>
        </div>
      </section>
      <nav className="home-links" aria-label="Explore our lab">
        {home.quickLinks.map((link, index) => <Link key={link.pageId} to={pagePath(link.pageId)}>
          <span className="home-link-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          <strong>{link.title}</strong><p>{link.description}</p><ArrowIcon />
        </Link>)}
      </nav>
    </div>
  </div>;
}
