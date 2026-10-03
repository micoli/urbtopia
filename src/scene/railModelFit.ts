import * as THREE from 'three';

export function fitRailCorner(model: THREE.Object3D): void {
  model.traverse(node => {
    if (!(node instanceof THREE.Mesh)) return;
    const positions = node.geometry.getAttribute('position');
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i) + 2, z = positions.getZ(i);
      const radius = Math.hypot(x, z);
      if (radius < 1e-9) continue;
      const fittedRadius = .5 + (radius - 2) * .7;
      positions.setXYZ(i, -.5 + x / radius * fittedRadius, positions.getY(i), -.5 + z / radius * fittedRadius);
    }
    positions.needsUpdate = true;
    node.geometry.computeVertexNormals();
    node.geometry.computeBoundingBox();
    node.geometry.computeBoundingSphere();
  });
}
