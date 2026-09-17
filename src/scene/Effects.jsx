// Partikel deterministik (bergantung waktu episode) supaya seek & rekam konsisten.
import { memo, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const rand = (i, s) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };

function Petals({ store }) {
  const N = 180;
  const ref = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const geo = useMemo(() => new THREE.CircleGeometry(0.035, 5).scale(1, 0.6, 1), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#F9B8CC', side: THREE.DoubleSide }), []);
  useFrame(() => {
    const t = store.frame?.t ?? 0;
    for (let i = 0; i < N; i++) {
      const sp = 0.35 + rand(i, 1) * 0.35;
      const y = 4.2 - ((t * sp + rand(i, 2) * 4.2) % 4.2);
      dummy.position.set(
        (rand(i, 3) - 0.5) * 9 + Math.sin(t * 0.8 + i) * 0.4,
        y,
        (rand(i, 4) - 0.5) * 9,
      );
      dummy.rotation.set(t * 2 + i, t * 1.3 + i * 0.5, 0);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mat, N]} frustumCulled={false} />;
}

function Rain({ store }) {
  const N = 900;
  const ref = useRef();
  const base = useMemo(() => Array.from({ length: N }, (_, i) => [(rand(i, 5) - 0.5) * 12, rand(i, 6) * 6, (rand(i, 7) - 0.5) * 12, 7 + rand(i, 8) * 3]), []);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 6), 3));
    return g;
  }, []);
  useFrame(() => {
    const t = store.frame?.t ?? 0;
    const a = geo.attributes.position.array;
    base.forEach(([x, y0, z, sp], i) => {
      const y = 6 - ((t * sp + y0) % 6);
      a.set([x, y, z, x - 0.02, y - 0.25, z], i * 6);
    });
    geo.attributes.position.needsUpdate = true;
  });
  return (
    <lineSegments ref={ref} geometry={geo} frustumCulled={false}>
      <lineBasicMaterial color="#C8D6E8" transparent opacity={0.55} />
    </lineSegments>
  );
}

function Dust({ store }) {
  const N = 260;
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    return g;
  }, []);
  useFrame(() => {
    const t = store.frame?.t ?? 0;
    const a = geo.attributes.position.array;
    for (let i = 0; i < N; i++) {
      a[i * 3] = (rand(i, 9) - 0.5) * 5 + Math.sin(t * 0.3 + i) * 0.2;
      a[i * 3 + 1] = 0.2 + ((rand(i, 10) * 2.6 + t * 0.03) % 2.6);
      a[i * 3 + 2] = (rand(i, 11) - 0.5) * 5 + Math.cos(t * 0.25 + i) * 0.2;
    }
    geo.attributes.position.needsUpdate = true;
  });
  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial color="#FFF3D6" size={0.018} transparent opacity={0.7} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

// Semua efek selalu terpasang (shader sudah siap), hanya disembunyikan kalau tidak dipakai.
export const Effects = memo(function Effects({ fx, store, used }) {
  return (
    <>
      {used.includes('petals') && <group visible={fx.includes('petals')}><Petals store={store} /></group>}
      {used.includes('rain') && <group visible={fx.includes('rain')}><Rain store={store} /></group>}
      {used.includes('dust') && <group visible={fx.includes('dust')}><Dust store={store} /></group>}
    </>
  );
});
