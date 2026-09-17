import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CHARACTERS } from '../data/characters.js';
import { ANIMS, EXPRESSIONS } from '../data/motion.js';
import { castPose, countWords } from '../engine/build.js';
import { loadVRM } from '../engine/vrm.js';
import { loadMixamoClip } from '../engine/mixamo.js';
import { toon, gradientMap } from './materials.js';

const DEG = Math.PI / 180;
const EXPR_KEYS = ['happy', 'angry', 'sad', 'relaxed', 'surprised'];
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const SIL_MAT = new THREE.MeshBasicMaterial({ color: '#05060a' });

// Level bicara: dari analyser audio kalau ada file suara, kalau tidak pakai kepakan palsu
function talkLevel(id, shot, lt, audio, playing) {
  for (const l of shot.lines) {
    if (l.who !== id || l.vo) continue;
    if (lt < l.at || lt > l.at + l.dur) continue;
    if (l.hasAudio && playing) return audio.level(id);
    const n = countWords(l.text);
    const speakEnd = l.at + Math.min(l.dur, n * 0.36 + 0.3);
    if (lt > speakEnd) return 0;
    return Math.max(0, Math.sin((lt - l.at) * 17)) * 0.8;
  }
  return 0;
}

function blinkAt(t, seed) {
  const x = (t + seed) % 4.1;
  return x < 0.12 ? Math.sin((x / 0.12) * Math.PI) : 0;
}

function exprWeights(c, lt) {
  const cur = EXPRESSIONS[c.expr] || {};
  const prev = EXPRESSIONS[c.prevExpr] || {};
  const k = clamp01(lt / 0.25);
  const w = {};
  for (const key of EXPR_KEYS) w[key] = (prev[key] || 0) * (1 - k) + (cur[key] || 0) * k;
  return w;
}

