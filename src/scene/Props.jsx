// Properti kecil di adegan: sepatu, pita, kunci, buku, HP, tas, gembok, kertas.
import { memo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { toon } from './materials.js';
import { castPose, ease } from '../engine/build.js';
import { dirFromYaw } from '../engine/camera.js';

function Model({ p }) {
  switch (p.p) {
    case 'shoes':
      return (
        <group>
          {[-0.06, 0.06].map((x) => (
            <group key={x} position={[0, 0, x]} rotation={[0, Math.PI / 2, p.torn && x > 0 ? 0.4 : 0]}>
              <mesh material={toon('#F2EEE6')} castShadow><boxGeometry args={[0.1, 0.07, 0.24]} /></mesh>
              <mesh position={[0, -0.03, 0]} material={toon('#6B5A48')}><boxGeometry args={[0.105, 0.02, 0.245]} /></mesh>
              {p.torn && <mesh position={[0.051, 0.01, 0.02]} material={toon('#2A2020')}><boxGeometry args={[0.005, 0.04, 0.09]} /></mesh>}
            </group>
          ))}
        </group>
      );
    case 'ribbon':
      return (
        <group scale={1.4}>
          <mesh material={toon('#3D7BFF')} rotation={[0, 0, 0.5]}><coneGeometry args={[0.03, 0.07, 4]} /></mesh>
          <mesh material={toon('#3D7BFF')} rotation={[0, 0, -0.5 + Math.PI]} position={[0.05, 0, 0]}><coneGeometry args={[0.03, 0.07, 4]} /></mesh>
          <mesh material={toon('#2A5FD0')} position={[0.025, -0.05, 0]}><boxGeometry args={[0.015, 0.09, 0.005]} /></mesh>
        </group>
      );
    case 'key':
      return (
        <group scale={1.3}>
          <mesh material={toon('#B08A3E', { emissive: '#3A2A08' })}><torusGeometry args={[0.018, 0.005, 6, 14]} /></mesh>
          <mesh material={toon('#B08A3E', { emissive: '#3A2A08' })} position={[0.045, 0, 0]}><boxGeometry args={[0.055, 0.007, 0.004]} /></mesh>
          <mesh material={toon('#B08A3E')} position={[0.065, -0.008, 0]}><boxGeometry args={[0.008, 0.012, 0.004]} /></mesh>
        </group>
      );
    case 'books':
      return (
        <group>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} castShadow material={toon(['#C0392B', '#2E86C1', '#F4D03F', '#27AE60'][i])}
              position={p.scatter ? [Math.sin(i * 2.1) * 0.35, 0.015, Math.cos(i * 1.7) * 0.3] : [0, i * 0.04, 0]}
              rotation={[0, p.scatter ? i * 0.9 : i * 0.05, 0]}>
              <boxGeometry args={[0.22, 0.035, 0.3]} />
            </mesh>
          ))}
        </group>
      );
    case 'papers':
      return (
        <group>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} rotation={[-Math.PI / 2, 0, i * 1.3]} position={[Math.sin(i * 2.3) * 0.35, 0.005 + i * 0.001, Math.cos(i * 1.9) * 0.3]}>
              <planeGeometry args={[0.21, 0.29]} /><meshToonMaterial color="#FAFAF5" side={THREE.DoubleSide} />
            </mesh>
          ))}
        </group>
      );
    case 'phone':
      return (
        <group>
          <mesh material={toon('#222')}><boxGeometry args={[0.07, 0.14, 0.008]} /></mesh>
          <mesh position={[0, 0, 0.0045]}><planeGeometry args={[0.062, 0.128]} /><meshBasicMaterial color={p.screen ? '#9FD0FF' : '#1A1F2E'} /></mesh>
          {p.screen && <mesh position={[0.015, 0.03, 0.005]}><planeGeometry args={[0.012, 0.03]} /><meshBasicMaterial color="#111" /></mesh>}
        </group>
      );
    case 'bag':
      return (
        <group rotation={[0.3, 0.4, 0.2]}>
          <mesh material={toon('#3B2F2A')} castShadow><boxGeometry args={[0.36, 0.26, 0.1]} /></mesh>
          <mesh material={toon('#3B2F2A')} position={[0, 0.17, 0]}><torusGeometry args={[0.07, 0.012, 6, 12, Math.PI]} /></mesh>
        </group>
      );
    case 'padlock':
      return (
        <group>
          <mesh material={toon('#6D6A60')}><boxGeometry args={[0.07, 0.06, 0.03]} /></mesh>
          <mesh material={toon('#8F8B80')} position={[0, 0.04, 0]}><torusGeometry args={[0.022, 0.005, 6, 12, Math.PI]} /></mesh>
        </group>
      );
    default:
      return null;
  }
}

function Prop({ p, shot, store }) {
  const ref = useRef();
  useFrame(() => {
    const f = store.frame;
    if (!f || !ref.current) return;
    const o = ref.current;
    if (p.follow && shot.cast[p.follow]) {
      const c = shot.cast[p.follow];
      const pose = castPose(c, f.lt, shot.d);
      const d = dirFromYaw(pose.yaw);
      const low = ['pickup'].includes(c.anim);
      o.position.set(pose.x + d.x * 0.3, low ? 0.35 : 1.05, pose.z + d.z * 0.3);
      o.rotation.set(-0.3, pose.yaw * Math.PI / 180, 0);
      return;
    }
    const k = p.to ? ease(f.lt / (p.dur || shot.d * 0.7)) : 0;
    const a = p.at;
    const b = p.to || a;
    o.position.set(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k + (p.to ? Math.sin(k * Math.PI) * 0.4 : 0), a[2] + (b[2] - a[2]) * k);
    o.rotation.set(p.spin ? f.t * 5 : 0, p.spin ? f.t * 3 : 0, 0);
  });
  return <group ref={ref}><Model p={p} /></group>;
}

export const Props = memo(function Props({ shot, store }) {
  return <>{shot.props.map((p, i) => <Prop key={`${shot.i}-${i}`} p={p} shot={shot} store={store} />)}</>;
});
