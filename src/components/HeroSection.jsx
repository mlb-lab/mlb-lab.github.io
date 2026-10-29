import { useEffect, useState } from 'react';
import GenomicScene from './GenomicScene.jsx';
import './hero.css';

export default function HeroSection({ content }) {
  // SSR and the first client render agree; media preference is applied after hydration.
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    function update() {
      setReducedMotion(preference.matches);
    }
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  return <section className="home-hero genomic-hero" aria-labelledby="home-title">
    <GenomicScene paused={reducedMotion} reducedMotion={reducedMotion} />
    <div className="genomic-vignette" aria-hidden="true" />
    <div className="genomic-header-space" aria-hidden="true" />
    <div className="genomic-main"><div className="genomic-copy">
      <div className="genomic-eyebrow">{content.label}</div>
      <p className="genomic-welcome">{content.welcome}</p>
      <p className="genomic-pi">{content.principalInvestigator}</p>
      <h1 id="home-title" className="genomic-headline">{content.headlineLines[0]}<br /><em>{content.headlineLines[1]}</em></h1>
      <div className="genomic-underline" aria-hidden="true" />
    </div></div>
  </section>;
}
