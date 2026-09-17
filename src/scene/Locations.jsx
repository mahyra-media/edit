// Lokasi versi blockout (bentuk dasar). Ganti dengan model .glb buatan sendiri
// kapan saja: cukup render <primitive object={gltf.scene}/> di komponen lokasinya.
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { toon, canvasTexture } from './materials.js';
import { ease } from '../engine/build.js';

const Box = ({ p = [0, 0, 0], s = [1, 1, 1], c = '#ccc', r = [0, 0, 0], shadow = true, mat }) => (
  <mesh position={p} rotation={r} material={mat || toon(c)} castShadow={shadow} receiveShadow>
    <boxGeometry args={s} />
  </mesh>
);
const Plane = ({ p = [0, 0, 0], s = [1, 1], r = [0, 0, 0], c = '#ccc', map, basic, transparent, opacity = 1 }) => (
  <mesh position={p} rotation={r} receiveShadow>
    <planeGeometry args={s} />
    {basic
      ? <meshBasicMaterial color={map ? '#fff' : c} map={map} transparent={transparent} opacity={opacity} side={THREE.DoubleSide} depthWrite={!transparent} />
      : <meshToonMaterial color={map ? '#fff' : c} map={map} />}
  </mesh>
);
const FLOOR = [-Math.PI / 2, 0, 0];

function useTex(key, w, h, draw, repeat) {
  return useMemo(() => {
    const t = canvasTexture(w, h, draw);
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
    return t;
  }, [key]);
}

const drawWood = (g, w, h) => {
  for (let i = 0; i < 8; i++) {
    g.fillStyle = i % 2 ? '#B98A5E' : '#C49668';
    g.fillRect(0, (i * h) / 8, w, h / 8);
    g.fillStyle = 'rgba(80,50,25,.3)';
    g.fillRect(0, ((i + 1) * h) / 8 - 1, w, 1);
    g.fillRect((i * 77) % w, (i * h) / 8, 1, h / 8);
  }
};
const drawTiles = (g, w, h) => {
  g.fillStyle = '#E4E2DC'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#BDB9AF'; g.lineWidth = 2;
  for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo((i * w) / 4, 0); g.lineTo((i * w) / 4, h); g.moveTo(0, (i * h) / 4); g.lineTo(w, (i * h) / 4); g.stroke(); }
};
const drawSky = (top, bottom) => (g, w, h) => {
  const grd = g.createLinearGradient(0, 0, 0, h);
  grd.addColorStop(0, top); grd.addColorStop(1, bottom);
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,.85)';
  g.beginPath(); g.ellipse(w * 0.3, h * 0.3, w * 0.18, h * 0.06, 0, 0, 7); g.ellipse(w * 0.7, h * 0.55, w * 0.14, h * 0.05, 0, 0, 7); g.fill();
};
const sign = (text, sub, bg = '#1E2A45', fg = '#F5F1E6') => (g, w, h) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `800 ${Math.floor(h * 0.42)}px 'M PLUS Rounded 1c', sans-serif`;
  g.fillText(text, w / 2, sub ? h * 0.38 : h / 2);
  if (sub) { g.font = `500 ${Math.floor(h * 0.2)}px 'M PLUS Rounded 1c', sans-serif`; g.fillText(sub, w / 2, h * 0.76); }
};

