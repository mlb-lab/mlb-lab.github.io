import * as THREE from 'three';

// These values are the chosen reference implementation, not a new scene design.
export const HELIX_CONFIGS = Object.freeze([
  { x: 3.0, y: 0, z: 0, scale: 1.03, rotate: [.2, 0, -.24], phase: .3, opacity: .91, turns: 3.1, speed: .07 },
  { x: 5, y: .8, z: -2.6, scale: .83, rotate: [.57, .38, .42], phase: 2.1, opacity: .39, turns: 3.6, speed: -.043 },
  { x: 1.0, y: -1.1, z: -3.2, scale: .75, rotate: [-.32, -.5, -.66], phase: 3.4, opacity: .30, turns: 3, speed: .058 },
  { x: 6.2, y: -2.4, z: -4.4, scale: .5, rotate: [.13, 1, .5], phase: 1.6, opacity: .18, turns: 2.8, speed: -.032 },
].map((config) => Object.freeze({ ...config, rotate: Object.freeze(config.rotate) })));

// Pure scene construction can be inspected in Node without a window or WebGL.
export function createGenomicModel() {
  const scene = new THREE.Scene();
  const root = new THREE.Group();
  const camera = new THREE.PerspectiveCamera(44, 1, .1, 100);
  camera.position.set(0, 0, 17.8);
  scene.add(root);
  const geometries = new Set();
  const materials = new Set();
  const track = (resource) => {
    (resource.isMaterial ? materials : geometries).add(resource);
    return resource;
  };
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    scene.clear();
  };
  const strandMaterial = (color, opacity) => track(new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false }));

  try {
    // Every bead has the same geometry; reuse it across all four helices.
    const beadGeometry = track(new THREE.SphereGeometry(.066, 7, 7));
    const helices = HELIX_CONFIGS.map((options) => {
      const { x, y, z, scale, rotate, phase, opacity, turns, speed } = options;
      const group = new THREE.Group();
      group.position.set(x, y, z);
      group.rotation.set(...rotate);
      group.scale.setScalar(scale);
      const N = 170, H = 11.7, R = .93;
      const paths = [[], []];
      for (let k = 0; k <= N; k++) {
        const t = k / N, angle = t * turns * Math.PI * 2 + phase;
        for (let j = 0; j < 2; j++) {
          paths[j].push(new THREE.Vector3(Math.cos(angle + j * Math.PI) * R, (t - .5) * H, Math.sin(angle + j * Math.PI) * R));
        }
      }
      for (let j = 0; j < 2; j++) {
        const curve = new THREE.CatmullRomCurve3(paths[j]);
        const geometry = track(new THREE.TubeGeometry(curve, 420, .025, 5, false));
        group.add(new THREE.Mesh(geometry, strandMaterial(j === 0 ? '#92cbff' : '#55c9e4', opacity)));
      }
      const beadMaterials = [strandMaterial('#c7e7ff', opacity), strandMaterial('#66dae9', opacity)];
      // Identical rung materials are also shared within each helix.
      const rungMaterial = track(new THREE.LineBasicMaterial({ color: '#8bbfea', transparent: true, opacity: opacity * .48, depthWrite: false }));
      for (let k = 0; k <= N; k += 7) {
        const t = k / N, angle = t * turns * Math.PI * 2 + phase;
        const p1 = new THREE.Vector3(Math.cos(angle) * R, (t - .5) * H, Math.sin(angle) * R);
        const p2 = new THREE.Vector3(-p1.x, p1.y, -p1.z);
        const geometry = track(new THREE.BufferGeometry().setFromPoints([p1, p2]));
        group.add(new THREE.Line(geometry, rungMaterial));
        for (let j = 0; j < 2; j++) {
          const bead = new THREE.Mesh(beadGeometry, beadMaterials[j]);
          bead.position.copy(j === 0 ? p1 : p2);
          group.add(bead);
        }
      }
      root.add(group);
      return { group, speed };
    });

    const networkPoints = [];
    for (let i = 0; i < 84; i++) {
      const angle = i * 2.3999, radius = 3.6 + (i % 13) * .29;
      networkPoints.push(new THREE.Vector3(3.2 + Math.cos(angle) * radius, (i % 27 - 13) * .38, Math.sin(angle) * 2.7 - 3.1));
    }
    const vertex = [], lineSegments = [];
    for (let i = 0; i < networkPoints.length; i++) {
      if (i % 4 !== 0) vertex.push(...networkPoints[i].toArray());
      for (let j = i + 1; j < networkPoints.length; j++) {
        if (networkPoints[i].distanceTo(networkPoints[j]) < 1.65 && (i + j) % 3 === 0) {
          lineSegments.push(...networkPoints[i].toArray(), ...networkPoints[j].toArray());
        }
      }
    }
    const lineGeometry = track(new THREE.BufferGeometry());
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(lineSegments, 3));
    const network = new THREE.LineSegments(lineGeometry, track(new THREE.LineBasicMaterial({ color: 0x74add2, transparent: true, opacity: .17, depthWrite: false })));
    root.add(network);
    const nodeGeometry = track(new THREE.BufferGeometry());
    nodeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertex, 3));
    const particles = new THREE.Points(nodeGeometry, track(new THREE.PointsMaterial({ color: 0x9bd7fc, size: .065, transparent: true, opacity: .65, depthWrite: false, sizeAttenuation: true })));
    root.add(particles);

    const starXYZ = [];
    for (let i = 0; i < 160; i++) {
      const angle = i * 2.4, radius = 3 + i % 16 * .49;
      starXYZ.push(3 + Math.sin(angle) * radius, (i * 11 % 95 - 47) * .15, -7 + (i * 13 % 41) * .17);
    }
    const starGeometry = track(new THREE.BufferGeometry());
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starXYZ, 3));
    const stars = new THREE.Points(starGeometry, track(new THREE.PointsMaterial({ color: '#94c0e5', size: .025, transparent: true, opacity: .47 })));
    scene.add(stars);
    return { scene, root, camera, helices, network, particles, stars, networkPoints, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}

