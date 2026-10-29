import { useEffect, useRef, useState } from 'react';

// The same SVG as the reference remains visible during loading and without WebGL.
function StaticGenomicScene() {
  return <div className="genomic-fallback"><svg viewBox="0 0 600 700" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g opacity=".45" stroke="#7fbef6" strokeWidth="2">
      <path d="M180 40C430 150 150 260 410 355S180 565 400 675" />
      <path d="M410 40C150 150 430 260 180 355S410 565 180 675" />
    </g><g stroke="#6eb7e0" opacity=".26">
      <path d="M183 58L402 58M240 115L359 115M350 180L230 180M395 245L188 245M180 340L410 340M240 430L342 430M395 525L188 525M220 630L373 630" />
    </g>
  </svg></div>;
}

export default function GenomicScene({ paused, reducedMotion }) {
  const hostRef = useRef(null);
  const controllerRef = useRef(null);
  const motionRef = useRef({ paused, reducedMotion });
  const [ready, setReady] = useState(false);
  motionRef.current = { paused, reducedMotion };

  useEffect(() => {
    let cancelled = false;
    let controller;
    const failed = () => {
      if (cancelled) return;
      setReady(false);
    };
    // Lazy loading keeps Three.js out of other routes and server rendering.
    import('../lib/genomic-scene.js').then(({ mountGenomicScene }) => {
      if (cancelled || !hostRef.current) return;
      controller = mountGenomicScene(hostRef.current, { ...motionRef.current, onError: failed });
      controllerRef.current = controller;
      setReady(true);
    }).catch(failed);
    return () => {
      cancelled = true;
      controller?.dispose();
      if (controllerRef.current === controller) controllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    controllerRef.current?.setMotion({ paused, reducedMotion });
  }, [paused, reducedMotion]);

  return <div className="genomic-scene" aria-hidden="true" data-scene-ready={ready}>
    <div className="genomic-canvas" ref={hostRef} />
    {!ready && <StaticGenomicScene />}
  </div>;
}
