import * as THREE from 'three';

const data = new Uint8Array([70, 150, 255]);
export const gradientMap = new THREE.DataTexture(data, 3, 1, THREE.RedFormat);
gradientMap.minFilter = gradientMap.magFilter = THREE.NearestFilter;
gradientMap.generateMipmaps = false;
gradientMap.needsUpdate = true;

const cache = new Map();
// Material toon bergaya anime, di-cache per warna & opsi
export function toon(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!cache.has(key)) cache.set(key, new THREE.MeshToonMaterial({ color, gradientMap, ...opts }));
  return cache.get(key);
}

export function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