// ---------- pose prosedural (kalau FBX belum ada) ----------
function proceduralVRM(vrm, anim, lt, T) {
  const h = vrm.humanoid;
  h.resetNormalizedPose();
  const b = (n) => h.getNormalizedBoneNode(n);
  const s = Math.sin;
  vrm.scene.position.y = 0;
  b('leftUpperArm').rotation.z = -1.2;
  b('rightUpperArm').rotation.z = 1.2;
  b('leftLowerArm').rotation.y = -0.15;
  b('rightLowerArm').rotation.y = 0.15;
  b('spine').rotation.x = s(T * 2) * 0.012;
  const walkCycle = (sp, a) => {
    b('leftUpperLeg').rotation.x = s(T * sp) * a;
    b('rightUpperLeg').rotation.x = -s(T * sp) * a;
    b('leftLowerLeg').rotation.x = Math.max(0, -s(T * sp)) * a * 1.2;
    b('rightLowerLeg').rotation.x = Math.max(0, s(T * sp)) * a * 1.2;
    b('leftUpperArm').rotation.x = -s(T * sp) * a * 0.6;
    b('rightUpperArm').rotation.x = s(T * sp) * a * 0.6;
    vrm.scene.position.y = Math.abs(s(T * sp)) * 0.02;
  };
  const sitPose = () => {
    vrm.scene.position.y = -0.42;
    b('leftUpperLeg').rotation.x = -1.5;
    b('rightUpperLeg').rotation.x = -1.5;
    b('leftLowerLeg').rotation.x = 1.5;
    b('rightLowerLeg').rotation.x = 1.5;
  };
  switch (anim) {
    case 'walk': case 'carry': walkCycle(7, 0.45); break;
    case 'run': walkCycle(11, 0.75); b('spine').rotation.x = 0.15; break;
    case 'talk': b('head').rotation.x = s(T * 3) * 0.05; b('rightUpperArm').rotation.z = 0.9; b('rightLowerArm').rotation.y = 0.9 + s(T * 3) * 0.2; break;
    case 'sad': case 'cry': b('head').rotation.x = 0.35; b('spine').rotation.x = 0.12; break;
    case 'crossarms': case 'angry':
      b('leftUpperArm').rotation.z = -1.1; b('rightUpperArm').rotation.z = 1.1;
      b('leftUpperArm').rotation.x = -0.5; b('rightUpperArm').rotation.x = -0.5;
      b('leftLowerArm').rotation.y = -2.0; b('rightLowerArm').rotation.y = 2.0;
      b('head').rotation.x = anim === 'angry' ? 0.1 : -0.08;
      break;
    case 'surprised': case 'scared': {
      const k = clamp01(lt / 0.2);
      b('spine').rotation.x = -0.12 * k;
      b('leftUpperArm').rotation.z = -1.2 + 0.6 * k; b('rightUpperArm').rotation.z = 1.2 - 0.6 * k;
      b('leftLowerArm').rotation.y = -1.6 * k; b('rightLowerArm').rotation.y = 1.6 * k;
      if (anim === 'scared') b('spine').rotation.z = s(T * 30) * 0.01;
      break;
    }
    case 'laugh': b('spine').rotation.x = -0.1 + s(T * 14) * 0.03; b('head').rotation.x = -0.15; break;
    case 'think': b('rightUpperArm').rotation.z = 1.0; b('rightUpperArm').rotation.x = -0.9; b('rightLowerArm').rotation.y = 2.3; b('head').rotation.z = 0.12; break;
    case 'point': case 'holdup': case 'grab': case 'catch': case 'give': case 'unlock': case 'pull': {
      const up = anim === 'holdup' ? -2.6 : anim === 'catch' ? -2.2 : -1.5;
      b('rightUpperArm').rotation.z = 0.2;
      b('rightUpperArm').rotation.y = up * -0.2;
      b('rightUpperArm').rotation.x = anim === 'holdup' ? 0 : up * clamp01(lt / 0.25);
      if (anim === 'holdup') b('rightUpperArm').rotation.z = -1.4;
      break;
    }
    case 'phone':
      b('rightUpperArm').rotation.z = 1.1; b('rightUpperArm').rotation.x = -0.7; b('rightLowerArm').rotation.y = 1.9; b('head').rotation.x = 0.2; break;
    case 'trip': b('rightUpperLeg').rotation.x = -0.6 * clamp01(lt / 0.2); b('rightUpperLeg').rotation.z = 0.3; break;
    case 'fall': { const k = clamp01(lt / 0.45); vrm.scene.position.y = -0.55 * k; b('spine').rotation.x = 0.5 * k; b('leftUpperLeg').rotation.x = -1.3 * k; b('rightUpperLeg').rotation.x = -1.3 * k; break; }
    case 'floorsit':
      vrm.scene.position.y = -0.62;
      b('leftUpperLeg').rotation.x = -1.45; b('rightUpperLeg').rotation.x = -1.45;
      b('leftLowerLeg').rotation.x = 0.6; b('rightLowerLeg').rotation.x = 0.6;
      b('spine').rotation.x = 0.15;
      break;
    case 'pickup': vrm.scene.position.y = -0.35; b('spine').rotation.x = 0.7; b('leftUpperLeg').rotation.x = -1.2; b('rightUpperLeg').rotation.x = -1.2; b('leftLowerLeg').rotation.x = 1.8; b('rightLowerLeg').rotation.x = 1.8; break;
    case 'sit': sitPose(); break;
    case 'piano':
      sitPose();
      b('leftUpperArm').rotation.z = -1.1; b('rightUpperArm').rotation.z = 1.1;
      b('leftUpperArm').rotation.x = -0.6; b('rightUpperArm').rotation.x = -0.6;
      b('leftLowerArm').rotation.y = -0.9 + s(T * 6) * 0.08; b('rightLowerArm').rotation.y = 0.9 + s(T * 6 + 1) * 0.08;
      break;
    case 'shy': b('head').rotation.x = 0.25; b('head').rotation.y = s(T * 0.8) * 0.2; break;
    case 'lookaround': b('head').rotation.y = s(T * 1.2) * 0.6; break;
    default: break;
  }
}

// ---------- boneka placeholder ----------
function makeFaceTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return { c, g: c.getContext('2d'), t, key: '' };
}

