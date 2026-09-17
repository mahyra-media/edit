// Panggung: kanvas WebGL 1080x1920 tersembunyi + kanvas komposit yang terlihat & direkam.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { LOCATIONS, MOODS } from '../data/locations.js';
import { shotIndexAt } from '../engine/build.js';
import { computeCamera } from '../engine/camera.js';
import { drawFrame, W, H } from '../overlay/draw.js';
import { Character } from './Character.jsx';
import { Location } from './Locations.jsx';
import { Effects } from './Effects.jsx';
import { Props } from './Props.jsx';

function Lights({ mood }) {
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
}

function World({ ep, store, audio, viewCanvas, onStatus }) {
  const { gl, scene, camera } = useThree();
  const [idx, setIdx] = useState(0);
  const idxRef = useRef(0);
  const g2d = useMemo(() => viewCanvas.getContext('2d'), [viewCanvas]);

  useEffect(() => { idxRef.current = -1; }, [ep]);

  useFrame(() => {
    let t = store.playing ? audio.time() : store.t;
    if (store.playing && t >= ep.total) {
      t = ep.total - 0.001;
      store.playing = false;
      store.t = 0;
      store.onEnd?.();
    }
    t = Math.max(0, Math.min(ep.total - 0.001, t));
    if (store.playing) store.t = t;
    const i = shotIndexAt(ep, t);
    if (i !== idxRef.current) { idxRef.current = i; setIdx(i); }
    const shot = ep.shots[i];
    const lt = t - shot.t;
    store.frame = { t, i, lt };

    const c = computeCamera(shot, lt, t);
    camera.position.copy(c.pos);
    camera.lookAt(c.look);
    if (camera.fov !== c.fov) { camera.fov = c.fov; camera.updateProjectionMatrix(); }

    gl.render(scene, camera);
    drawFrame(g2d, gl.domElement, { ep, shot, lt, camera });
  }, 1);

  const shot = ep.shots[Math.min(idx, ep.shots.length - 1)];
  const mood = shot.mood || LOCATIONS[shot.loc].mood;
  return (
    <>
      <Lights mood={mood} />
      {ep.locIds.map((id) => <Location key={id} id={id} visible={id === shot.loc} store={store} ep={ep} />)}
      {ep.castIds.map((id) => <Character key={id} id={id} ep={ep} store={store} audio={audio} onStatus={onStatus} />)}
      <Effects fx={shot.fx} store={store} />
      <Props shot={shot} store={store} />
    </>
  );
}

export function Studio({ ep, store, audio, onStatus, canvasRef }) {
  const [view, setView] = useState(null);
  return (
    <div className="stage">
      <canvas
        ref={(el) => { if (el && el !== view) setView(el); if (canvasRef) canvasRef.current = el; }}
        width={W}
        height={H}
        className="view"
      />
      <div className="gl-host" aria-hidden="true">
        {view && (
          <Canvas
            key={ep.id}
            dpr={1}
            shadows
            flat
            gl={{ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
            camera={{ fov: 40, near: 0.03, far: 200, position: [0, 1.5, 5] }}
          >
            <World ep={ep} store={store} audio={audio} viewCanvas={view} onStatus={onStatus} />
          </Canvas>
        )}
      </div>
    </div>
  );
}
