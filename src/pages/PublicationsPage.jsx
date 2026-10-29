import { Fragment } from 'react';
import publications from '../data/publications.json';
import publicationNote from '../data/publications-note.json';
import { EmptyState, ExternalLink, PageHeading } from '../components/common.jsx';
import InlineText from '../components/InlineText.jsx';
import { groupPublications } from '../lib/content.js';

export function PublicationAuthors({ authors }) {
  return <>{authors.map((author, index) => <Fragment key={index}>
    {index > 0 && ', '}<InlineText runs={[author]} />
  </Fragment>)}{authors.length > 0 && !authors.at(-1).text.trimEnd().endsWith('.') && '.'}</>;
}

export function PublicationItem({ item }) {
  return <li className="publication-item"><h3><InlineText runs={item.title} /></h3>
    <p className="publication-authors"><PublicationAuthors authors={item.authors} /></p><p className="publication-venue"><InlineText runs={item.venue} /></p>
    {item.url && <div className="publication-links">
      <ExternalLink href={item.url}>View Paper</ExternalLink>
    </div>}
  </li>;
}

export default function PublicationsPage() {
  const groups = groupPublications(publications);
  return <div className="container page"><PageHeading title="Publications"  />
    {publicationNote.length > 0 && <p className="publication-note"><InlineText runs={publicationNote} /></p>}
    {groups.length ? <div className="publication-groups">{groups.map((group) => <section className="publication-year" key={group.year} aria-labelledby={`year-${group.year}`}>
      <h2 id={`year-${group.year}`}>{group.year}</h2><ol>{group.items.map((item) => <PublicationItem key={item.id} item={item} />)}</ol>
    </section>)}</div> : <EmptyState />}
  </div>;
}
