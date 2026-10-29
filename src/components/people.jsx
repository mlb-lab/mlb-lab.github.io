import { ImageSlot } from './common.jsx';

export function EducationList({ education }) {
  const records = [['bs', 'B.S.'], ['ms', 'M.S.'], ['phd', 'Ph.D.']]
    .filter(([key]) => typeof education?.[key] === 'string' ? education[key].trim() : education?.[key]?.institution);
  if (!records.length) return null;
  return <dl className="education-list">{records.map(([key, label]) => {
    const degree = education[key];
    if (typeof degree === 'string') return <div key={key}><dt>{label}</dt><dd>{degree}</dd></div>;
    return <div key={key}><dt>{label}</dt><dd>{degree.institution}
      {degree.department && <span> · {degree.department}</span>}
      {degree.year && <span> ({degree.year})</span>}
    </dd></div>;
  })}</dl>;
}

export function PersonCard({ person, showEmail = false, variant = 'default' }) {
  return <article className="person-card">
    <ImageSlot image={person.photo} label="프로필 사진 등록 예정" className="portrait"
      objectPosition={['member', 'alumni'].includes(variant) ? person.photo?.objectPosition || '50% 20%' : undefined} />
    <div className="person-details">
      
      <h2>{person.name}</h2>
      {person.position && <p className="position"><span className="sr-only">Position: </span>{person.position}</p>}
      <EducationList education={person.education} />
      {showEmail && person.email && (variant === 'member'
        ? <dl className="member-email"><dt>Email</dt><dd><span className="email-link">{person.email}</span></dd></dl>
        : <a className="email-link" href={`mailto:${person.email}`}>{person.email}</a>)}
    </div>
  </article>;
}