function drawFace(face, def, w, mouth, blink) {
  const expr = w.happy > 0.6 ? 'happy' : w.surprised > 0.5 ? 'surprised' : w.angry > 0.5 ? 'angry' : w.sad > 0.5 ? 'sad' : 'neutral';
  const key = `${expr}${mouth > 0.3 ? 1 : 0}${blink > 0.5 ? 1 : 0}`;
  if (key === face.key) return;
  face.key = key;
  const g = face.g;
  g.clearRect(0, 0, 256, 256);
  g.lineCap = 'round';
  g.fillStyle = 'rgba(255,120,150,.35)';
  g.beginPath(); g.ellipse(60, 182, 22, 9, 0, 0, 7); g.ellipse(196, 182, 22, 9, 0, 0, 7); g.fill();
  for (const sgn of [-1, 1]) {
    const cx = 128 + sgn * 60;
    g.strokeStyle = '#2a1f2f';
    g.lineWidth = 5;
    const inner = expr === 'angry' ? 9 : expr === 'sad' ? -9 : 0;
    g.beginPath(); g.moveTo(cx - sgn * 18, 88 + inner); g.lineTo(cx + sgn * 18, 88 - inner / 2); g.stroke();
    if (expr === 'happy' || blink > 0.5) {
      g.lineWidth = 7;
      g.beginPath(); g.moveTo(cx - 19, 140); g.quadraticCurveTo(cx, expr === 'happy' ? 116 : 148, cx + 19, 140); g.stroke();
      continue;
    }
    const small = expr === 'surprised';
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(cx, 136, 20, 27, 0, 0, 7); g.fill();
    g.fillStyle = def.iris; g.beginPath(); g.ellipse(cx, 140, small ? 8 : 15, small ? 11 : 21, 0, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(cx - 5, 130, small ? 3 : 5, 0, 7); g.fill();
    g.strokeStyle = '#2a1f2f'; g.lineWidth = 7;
    g.beginPath(); g.moveTo(cx - 23, 124); g.quadraticCurveTo(cx, 104, cx + 23, 120); g.stroke();
  }
  g.fillStyle = '#b8434f';
  g.strokeStyle = '#7a2a33';
  g.lineWidth = 4;
  if (mouth > 0.3 || expr === 'surprised') { g.beginPath(); g.ellipse(128, 213, 9, 8 + mouth * 8, 0, 0, 7); g.fill(); }
  else if (expr === 'happy') { g.beginPath(); g.moveTo(110, 206); g.quadraticCurveTo(128, 232, 146, 206); g.closePath(); g.fill(); }
  else if (expr === 'sad' || expr === 'angry') { g.beginPath(); g.moveTo(114, 219); g.quadraticCurveTo(128, 207, 142, 219); g.stroke(); }
  else { g.beginPath(); g.moveTo(116, 210); g.quadraticCurveTo(128, 220, 140, 210); g.stroke(); }
  face.t.needsUpdate = true;
}

function Placeholder({ def, rig }) {
  const face = useMemo(makeFaceTexture, []);
  rig.face = face;
  const s = def.height / 1.55;
  const skin = toon(def.skin);
  const hair = toon(def.hair, { side: THREE.DoubleSide });
  const outfit = toon(def.outfit);
  const accent = toon(def.accent);
  const leg = def.girl ? skin : toon('#2A2F45');
  return (
    <group scale={s}>
      <group ref={(o) => (rig.body = o)}>
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 0.085, 0.72, 0]} ref={(o) => (rig[k < 0 ? 'legR' : 'legL'] = o)}>
            <mesh position={[0, -0.34, 0]} material={leg} castShadow><cylinderGeometry args={[0.06, 0.05, 0.68, 10]} /></mesh>
            <mesh position={[0, -0.69, 0.04]} material={toon('#33261F')}><boxGeometry args={[0.1, 0.06, 0.2]} /></mesh>
          </group>
        ))}
        <group position={[0, 0.72, 0]} ref={(o) => (rig.torso = o)}>
          <mesh position={[0, 0.25, 0]} material={outfit} castShadow><cylinderGeometry args={[0.15, 0.18, 0.48, 14]} /></mesh>
          {def.girl && <mesh position={[0, 0, 0]} material={toon('#2B3A67')} castShadow><cylinderGeometry args={[0.19, 0.3, 0.28, 16]} /></mesh>}
          <mesh position={[0, 0.4, 0.15]} material={accent}><boxGeometry args={[0.06, 0.12, 0.03]} /></mesh>
          {[-1, 1].map((k) => (
            <group key={k} position={[k * 0.19, 0.45, 0]} rotation={[0, 0, k * 0.12]} ref={(o) => (rig[k < 0 ? 'armR' : 'armL'] = o)}>
              <mesh position={[0, -0.2, 0]} material={outfit} castShadow><cylinderGeometry args={[0.045, 0.04, 0.4, 8]} /></mesh>
              <mesh position={[0, -0.43, 0]} material={skin}><sphereGeometry args={[0.048, 10, 8]} /></mesh>
            </group>
          ))}
          <group position={[0, 0.74, 0]} ref={(o) => (rig.head = o)}>
            <mesh material={skin} castShadow><sphereGeometry args={[0.24, 24, 18]} /></mesh>
            <mesh material={hair} rotation={[-0.7, 0, 0]} position={[0, 0.02, -0.01]} castShadow>
              <sphereGeometry args={[0.262, 24, 16, 0, Math.PI * 2, 0, 1.95]} />
            </mesh>
            {def.girl && <mesh material={hair} position={[0, -0.18, -0.12]} castShadow><boxGeometry args={[0.42, 0.42, 0.12]} /></mesh>}
            {def.ribbon && <mesh position={[0.17, 0.17, -0.05]} material={toon('#3D7BFF')}><boxGeometry args={[0.14, 0.07, 0.05]} /></mesh>}
            <mesh position={[0, 0, 0.236]}>
              <planeGeometry args={[0.33, 0.33]} />
              <meshToonMaterial map={face.t} gradientMap={gradientMap} alphaTest={0.1} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