function SakuraTree({ p, scale = 1 }) {
  return (
    <group position={p} scale={scale}>
      <Box p={[0, 1.2, 0]} s={[0.25, 2.4, 0.25]} c="#5B4034" />
      <mesh position={[0, 2.8, 0]} material={toon('#F6B4C8')} castShadow><sphereGeometry args={[1.2, 14, 10]} /></mesh>
      <mesh position={[0.8, 2.5, 0.3]} material={toon('#F9C8D6')} castShadow><sphereGeometry args={[0.8, 12, 8]} /></mesh>
      <mesh position={[-0.7, 2.6, -0.3]} material={toon('#F3A5BE')} castShadow><sphereGeometry args={[0.85, 12, 8]} /></mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
function JalanSakura() {
  const gate = useTex('gate', 512, 128, sign('AKADEMI SEIRAN', 'Harumi'));
  const trees = [];
  for (let z = -24; z <= 8; z += 3.2) { trees.push([-3.2, 0, z]); trees.push([3.2, 0, z + 1.4]); }
  return (
    <group>
      <Plane p={[0, 0, -8]} s={[60, 60]} r={FLOOR} c="#8CC58B" />
      <Plane p={[0, 0.01, -8]} s={[3.4, 40]} r={FLOOR} c="#9A9AA3" />
      <Plane p={[-2.1, 0.02, -8]} s={[0.8, 40]} r={FLOOR} c="#D6CFC2" />
      <Plane p={[2.1, 0.02, -8]} s={[0.8, 40]} r={FLOOR} c="#D6CFC2" />
      {trees.map((p, i) => <SakuraTree key={i} p={p} scale={0.9 + (i % 3) * 0.1} />)}
      <Box p={[-2.2, 1.5, -16]} s={[0.6, 3, 0.6]} c="#D8D2C4" />
      <Box p={[2.2, 1.5, -16]} s={[0.6, 3, 0.6]} c="#D8D2C4" />
      <Plane p={[0, 3.3, -16]} s={[4, 1]} map={gate} basic />
      <Box p={[0, 4, -28]} s={[22, 8, 6]} c="#EFE9DC" />
      {[-7, -3.5, 0, 3.5, 7].map((x) => [2, 4.5, 6.5].map((y) => <Plane key={`${x}${y}`} p={[x, y, -24.95]} s={[2.4, 1.2]} c="#8FB8D8" basic />))}
      <Box p={[0, 9, -28]} s={[3, 2, 3]} c="#D9D2C4" />
    </group>
  );
}

function Genkan() {
  const tiles = useTex('tiles', 256, 256, drawTiles, [4, 4]);
  const outside = useTex('outside', 128, 128, drawSky('#9FD2FF', '#E8F6FF'));
  const lockers = [];
  for (let z = -2.4; z <= 1.8; z += 0.46) {
    for (let y = 0.25; y <= 2.0; y += 0.43) lockers.push([z, y]);
  }
  return (
    <group>
      <Plane p={[0, 0, 0]} s={[5, 7]} r={FLOOR} map={tiles} />
      <Plane p={[0, 1.6, -3]} s={[5, 3.2]} c="#EAE3D2" />
      <Plane p={[0, 1.3, -2.98]} s={[2.4, 2.4]} map={outside} basic />
      <Box p={[0, 1.3, -2.95]} s={[0.06, 2.4, 0.04]} c="#9AA3AD" />
      <Plane p={[-2.4, 1.6, 0.5]} s={[7, 3.2]} r={[0, Math.PI / 2, 0]} c="#E2DACB" />
      <Plane p={[2.4, 1.6, 0.5]} s={[7, 3.2]} r={[0, -Math.PI / 2, 0]} c="#E2DACB" />
      <Plane p={[0, 3.2, 0.5]} s={[5, 7]} r={[Math.PI / 2, 0, 0]} c="#F4F1EA" />
      {lockers.map(([z, y], i) => (
        <group key={i}>
          <Box p={[-2.16, y, z]} s={[0.44, 0.4, 0.44]} c={Math.abs(z + 0.4) < 0.1 && Math.abs(y - 1.11) < 0.1 ? '#C7B38E' : '#A9B4BF'} />
          <Box p={[-1.935, y + 0.08, z + 0.15]} s={[0.02, 0.05, 0.03]} c="#556" shadow={false} />
        </group>
      ))}
      <Box p={[1.5, 0.22, -1.8]} s={[1.6, 0.08, 0.45]} c="#B98A5E" />
      <Box p={[1.5, 0.1, -1.8]} s={[1.5, 0.2, 0.08]} c="#8A6A45" />
    </group>
  );
}

function Lorong() {
  const wood = useTex('wood-lorong', 256, 256, drawWood, [2, 10]);
  const sky = useTex('sky-lorong', 128, 128, drawSky('#8EC8FF', '#E3F3FF'));
  const plate = useTex('plate', 256, 64, sign('1-A', null, '#F4F1EA', '#23305A'));
  const zs = [-10, -7, -4, -1, 2, 5];
  return (
    <group>
      <Plane p={[0, 0, -3]} s={[3.2, 20]} r={FLOOR} map={wood} />
      <Plane p={[0, 3, -3]} s={[3.2, 20]} r={[Math.PI / 2, 0, 0]} c="#F4F1EA" />
      <Plane p={[-1.6, 1.5, -3]} s={[20, 3]} r={[0, Math.PI / 2, 0]} c="#EAE3D2" />
      <Plane p={[1.6, 1.5, -3]} s={[20, 3]} r={[0, -Math.PI / 2, 0]} c="#E6DECD" />
      <Plane p={[0, 1.5, -13]} s={[3.2, 3]} c="#EAE3D2" />
      <Plane p={[0, 1.7, -12.98]} s={[1.6, 1.3]} map={sky} basic />
      <Plane p={[0, 1.5, 7]} s={[3.2, 3]} r={[0, Math.PI, 0]} c="#EAE3D2" />
      {zs.map((z) => (
        <group key={z}>
          <Plane p={[-1.59, 1.75, z]} s={[2.2, 1.3]} r={[0, Math.PI / 2, 0]} map={sky} basic />
          <Box p={[-1.57, 1.1, z]} s={[0.06, 0.05, 2.3]} c="#D0D0D0" />
          <Box p={[1.57, 1.0, z + 1]} s={[0.05, 2.0, 0.95]} c="#A27A52" />
          <Plane p={[1.54, 2.25, z + 1]} s={[0.5, 0.13]} r={[0, -Math.PI / 2, 0]} map={plate} basic />
          <Box p={[0, 2.97, z]} s={[0.25, 0.04, 1.2]} mat={new THREE.MeshBasicMaterial({ color: '#FFFFFF' })} shadow={false} />
        </group>
      ))}
      <Box p={[-1.6, 0.06, -3]} s={[0.04, 0.12, 20]} c="#8A6A45" shadow={false} />
      <Box p={[1.6, 0.06, -3]} s={[0.04, 0.12, 20]} c="#8A6A45" shadow={false} />
    </group>
  );
}

function Desk({ x, z }) {
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, 0.72, -0.45]} s={[0.62, 0.04, 0.45]} c="#C79A6A" />
      {[[-0.27, -0.64], [0.27, -0.64], [-0.27, -0.26], [0.27, -0.26]].map(([a, b], i) => <Box key={i} p={[a, 0.35, b]} s={[0.03, 0.7, 0.03]} c="#6C7385" shadow={false} />)}
      <Box p={[0, 0.44, 0.02]} s={[0.4, 0.03, 0.38]} c="#C79A6A" />
      <Box p={[0, 0.7, 0.22]} s={[0.4, 0.28, 0.03]} c="#C79A6A" />
      {[[-0.17, -0.14], [0.17, -0.14], [-0.17, 0.18], [0.17, 0.18]].map(([a, b], i) => <Box key={i} p={[a, 0.22, b]} s={[0.025, 0.44, 0.025]} c="#6C7385" shadow={false} />)}
    </group>
  );
}

