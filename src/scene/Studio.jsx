// Panggung.
// Preview: kanvas WebGL ditampilkan langsung + kanvas teks transparan di atasnya (ringan).
// Render/screenshot: 3D + teks digabung ke kanvas komposit 1080x1920 (hanya saat diperlukan).
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { LOCATIONS, MOODS } from '../data/locations.js';
import { shotIndexAt } from '../engine/build.js';
import { computeCamera } from '../engine/camera.js';
import { drawFrame, W, H, SAFE } from '../overlay/draw.js';
import { Character } from './Character.jsx';
import { Location } from './Locations.jsx';
import { Effects } from './Effects.jsx';
import { Props } from './Props.jsx';

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

const Lights = memo(function Lights({ mood }) {
  const m = MOODS[mood] || MOODS.dalam;
  const sun = useRef();
  useEffect(() => {
    const s = sun.current;
    if (!s) return;
    s.shadow.mapSize.set(2048, 2048);
    Object.assign(s.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 0.5, far: 30 });
    s.shadow.camera.updateProjectionMatrix();
    s.shadow.bias = -0.0008;
    s.shadow.normalBias = 0.02;
  }, []);
  return (
    <>
      <color attach="background" args={[m.bg]} />
      <hemisphereLight args={[m.hemi[0], m.hemi[1], m.hemi[2] * 1.6]} />
      <directionalLight ref={sun} color={m.sun[0]} intensity={m.sun[1] * 2.2} position={m.sun[2]} castShadow />
    </>
  );
});

function World({ ep, store, audio, overlay, composite, onStatus }) {
  const { gl, scene, camera, advance } = useThree();
  const [idx, setIdx] = useState(0);
  const idxRef = useRef(-1);
  const locRoot = useRef();
  const g2d = useMemo(() => overlay.getContext('2d'), [overlay]);
  const c2d = useMemo(() => composite.getContext('2d', { alpha: false }), [composite]);
  const usedFx = useMemo(() => [...new Set(ep.shots.flatMap((s) => s.fx))], [ep]);

  // render satu frame pada waktu tertentu (render MP4) & screenshot
  useEffect(() => {
    store.renderAt = async (t) => {
      store.t = t;
      store.wantComposite = true;
      advance(t);
      store.wantComposite = false;
    };
    store.snapshot = async () => {
      store.wantComposite = true;
      await nextFrame();
      await nextFrame();
      store.wantComposite = false;
      return composite;
    };
    return () => { store.renderAt = null; store.snapshot = null; };
  }, [store, advance, composite]);

  // siapkan shader semua lokasi di awal supaya tidak tersendat saat pindah adegan
  useEffect(() => {
    const warm = () => {
      const root = locRoot.current;
      if (!root) return;
      const prev = root.children.map((c) => c.visible);
      root.children.forEach((c) => { c.visible = true; });
      try { gl.compile(scene, camera); } catch { /* abaikan */ }
      root.children.forEach((c, i) => { c.visible = prev[i]; });
    };
    const timers = [100, 2500, 6000, 12000].map((ms) => setTimeout(warm, ms));
    return () => timers.forEach(clearTimeout);
  }, [ep, gl, scene, camera]);

  useFrame(() => {
    let t = store.playing ? audio.time() : store.t;
    if (store.playing && t >= ep.total) {
      t = ep.total - 0.001;
      store.playing = false;
      store.onEnd?.();
    }
    t = Math.max(0, Math.min(ep.total - 0.001, t));
    if (store.playing) store.t = t;
    const i = shotIndexAt(ep, t);
    if (i !== idxRef.current) { idxRef.current = i; setIdx(i); }
    const shot = ep.shots[i];
    const lt = t - shot.t;
    store.frame = { t, i, lt };

    const ov = store.overrides?.[ep.id]?.[i] || {};
    const c = computeCamera(shot, lt, t, ov);
    camera.position.copy(c.pos);
    camera.lookAt(c.look);
    if (camera.fov !== c.fov) { camera.fov = c.fov; camera.updateProjectionMatrix(); }

    gl.render(scene, camera);
    g2d.clearRect(0, 0, W, H);
    drawFrame(g2d, null, { ep, shot, lt, camera });
    if (store.wantComposite || store.recording) drawFrame(c2d, gl.domElement, { ep, shot, lt, camera });
  }, 1);

  const shot = ep.shots[Math.min(idx, ep.shots.length - 1)];
  const mood = shot.mood || LOCATIONS[shot.loc].mood;
  return (
    <>
      <Lights mood={mood} />
      <group ref={locRoot}>
        {ep.locIds.map((id) => <Location key={id} id={id} visible={id === shot.loc} store={store} ep={ep} />)}
      </group>
      {ep.castIds.map((id) => <Character key={id} id={id} ep={ep} store={store} audio={audio} onStatus={onStatus} />)}
      <Effects fx={shot.fx} store={store} used={usedFx} />
      <Props shot={shot} store={store} />
    </>
  );
}

function SafeZone() {
  const pct = (v, total) => `${(v / total) * 100}%`;
  return (
    <div className="safe" aria-hidden="true">
      <div className="safe-top" style={{ height: pct(SAFE.top, H) }}><span>tertutup UI atas</span></div>
      <div className="safe-bottom" style={{ top: pct(SAFE.bottom, H) }}><span>judul, deskripsi, musik</span></div>
      <div className="safe-right" style={{ top: pct(1000, H), bottom: pct(H - SAFE.bottom, H), width: pct(150, W) }}><span>tombol</span></div>
    </div>
  );
}

export const Studio = memo(function Studio({ ep, store, audio, onStatus, compositeRef, quality = 1, showSafe = false, frameloop = 'always', sepia = false }) {
  const stageRef = useRef(null);
  const [scale, setScale] = useState(0.4);
  const [overlay, setOverlay] = useState(null);
  const composite = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    return c;
  }, []);
  if (compositeRef) compositeRef.current = composite;

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    const update = () => setScale(el.clientWidth / W);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="stage" ref={stageRef}>
      <div className={`scaler${sepia ? ' sepia' : ''}`} style={{ width: W, height: H, transform: `scale(${scale})` }}>
        {overlay && (
          <Canvas
            key={ep.id}
            dpr={quality}
            resize={{ offsetSize: true }}
            frameloop={frameloop}
            shadows
            flat
            gl={{ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
            camera={{ fov: 50, near: 0.03, far: 200, position: [0, 1.5, 5] }}
            style={{ position: 'absolute', left: 0, top: 0, width: W, height: H }}
          >
            <World ep={ep} store={store} audio={audio} overlay={overlay} composite={composite} onStatus={onStatus} />
          </Canvas>
        )}
        <canvas
          ref={(el) => { if (el && el !== overlay) setOverlay(el); }}
          width={W}
          height={H}
          className="overlay"
        />
      </div>
      {showSafe && <SafeZone />}
    </div>
  );
});
