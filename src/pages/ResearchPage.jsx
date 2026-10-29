import research from '../data/research.json';
import { EmptyState, PageHeading, Paragraphs } from '../components/common.jsx';
import { byDisplayOrder } from '../lib/content.js';

export default function ResearchPage() {
  const areas = byDisplayOrder(research);
  return <div className="container page"><PageHeading title="Research" />
    {areas.length ? <div className="research-list">{areas.map((area) => <article className="research-section" key={area.id}>
      <div><h2>{area.title}</h2><Paragraphs paragraphs={area.description} /></div>
    </article>)}</div> : <EmptyState />}
  </div>;
}