function Kelas() {
  const wood = useTex('wood-kelas', 256, 256, drawWood, [3, 3]);
  const sky = useTex('sky-kelas', 128, 128, drawSky('#8EC8FF', '#E3F3FF'));
  const board = useTex('board', 512, 200, (g, w, h) => {
    g.fillStyle = '#2E5446'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#F3F1E7'; g.font = "800 40px 'M PLUS Rounded 1c', sans-serif"; g.fillText('Selamat datang, Kelas 1-A', 24, 60);
    g.font = "500 26px 'M PLUS Rounded 1c', sans-serif"; g.fillText('Hari ini: Matematika · Sastra · Musik', 26, 120);
    g.fillStyle = '#F4D35E'; g.fillText('Piket: Ozaki, Nakamura', 26, 164);
  });
  const desks = [];
  for (const x of [-2.2, -1.1, 1.1, 2.2]) for (const z of [-0.6, 0.5, 1.6]) desks.push([x, z]);
  return (
    <group>
      <Plane p={[0, 0, 0]} s={[6.4, 7]} r={FLOOR} map={wood} />
      <Plane p={[0, 3, 0]} s={[6.4, 7]} r={[Math.PI / 2, 0, 0]} c="#F4F1EA" />
      <Plane p={[0, 1.5, -3.5]} s={[6.4, 3]} c="#EAE3D2" />
      <Plane p={[0, 1.5, 3.5]} s={[6.4, 3]} r={[0, Math.PI, 0]} c="#EAE3D2" />
      <Plane p={[-3.2, 1.5, 0]} s={[7, 3]} r={[0, Math.PI / 2, 0]} c="#EAE3D2" />
      <Plane p={[3.2, 1.5, 0]} s={[7, 3]} r={[0, -Math.PI / 2, 0]} c="#E6DECD" />
      <Plane p={[0, 1.75, -3.47]} s={[3, 1.15]} map={board} basic />
      <Box p={[0, 1.75, -3.49]} s={[3.14, 1.29, 0.03]} c="#8A6A45" shadow={false} />
      {[-2, 0, 2].map((z) => <Plane key={z} p={[-3.19, 1.7, z]} s={[1.5, 1.3]} r={[0, Math.PI / 2, 0]} map={sky} basic />)}
      <Box p={[3.17, 1.0, -2.4]} s={[0.05, 2, 0.9]} c="#A27A52" />
      <Box p={[1.1, 0.5, -2.95]} s={[1.2, 1.0, 0.5]} c="#9C7B58" />
      {desks.map(([x, z]) => <Desk key={`${x}${z}`} x={x} z={z} />)}
      {[-1.2, 1.2].map((x) => <Box key={x} p={[x, 2.97, 0]} s={[0.2, 0.04, 1.4]} mat={new THREE.MeshBasicMaterial({ color: '#FFFFFF' })} shadow={false} />)}
    </group>
  );
}