function posePlaceholder(rig, anim, lt, T) {
  if (!rig.body) return;
  const s = Math.sin;
  rig.body.position.set(0, 0, 0);
  rig.body.rotation.set(0, 0, 0);
  rig.torso.rotation.set(0, 0, 0);
  rig.head.rotation.set(0, 0, 0);
  rig.armL.rotation.set(0, 0, 0.12);
  rig.armR.rotation.set(0, 0, -0.12);
  rig.legL.rotation.set(0, 0, 0);
  rig.legR.rotation.set(0, 0, 0);
  rig.torso.position.y = 0.72 + s(T * 2) * 0.004;
  const walk = (sp, a) => {
    rig.legL.rotation.x = s(T * sp) * a; rig.legR.rotation.x = -s(T * sp) * a;
    rig.armL.rotation.x = -s(T * sp) * a; rig.armR.rotation.x = s(T * sp) * a;
    rig.body.position.y = Math.abs(s(T * sp)) * 0.02;
  };
  const sit = (y) => { rig.body.position.y = y; rig.legL.rotation.x = -1.5; rig.legR.rotation.x = -1.5; };
  switch (anim) {
    case 'walk': case 'carry': walk(7, 0.4); break;
    case 'run': walk(11, 0.7); rig.torso.rotation.x = 0.15; break;
    case 'sad': case 'cry': rig.head.rotation.x = 0.35; rig.torso.rotation.x = 0.1; break;
    case 'surprised': case 'scared': { const k = Math.min(1, lt / 0.2); rig.torso.rotation.x = -0.12 * k; rig.armL.rotation.set(-0.7 * k, 0, 0.8 * k); rig.armR.rotation.set(-0.7 * k, 0, -0.8 * k); if (anim === 'scared') rig.body.position.x = s(T * 40) * 0.006; break; }
    case 'laugh': rig.torso.rotation.x = -0.1 + s(T * 14) * 0.03; break;
    case 'crossarms': case 'angry': rig.armL.rotation.set(-1.2, 0, -0.6); rig.armR.rotation.set(-1.2, 0, 0.6); break;
    case 'think': rig.armR.rotation.set(-1.7, 0, 0.6); rig.head.rotation.z = 0.15; break;
    case 'point': case 'grab': case 'give': case 'unlock': case 'pull': rig.armR.rotation.x = -1.5 * Math.min(1, lt / 0.25); break;
    case 'holdup': case 'catch': rig.armR.rotation.z = -2.7; break;
    case 'phone': rig.armR.rotation.set(-1.6, 0, 0.4); rig.head.rotation.x = 0.2; break;
    case 'talk': rig.armR.rotation.x = -0.35 + s(T * 3) * 0.15; break;
    case 'trip': rig.legR.rotation.set(-0.6, 0, 0.3); break;
    case 'fall': { const k = Math.min(1, lt / 0.45); rig.body.position.y = -0.5 * k; rig.legL.rotation.x = -1.4 * k; rig.legR.rotation.x = -1.4 * k; rig.torso.rotation.x = 0.3 * k; break; }
    case 'floorsit': rig.body.position.y = -0.62; rig.legL.rotation.x = -1.5; rig.legR.rotation.x = -1.5; rig.torso.rotation.x = 0.12; break;
    case 'pickup': rig.body.position.y = -0.3; rig.torso.rotation.x = 0.7; rig.armR.rotation.x = -0.8; break;
    case 'sit': sit(-0.4); break;
    case 'piano': sit(-0.4); rig.armL.rotation.x = -1.2; rig.armR.rotation.x = -1.2; break;
    case 'shy': rig.head.rotation.x = 0.25; break;
    case 'lookaround': rig.head.rotation.y = s(T * 1.2) * 0.6; break;
    default: break;
  }
}

