import test from 'node:test';
import assert from 'node:assert/strict';
import { createGenomicModel, HELIX_CONFIGS } from '../src/lib/genomic-scene.js';

// Numeric fixtures below come from the selected v3 reference, not new artwork.
const referenceHelices = [
  { x: 3, y: 0, z: 0, scale: 1.03, rotate: [0.2, 0, -0.24], phase: 0.3, opacity: 0.91, turns: 3.1, speed: 0.07 },
  { x: 5, y: 0.8, z: -2.6, scale: 0.83, rotate: [0.57, 0.38, 0.42], phase: 2.1, opacity: 0.39, turns: 3.6, speed: -0.043 },
  { x: 1, y: -1.1, z: -3.2, scale: 0.75, rotate: [-0.32, -0.5, -0.66], phase: 3.4, opacity: 0.30, turns: 3, speed: 0.058 },
  { x: 6.2, y: -2.4, z: -4.4, scale: 0.5, rotate: [0.13, 1, 0.5], phase: 1.6, opacity: 0.18, turns: 2.8, speed: -0.032 },
];

function close(actual, expected, tolerance = 1e-6) {
  assert(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);
}

function resources(scene) {
  const geometries = new Set();
  const materials = new Set();
  scene.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (material) materials.add(material);
    }
  });
  return { geometries, materials };
}

test('Genomic model retains the reference camera and four DNA placements', (t) => {
  const model = createGenomicModel();
  t.after(() => model.dispose());
  assert.deepEqual(HELIX_CONFIGS, referenceHelices);
  assert.equal(model.camera.fov, 44);
  assert.equal(model.camera.near, 0.1);
  assert.equal(model.camera.far, 100);
  assert.deepEqual(model.camera.position.toArray(), [0, 0, 17.8]);
  assert.equal(model.helices.length, 4);
  model.helices.forEach(({ group, speed }, index) => {
    const config = referenceHelices[index];
    assert.deepEqual(group.position.toArray(), [config.x, config.y, config.z]);
    assert.deepEqual(group.scale.toArray(), [config.scale, config.scale, config.scale]);
    assert.deepEqual(group.rotation.toArray().slice(0, 3), config.rotate);
    assert.equal(speed, config.speed);
    assert.equal(group.parent, model.root);
  });
  const lights = [];
  model.scene.traverse((object) => { if (object.isLight) lights.push(object); });
  assert.equal(lights.length, 0, 'Reference uses unlit materials and no scene lights');
});

test('DNA geometry, colors, opacity and crossbars match the reference', (t) => {
  const model = createGenomicModel();
  t.after(() => model.dispose());
  const sharedBeadGeometries = new Set();
  model.helices.forEach(({ group }, index) => {
    const strands = group.children.filter((object) => object.geometry?.type === 'TubeGeometry');
    const beads = group.children.filter((object) => object.geometry?.type === 'SphereGeometry');
    const rungs = group.children.filter((object) => object.isLine);
    assert.equal(strands.length, 2);
    assert.equal(beads.length, 50);
    assert.equal(rungs.length, 25);
    strands.forEach((strand, strandIndex) => {
      const { tubularSegments, radius, radialSegments, closed } = strand.geometry.parameters;
      assert.deepEqual([tubularSegments, radius, radialSegments, closed], [420, 0.025, 5, false]);
      assert.equal(strand.material.type, 'MeshBasicMaterial');
      assert.equal(strand.material.color.getHexString(), ['92cbff', '55c9e4'][strandIndex]);
      assert.equal(strand.material.opacity, referenceHelices[index].opacity);
      assert.equal(strand.material.transparent, true);
      assert.equal(strand.material.depthWrite, false);
    });
    for (const bead of beads) {
      sharedBeadGeometries.add(bead.geometry);
      const { radius, widthSegments, heightSegments } = bead.geometry.parameters;
      assert.deepEqual([radius, widthSegments, heightSegments], [0.066, 7, 7]);
    }
    for (const rung of rungs) {
      assert.equal(rung.geometry.getAttribute('position').count, 2);
      close(rung.material.opacity, referenceHelices[index].opacity * 0.48);
      assert.equal(rung.material.color.getHexString(), '8bbfea');
    }
  });
  assert.equal(sharedBeadGeometries.size, 1, 'All equivalent bead geometries can be shared');
});

test('Genomic network preserves the reference 84 positions, 63 nodes and 21 edges', (t) => {
  const model = createGenomicModel();
  t.after(() => model.dispose());
  assert.equal(model.networkPoints.length, 84);
  const positions = model.particles.geometry.getAttribute('position');
  assert.equal(positions.count, 63);
  const visible = model.networkPoints.filter((_, index) => index % 4 !== 0);
  for (let index = 0; index < visible.length; index++) {
    const point = visible[index];
    close(positions.getX(index), point.x);
    close(positions.getY(index), point.y);
    close(positions.getZ(index), point.z);
  }
  const referenceEdges = [[0, 81], [1, 56], [4, 59], [7, 62], [8, 34], [8, 37], [10, 65], [13, 68], [16, 71], [17, 43], [17, 46], [19, 74], [22, 77], [23, 52], [26, 52], [28, 83], [29, 55], [29, 58], [38, 64], [41, 67], [50, 76]];
  const edges = model.network.geometry.getAttribute('position');
  assert.equal(edges.count, referenceEdges.length * 2);
  referenceEdges.flat().forEach((sourceIndex, index) => {
    const point = model.networkPoints[sourceIndex];
    close(edges.getX(index), point.x);
    close(edges.getY(index), point.y);
    close(edges.getZ(index), point.z);
  });
  assert.equal(model.network.material.opacity, 0.17);
  assert.equal(model.network.material.color.getHexString(), '74add2');
  assert.equal(model.particles.material.size, 0.065);
  assert.equal(model.particles.material.opacity, 0.65);
});

test('Ambient particles preserve the reference population and appearance', (t) => {
  const model = createGenomicModel();
  t.after(() => model.dispose());
  const positions = model.stars.geometry.getAttribute('position');
  assert.equal(positions.count, 160);
  assert.equal(model.stars.parent, model.scene);
  assert.equal(model.stars.material.color.getHexString(), '94c0e5');
  assert.equal(model.stars.material.size, 0.025);
  assert.equal(model.stars.material.opacity, 0.47);
});

test('Model disposal releases each shared geometry and material exactly once', () => {
  const model = createGenomicModel();
  const { geometries, materials } = resources(model.scene);
  const counts = new Map();
  for (const resource of [...geometries, ...materials]) {
    counts.set(resource, 0);
    resource.addEventListener('dispose', () => counts.set(resource, counts.get(resource) + 1));
  }
  assert(geometries.size > 0 && materials.size > 0);
  model.dispose();
  model.dispose();
  for (const count of counts.values()) assert.equal(count, 1);
});