function Atap() {
  const fence = useTex('fence', 128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = '#6F8A7E'; g.lineWidth = 3;
    for (let i = -w; i < w * 2; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.moveTo(i + h, 0); g.lineTo(i, h); g.stroke(); }
  }, [8, 1]);
  const concrete = useTex('concrete', 256, 256, (g, w, h) => {
    g.fillStyle = '#B7B5AE'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,.06)';
    for (let i = 0; i < 300; i++) g.fillRect((i * 97) % w, (i * 57) % h, 3, 3);
    g.strokeStyle = 'rgba(0,0,0,.15)'; g.strokeRect(0, 0, w, h);
  }, [5, 5]);
  const fenceSides = [
    { p: [0, 1.1, -2.6], r: [0, 0, 0], w: 12 },
    { p: [-6, 1.1, 2.4], r: [0, Math.PI / 2, 0], w: 10 },
    { p: [6, 1.1, 2.4], r: [0, -Math.PI / 2, 0], w: 10 },
  ];
  return (
    <group>
      <Plane p={[0, 0, 2]} s={[12, 10]} r={FLOOR} map={concrete} />
      {fenceSides.map((f, i) => (
        <group key={i} position={f.p} rotation={f.r}>
          <mesh><planeGeometry args={[f.w, 2.2]} /><meshBasicMaterial map={fence} transparent side={THREE.DoubleSide} depthWrite={false} /></mesh>
          <Box p={[0, 1.1, 0]} s={[f.w, 0.06, 0.06]} c="#6F8A7E" />
          <Box p={[0, -1.08, 0]} s={[f.w, 0.06, 0.06]} c="#6F8A7E" />
          {Array.from({ length: Math.floor(f.w / 1.5) + 1 }, (_, k) => <Box key={k} p={[-f.w / 2 + k * 1.5, 0, 0]} s={[0.06, 2.2, 0.06]} c="#6F8A7E" />)}
        </group>
      ))}
      <Box p={[3.8, 1.4, 4.8]} s={[2.4, 2.8, 2]} c="#D9D2C4" />
      <Box p={[3.8, 1.0, 3.79]} s={[0.9, 2, 0.04]} c="#7D8A96" />
      <mesh position={[-4.2, 1.2, 5]} material={toon('#C9CED6')} castShadow><cylinderGeometry args={[0.9, 0.9, 1.6, 20]} /></mesh>
      <Plane p={[0, -14, -60]} s={[400, 120]} r={FLOOR} c="#3E8FC4" basic />
      {[-24, -16, -9, -3, 4, 11, 18, 26].map((x, i) => <Box key={x} p={[x, -8 + (i % 3) * 1.5, -34 - (i % 2) * 6]} s={[4, 12 + (i % 4) * 2, 4]} c={['#D7DEE6', '#C4CCD6', '#E5E1D8'][i % 3]} shadow={false} />)}
    </group>
  );
}

