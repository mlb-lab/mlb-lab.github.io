import professor from '../data/professor.json';
import { EmptyState, ExternalLink, ImageSlot, PageHeading, Paragraphs } from '../components/common.jsx';

function monthLabel(value) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${value}-01T00:00:00Z`)).replace(/^([A-Za-z]+) /, '$1. ');
}

export function ProfessorProfile({ person }) {
  const degrees = [['phd', 'Ph.D.'], ['ms', 'M.S.'], ['bs', 'B.S.']].filter(([key]) => person.education?.[key]?.institution);
  const emailText = person.emailDisplay || person.email;
  const contact = person.contact;
  return <article className="professor-profile" id={person.id}>
    <div className="professor-layout">
      <ImageSlot image={person.photo} label="교수 사진 등록 예정" className="professor-photo portrait" eager />
      <div className="professor-details"><h2>{person.name}</h2>
        {person.position && <p className="position">{person.position}</p>}
        {person.affiliation && <p className="affiliation">{person.affiliation}</p>}
        
        <Paragraphs paragraphs={person.biography} />
        {person.researchInterests?.length > 0 && <section className="profile-section"><h3>Research interests</h3><ul className="interest-list">{person.researchInterests.map((item, i) => <li key={i}>{item}</li>)}</ul></section>}
        {person.links?.length > 0 && <div className="profile-links">{person.links.map((link) => <ExternalLink key={link.href} href={link.href}>{link.label}</ExternalLink>)}</div>}
        {(person.experience?.length > 0 || degrees.length > 0 || contact?.addressLines?.length > 0 || contact?.phone || person.email) && <div className="professor-history">
      {person.experience?.length > 0 && <section className="professor-section" aria-labelledby="professor-experience"><h3 id="professor-experience">Experience</h3>
        <ul className="professor-list">{person.experience.map((item, index) => <li key={index}>
          {[item.position, item.department, item.organization].filter(Boolean).join(', ')}
          {item.startDate && <span>, {monthLabel(item.startDate)}</span>}
          {item.endDate && <span>{item.startDate ? ' - ' : ', '}{monthLabel(item.endDate)}</span>}
          {item.mentor && <span> (Mentor: {item.mentor})</span>}
        </li>)}</ul>
      </section>}
      {degrees.length > 0 && <section className="professor-section" aria-labelledby="professor-education"><h3 id="professor-education">Education</h3>
        <ul className="professor-list">{degrees.map(([key, label]) => {
          const degree = person.education[key];
          return <li key={key}>{[label, degree.department, degree.institution, degree.year].filter(Boolean).join(', ')}{degree.advisor && <span> (Advisor: {degree.advisor})</span>}</li>;
        })}</ul>
      </section>}
      {(contact?.addressLines?.length > 0 || contact?.phone || person.email) && <section className="professor-section" aria-labelledby="professor-contact"><h3 id="professor-contact">Contact</h3>
        <ul className="professor-list professor-contact-list">
          {contact?.addressLines?.length > 0 && <li><h4>Mailing Address</h4><address>{contact.addressLines.map((line, i) => <span key={i}>{line}</span>)}</address></li>}
          {contact?.phone && <li><h4>Phone</h4><a href={`tel:${contact.phone.replace(/[\s()-]/g, '')}`}>{contact.phone}</a></li>}
          {person.email && <li><h4>Email</h4><span>{emailText}</span></li>}
        </ul>
      </section>}
        </div>}
      </div>
    </div>
  </article>;
}

export default function ProfessorPage() {
  return <div className="container page"><PageHeading section="People" title="Professor" />
    {!professor ? <EmptyState /> : <ProfessorProfile person={professor} />}
  </div>;
}
