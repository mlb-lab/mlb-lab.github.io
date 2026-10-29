import { useState } from 'react';
import { assetUrl } from '../lib/content.js';

export function PageHeading({ section, title, description }) {
  return <header className="page-heading">
    <p className="eyebrow">{section || 'Machine Learning & Bioinformatics'}</p>
    <h1>{title}</h1>
    {description && <p className="page-description">{description}</p>}
  </header>;
}

export function Paragraphs({ paragraphs = [] }) {
  return <div className="prose">{paragraphs.map((text, i) => <p key={i}>{text}</p>)}</div>;
}

export function ImageSlot({ image, label = '이미지 등록 예정', className = '', eager = false, objectPosition }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const src = image?.src;
  return <div className={`image-slot ${className}`}>
    {src && failedSrc !== src
      ? <img src={assetUrl(src)} alt={image.alt} loading={eager ? 'eager' : 'lazy'} style={objectPosition ? { objectPosition } : undefined}
        onError={() => setFailedSrc(src)} />
      : <div className="image-placeholder" role="img" aria-label={image?.alt || label}>
        <svg viewBox="0 0 64 48" fill="none" aria-hidden="true"><rect x="5" y="5" width="54" height="38" rx="2" /><circle cx="22" cy="18" r="4" /><path d="m7 37 15-12 12 9 9-8 14 11" /></svg>
        <span>{label}</span>
      </div>}
  </div>;
}

export function ExternalLink({ href, children, ...props }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
    {children}<span className="external-arrow" aria-hidden="true"> ↗</span><span className="sr-only"> (새 탭)</span>
  </a>;
}

export function EmptyState({ children = '등록된 정보가 없습니다. 확인된 자료를 준비 중입니다.' }) {
  return <p className="empty-state">{children}</p>;
}
