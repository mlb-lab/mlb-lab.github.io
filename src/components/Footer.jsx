import { Link } from 'react-router';
import site from '../data/site.json';
import contact from '../data/contact.json';
import professor from '../data/professor.json';
import { pagePath } from '../app/routes.js';
import { assetUrl } from '../lib/content.js';

export default function Footer({ siteInfo = site, contactInfo = contact, professorInfo = professor }) {
  const footer = siteInfo.footer || {};
  const name = footer.name || siteInfo.name;
  return <footer className="site-footer"><div className="container">
    <div className="footer-grid">
      <div className="footer-brand">
        <Link className="footer-brand-link" to={pagePath('home')} aria-label={`${name} Home`}>
          {footer.logo?.src && <img className="footer-logo" src={assetUrl(footer.logo.src)} alt="" width="88" height="88" />}
          <span className="footer-name">{name}</span>
        </Link>
        {footer.affiliationLines?.length > 0 && <p className="footer-affiliation">{footer.affiliationLines.map((line, i) => <span key={i}>{line}</span>)}</p>}
      </div>
      <section className="footer-column" aria-labelledby="footer-address"><h2 id="footer-address">Address</h2>
        {contactInfo.addressLines.length > 0 ? <address>{contactInfo.addressLines.map((line, i) => <span key={i}>{line}</span>)}</address> : <p>연구실 주소 등록 예정</p>}
      </section>
      <section className="footer-column" aria-labelledby="footer-contact"><h2 id="footer-contact">Contact</h2>
        {professorInfo?.name && <p className="footer-professor">Professor {professorInfo.name}</p>}
        {contactInfo.email && <p>{contactInfo.emailDisplay || contactInfo.email}</p>}
        {contactInfo.phone && <p className="footer-phone">Tel {contactInfo.phone}</p>}
      </section>
    </div>
    <div className="footer-bottom"><p>© {new Date().getFullYear()} {name}, {siteInfo.subtitle}</p>
      {footer.locationText && <p>{footer.locationText}</p>}
    </div>
  </div></footer>;
}
