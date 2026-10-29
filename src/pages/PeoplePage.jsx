import members from '../data/members.json';
import alumni from '../data/alumni.json';
import { PersonCard } from '../components/people.jsx';
import { EmptyState, PageHeading } from '../components/common.jsx';
import { byDisplayOrder } from '../lib/content.js';

export default function PeoplePage({ kind }) {
  const isMembers = kind === 'members';
  const people = byDisplayOrder(isMembers ? members : alumni);
  return <div className={`container page ${isMembers ? 'members-page' : 'alumni-page'}`}><PageHeading section="People" title={isMembers ? 'Members' : 'Alumni'}
     />
    {people.length ? <div className={`people-grid ${isMembers ? 'members-grid' : 'alumni-grid'}`}>{people.map((person) => <PersonCard key={person.id} person={person} showEmail={isMembers} variant={isMembers ? 'member' : 'alumni'} />)}</div> : <EmptyState />}
  </div>;
}
