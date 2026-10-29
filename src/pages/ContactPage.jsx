import contact from '../data/contact.json';
import { ExternalLink, PageHeading } from '../components/common.jsx';

export function ContactMap({ addressLines, mapUrl, mapQuery }) {
  const address = mapQuery?.trim() || addressLines.join(', ').trim();
  if (!address) return <div className="map-placeholder"><h2>Location</h2><p>연구실 주소 등록 예정</p>
    {mapUrl && <ExternalLink href={mapUrl}>Google Maps에서 보기</ExternalLink>}
  </div>;
  const query = encodeURIComponent(address);
  const searchUrl = mapUrl || `https://www.google.com/maps/search/?api=1&query=${query}`;
  return <div className="contact-map">
    <iframe title="MLB Lab location on Google Maps" src={`https://maps.google.com/maps?q=${query}&z=17&output=embed`}
      width="600" height="450" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
    <ExternalLink className="text-link" href={searchUrl}>View on Google Maps</ExternalLink>
  </div>;
}

export default function ContactPage() {
  return <div className="container page"><PageHeading title="Contact" />
    <div className="contact-layout"><section className="contact-information" aria-labelledby="contact-details"><h2 id="contact-details">Contact Information</h2>
      <dl className="contact-list"><div><dt>Address</dt><dd>{contact.addressLines.length
        ? <address>{contact.addressLines.map((line, i) => <span key={i}>{line}</span>)}</address>
        : <span className="muted">연구실 주소 등록 예정</span>}</dd></div>
        <div><dt>Email</dt><dd>{contact.email ? <span>{contact.emailDisplay || contact.email}</span> : <span className="muted">이메일 등록 예정</span>}</dd></div>
        <div><dt>Phone</dt><dd>{contact.phone ? <span>{contact.phone}</span> : <span className="muted">전화번호 등록 예정</span>}</dd></div>
      </dl>
    </section><ContactMap addressLines={contact.addressLines} mapUrl={contact.mapUrl} mapQuery={contact.mapQuery} /></div>
  </div>;
}