// ---------- komponen utama ----------
export function Character({ id, ep, store, audio, onStatus }) {
  const def = CHARACTERS[id];
  const group = useRef();
  const light = useRef();
  const lightTarget = useRef();
  const [vrm, setVrm] = useState(undefined); // undefined = memuat, null = placeholder
  const rig = useMemo(() => ({}), []);
  const anim = useRef({ mixer: null, actions: {} });
  const mats = useRef(null);
  const silOn = useRef(false);

  useEffect(() => {
    let alive = true;
    loadVRM(def.vrm)
      .then((v) => { if (alive) { setVrm(v); onStatus?.(id, v ? 'vrm' : 'placeholder'); } })
      .catch((e) => { console.warn(e); if (alive) { setVrm(null); onStatus?.(id, 'error'); } });
    return () => { alive = false; };
  }, [id]);

  useEffect(() => {
    if (light.current && lightTarget.current) light.current.target = lightTarget.current;
  }, []);

  useEffect(() => {
    if (!vrm) return;
    const mixer = new THREE.AnimationMixer(vrm.scene);
    anim.current = { mixer, actions: {} };
    const names = ep.animsByChar[id] || [];
    names.forEach(async (name) => {
      const spec = ANIMS[name];
      if (!spec) return;
      try {
        const clip = await loadMixamoClip(spec.file, vrm);
        if (!clip) return;
        const action = mixer.clipAction(clip);
        action.play();
        action.setEffectiveWeight(0);
        anim.current.actions[name] = { action, dur: clip.duration, loop: spec.loop };
      } catch (e) { console.warn(`Animasi ${spec.file} gagal:`, e); }
    });
    return () => mixer.stopAllAction();
  }, [vrm, ep]);

  const setSilhouette = (on) => {
    if (on === silOn.current) return;
    const root = vrm ? vrm.scene : group.current;
    if (!root || vrm === undefined) return;
    if (!mats.current) {
      mats.current = new Map();
      root.traverse((o) => { if (o.isMesh) mats.current.set(o, o.material); });
    }
    silOn.current = on;
    mats.current.forEach((m, o) => { o.material = on ? SIL_MAT : m; });
  };

  useFrame((state, delta) => {
    const f = store.frame;
    const g = group.current;
    if (!f || !g) return;
    const shot = ep.shots[f.i];
    const c = shot.cast[id];
    g.visible = !!c;
    if (!c) return;
    const lt = f.lt;
    const T = state.clock.elapsedTime;
    const p = castPose(c, lt, shot.d);
    g.position.set(p.x, 0, p.z);
    g.rotation.y = p.yaw * DEG;
    if (light.current) light.current.visible = !!c.flashlight;
    setSilhouette(!!c.silhouette);

    const w = exprWeights(c, lt);
    const talk = talkLevel(id, shot, lt, audio, store.playing);
    const blink = w.happy > 0.7 ? 0 : blinkAt(T, id.length * 1.37);

    if (vrm) {
      const { mixer, actions } = anim.current;
      const cur = actions[c.anim];
      const prev = c.prevAnim && c.prevAnim !== c.anim ? actions[c.prevAnim] : null;
      if (cur && mixer) {
        for (const a of Object.values(actions)) a.action.setEffectiveWeight(0);
        const tt = (a, t) => (a.loop ? t % a.dur : Math.min(t, a.dur - 0.001));
        const k = prev ? clamp01(lt / 0.3) : 1;
        cur.action.time = tt(cur, lt);
        cur.action.setEffectiveWeight(k);
        if (prev) { prev.action.time = tt(prev, c.prevLt + lt); prev.action.setEffectiveWeight(1 - k); }
        vrm.scene.position.y = 0;
        mixer.update(0);
      } else {
        proceduralVRM(vrm, c.anim, lt, T);
      }
      const em = vrm.expressionManager;
      if (em) {
        for (const key of EXPR_KEYS) em.setValue(key, w[key]);
        em.setValue('aa', talk);
        em.setValue('blink', blink);
      }
      vrm.update(Math.min(delta, 1 / 20));
    } else if (vrm === null) {
      posePlaceholder(rig, c.anim, lt, T);
      if (rig.face) drawFace(rig.face, def, w, talk, blink);
    }
  });

  return (
    <group ref={group} visible={false}>
      {vrm ? <primitive object={vrm.scene} /> : vrm === null ? <Placeholder def={def} rig={rig} /> : null}
      <spotLight ref={light} visible={false} position={[0.15, 1.1, 0.25]} angle={0.45} penumbra={0.6} intensity={25} distance={7} decay={1.5} color="#fff6dd" />
      <object3D ref={lightTarget} position={[0, 0.8, 4]} />
    </group>
  );
}