function GudangLuar({ store, ep }) {
  const door = useRef();
  const signTex = useTex('klub', 512, 128, sign('KLUB MUSIK', 'DILARANG MASUK', '#4A3A2E', '#F2E6CF'));
  const tape = useTex('tape', 256, 32, (g, w, h) => {
    for (let i = 0; i < w; i += 32) { g.fillStyle = (i / 32) % 2 ? '#F2C230' : '#1B1B1B'; g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 32, 0); g.lineTo(i + 16, h); g.lineTo(i - 16, h); g.fill(); }
  });
  useFrame(() => {
    const f = store.frame;
    if (!f || !door.current) return;
    const s = ep.shots[f.i];
    const a = s.door === 'open' ? 1 : s.door === 'opening' ? ease((f.lt - 0.3) / 2.2) : 0;
    door.current.rotation.y = -a * 1.7;
  });
  return (
    <group>
      <Plane p={[0, 0, 0]} s={[40, 40]} r={FLOOR} c="#7FAE6E" />
      <Box p={[0, 5, -12]} s={[30, 10, 4]} c="#E8E0CF" />
      {[-9, -4.5, 0, 4.5, 9].map((x) => [3, 6.5].map((y) => <Plane key={`${x}${y}`} p={[x, y, -9.98]} s={[2.4, 1.4]} c="#F5B98A" basic />))}
      <Box p={[0, 1.3, -3.25]} s={[3.2, 2.6, 3]} c="#7A5C45" />
      <Box p={[0, 2.75, -3.25]} s={[3.6, 0.2, 3.4]} r={[0.12, 0, 0]} c="#4B3A30" />
      <Plane p={[0, 2.35, -1.74]} s={[1.8, 0.45]} map={signTex} basic />
      <group ref={door} position={[-0.5, 0, -1.72]}>
        <Box p={[0.5, 1.0, 0]} s={[1.0, 2.0, 0.06]} c="#5E4636" />
        <Box p={[0.5, 1.4, 0.04]} s={[0.9, 0.05, 0.02]} c="#3C2C22" shadow={false} />
        <Box p={[0.5, 0.6, 0.04]} s={[0.9, 0.05, 0.02]} c="#3C2C22" shadow={false} />
        <mesh position={[0.5, 1.15, 0.05]} rotation={[0, 0, -0.35]}><planeGeometry args={[1.2, 0.12]} /><meshBasicMaterial map={tape} /></mesh>
      </group>
      <Plane p={[0, 1.0, -1.75]} s={[1.0, 2.0]} c="#0A0806" basic />
      <SakuraTree p={[-2.95, 0, -0.75]} scale={1.05} />
      <Box p={[2.4, 0.4, -1.4]} s={[0.8, 0.8, 0.8]} c="#8E7358" />
      <Box p={[2.6, 0.25, -0.5]} s={[0.5, 0.5, 0.5]} c="#8E7358" />
    </group>
  );
}