// Called only from a client effect. The returned controller owns every resource.
export function mountGenomicScene(host, { paused = false, reducedMotion = false, onError = () => {} } = {}) {
  const document = host.ownerDocument;
  const view = document.defaultView;
  const interactionHost = host.closest('section') || host;
  let model, renderer, resizeObserver, intersectionObserver;
  let frame = null, disposed = false, elapsed = 0, last = view.performance.now();
  let visible = true;
  const target = { x: 0, y: 0 }, smooth = { x: 0, y: 0 };
  const cleanups = [];
  const listen = (element, type, handler, options) => {
    element.addEventListener(type, handler, options);
    cleanups.push(() => element.removeEventListener(type, handler, options));
  };
  const cancelFrame = () => {
    if (frame !== null) view.cancelAnimationFrame(frame);
    frame = null;
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    cancelFrame();
    cleanups.forEach((cleanup) => cleanup());
    resizeObserver?.disconnect();
    intersectionObserver?.disconnect();
    model?.dispose();
    if (renderer) {
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    }
  };
  const fail = (error) => { dispose(); onError(error); };
  const frozen = () => paused && reducedMotion;
  const canAnimate = () => !disposed && !document.hidden && visible && !frozen();
  const render = () => {
    if (disposed) return;
    renderer.render(model.scene, model.camera);
  };
  const schedule = () => {
    if (frame === null && canAnimate()) frame = view.requestAnimationFrame(animate);
  };
  function animate(now) {
    frame = null;
    if (!canAnimate()) return;
    try {
      const delta = Math.min((now - last) / 1000, .04);
      last = now;
      if (!paused) elapsed += delta;
      smooth.x += (target.x - smooth.x) * .038;
      smooth.y += (target.y - smooth.y) * .038;
      model.root.rotation.y += (smooth.x * .28 - model.root.rotation.y) * .018;
      model.root.rotation.x += (-smooth.y * .16 - model.root.rotation.x) * .018;
      if (!paused) {
        model.helices.forEach((helix, i) => {
          helix.group.rotation.y += helix.speed * delta;
          helix.group.position.y += Math.sin(elapsed * .35 + i * 1.5) * .00032;
        });
        model.network.rotation.y = elapsed * .009;
        model.particles.rotation.y = elapsed * .009;
      }
      render();
      schedule();
    } catch (error) { fail(error); }
  }
  const resetPointer = () => { target.x = 0; target.y = 0; };
  const syncAnimation = () => {
    cancelFrame();
    last = view.performance.now();
    if (!disposed) {
      try { render(); schedule(); } catch (error) { fail(error); }
    }
  };
  const resize = () => {
    if (disposed) return;
    try {
      const width = Math.max(1, host.clientWidth), height = Math.max(1, host.clientHeight);
      model.camera.aspect = width / height;
      model.camera.position.z = width < 750 ? 22 : 17.8;
      model.camera.position.x = width < 750 ? 2.7 : 0;
      model.camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(view.devicePixelRatio || 1, 1.7));
      renderer.setSize(width, height, false);
      render();
    } catch (error) { fail(error); }
  };

  try {
    model = createGenomicModel();
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    host.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    listen(renderer.domElement, 'webglcontextlost', (event) => {
      event.preventDefault();
      fail(new Error('The genomic scene WebGL context was lost.'));
    });
    listen(interactionHost, 'pointermove', (event) => {
      if (event.pointerType === 'touch' || frozen()) return;
      const bounds = host.getBoundingClientRect();
      target.x = Math.max(-.5, Math.min(.5, (event.clientX - bounds.left) / Math.max(1, bounds.width) - .5));
      target.y = Math.max(-.5, Math.min(.5, (event.clientY - bounds.top) / Math.max(1, bounds.height) - .5));
    }, { passive: true });
    listen(interactionHost, 'pointerleave', resetPointer);
    listen(view, 'pointerleave', resetPointer);
    listen(view, 'blur', resetPointer);
    listen(view, 'resize', resize);
    listen(document, 'visibilitychange', syncAnimation);
    if (view.ResizeObserver) {
      resizeObserver = new view.ResizeObserver(resize);
      resizeObserver.observe(host);
    }
    if (view.IntersectionObserver) {
      intersectionObserver = new view.IntersectionObserver((entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        syncAnimation();
      });
      intersectionObserver.observe(host);
    }
    resize();
    if (disposed) throw new Error('Unable to initialize the genomic scene.');
    schedule();
  } catch (error) {
    dispose();
    throw error;
  }

  return {
    setMotion(next) {
      if (disposed) return;
      if (typeof next.paused === 'boolean') paused = next.paused;
      if (typeof next.reducedMotion === 'boolean') reducedMotion = next.reducedMotion;
      if (frozen()) resetPointer();
      syncAnimation();
    },
    dispose,
  };
}