function GudangDalam({ store, ep }) {
  const cover = useRef();
  const wood = useTex('wood-gudang', 256, 256, (g, w, h) => { drawWood(g, w, h); g.fillStyle = 'rgba(40,30,20,.45)'; g.fillRect(0, 0, w, h); }, [3, 3]);
  const keys = useTex('keys', 512, 64, (g, w, h) => {
    g.fillStyle = '#F3EFE4'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#999'; for (let i = 0; i < w; i += 14) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); }
    g.fillStyle = '#111'; for (let i = 0, k = 0; i < w; i += 14, k++) if ([0, 1, 3, 4, 5].includes(k % 7)) g.fillRect(i + 9, 0, 9, h * 0.6);
  });
  const photo = useTex('photo', 256, 320, (g, w, h) => {
    g.fillStyle = '#E9DFC8'; g.fillRect(0, 0, w, h);
    const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, '#CFE3F2'); grd.addColorStop(1, '#F2E6D3');
    g.fillStyle = grd; g.fillRect(14, 14, w - 28, h - 70);
    g.fillStyle = '#2B2233'; g.beginPath(); g.ellipse(w / 2, 120, 66, 76, 0, 0, 7); g.fill(); g.fillRect(w / 2 - 66, 120, 132, 110);
    g.fillStyle = '#F7DCC8'; g.beginPath(); g.ellipse(w / 2, 132, 46, 54, 0, 0, 7); g.fill();
    g.fillStyle = '#F4F1EA'; g.beginPath(); g.moveTo(40, h - 56); g.quadraticCurveTo(w / 2, 170, w - 40, h - 56); g.fill();
    g.fillStyle = '#3D7BFF'; g.fillRect(w / 2 + 30, 64, 40, 16); g.beginPath(); g.arc(w / 2 + 50, 72, 12, 0, 7); g.fill();
    g.strokeStyle = '#2a1f2f'; g.lineWidth = 3; g.beginPath(); g.arc(w / 2, 146, 14, 0.2, Math.PI - 0.2); g.stroke();
    g.fillStyle = '#6B5A48'; g.font = "500 22px 'M PLUS Rounded 1c', sans-serif"; g.textAlign = 'center'; g.fillText('Klub Musik Seiran', w / 2, h - 24);
  });
  const moon = useTex('moonwin', 128, 128, drawSky('#1B2A55', '#5A6E9E'));
  useFrame(() => {
    const f = store.frame;
    if (!f || !cover.current) return;
    const s = ep.shots[f.i];
    const k = s.cover === 'removing' ? ease((f.lt - 0.2) / 1.2) : s.cover === 'on' ? 0 : 1;
    cover.current.visible = k < 1;
    cover.current.position.set(0, 0.58 + k * 0.9, -1.25 + k * 1.1);
    cover.current.rotation.x = -k * 1.2;
    cover.current.scale.setScalar(1 - k * 0.3);
  });
  return (
    <group>
      <Plane p={[0, 0, 0.8]} s={[6, 6]} r={FLOOR} map={wood} />
      <Plane p={[0, 2.8, 0.8]} s={[6, 6]} r={[Math.PI / 2, 0, 0]} c="#2A2420" />
      <Plane p={[0, 1.4, -2.2]} s={[6, 2.8]} c="#4A4038" />
      <Plane p={[-3, 1.4, 0.8]} s={[6, 2.8]} r={[0, Math.PI / 2, 0]} c="#433A33" />
      <Plane p={[3, 1.4, 0.8]} s={[6, 2.8]} r={[0, -Math.PI / 2, 0]} c="#433A33" />
      <Plane p={[0, 1.4, 3.8]} s={[6, 2.8]} r={[0, Math.PI, 0]} c="#433A33" />
      <Plane p={[0, 1.0, 3.78]} s={[1.0, 2.0]} r={[0, Math.PI, 0]} c="#FFD9A8" basic />
      <Plane p={[-2.98, 1.8, -0.4]} s={[1.0, 0.8]} r={[0, Math.PI / 2, 0]} map={moon} basic />
      {/* sinar dari jendela */}
      <mesh position={[-1.9, 1.1, -0.4]} rotation={[0, 0, 0.9]}>
        <planeGeometry args={[2.8, 0.7]} />
        <meshBasicMaterial color="#9FB6FF" transparent opacity={0.12} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* piano tegak */}
      <group position={[0, 0, -1.25]}>
        <Box p={[0, 0.55, -0.1]} s={[1.5, 1.1, 0.45]} c="#1C1512" />
        <Box p={[0, 0.72, 0.2]} s={[1.5, 0.08, 0.3]} c="#1C1512" />
        <mesh position={[0, 0.77, 0.22]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.36, 0.16]} /><meshToonMaterial map={keys} /></mesh>
        <Box p={[-0.72, 0.35, 0.25]} s={[0.06, 0.7, 0.1]} c="#1C1512" />
        <Box p={[0.72, 0.35, 0.25]} s={[0.06, 0.7, 0.1]} c="#1C1512" />
        <group position={[0.45, 1.25, 0]} rotation={[-0.12, -0.25, 0]}>
          <Box p={[0, 0, -0.01]} s={[0.26, 0.32, 0.02]} c="#8A6A45" shadow={false} />
          <Plane p={[0, 0, 0.002]} s={[0.22, 0.28]} map={photo} basic />
        </group>
      </group>
      <Box p={[0, 0.22, -0.6]} s={[0.55, 0.44, 0.34]} c="#2E2420" />
      <group ref={cover}>
        <Box p={[0, 0, 0]} s={[1.7, 1.25, 0.9]} c="#E9E6DE" />
      </group>
      {/* alat musik tertutup kain */}
      <Box p={[-2.2, 0.5, -1.4]} s={[1.1, 1.0, 0.9]} c="#DAD6CC" />
      <mesh position={[2.1, 0.45, -1.2]} material={toon('#DAD6CC')} castShadow><cylinderGeometry args={[0.5, 0.6, 0.9, 16]} /></mesh>
      <Box p={[2.5, 1.0, 1.2]} s={[0.4, 2.0, 1.6]} c="#3A2E26" />
      {[0.5, 1.1, 1.7].map((y) => <Box key={y} p={[2.35, y, 1.2]} s={[0.35, 0.3, 1.4]} c={['#6B4E3D', '#C9B79C', '#8A6A45'][Math.round(y) % 3]} />)}
    </group>
  );
}

const MAP = { jalan_sakura: JalanSakura, genkan: Genkan, lorong: Lorong, kelas: Kelas, atap: Atap, gudang_luar: GudangLuar, gudang_dalam: GudangDalam };

export function Location({ id, visible, store, ep }) {
  const C = MAP[id];
  if (!C) return null;
  return <group visible={visible}><C store={store} ep={ep} /></group>;
}
