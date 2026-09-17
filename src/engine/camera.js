// Kamera otomatis dari preset naskah. Kamera selalu bergerak (aturan formula).
import * as THREE from 'three';
import { CHARACTERS } from '../data/characters.js';
import { castPose, ease } from './build.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const DEG = Math.PI / 180;
export const dirFromYaw = (deg) => V(Math.sin(deg * DEG), 0, Math.cos(deg * DEG));

function subject(shot, id, lt) {
  const c = shot.cast[id];
  if (!c) return null;
  const p = castPose(c, lt, shot.d);
  const h = CHARACTERS[id]?.height ?? 1.55;
  const sitting = ['sit', 'piano', 'floorsit', 'fall', 'pickup'].includes(c.anim);
  const headY = c.anim === 'floorsit' || c.anim === 'fall' ? 0.75 : sitting ? h * 0.66 : h * 0.92;
  return { pos: V(p.x, 0, p.z), yaw: p.yaw, head: V(p.x, headY, p.z) };
}

// noise halus deterministik
const wobble = (t, s) => Math.sin(t * 1.7 + s) * 0.6 + Math.sin(t * 3.1 + s * 2) * 0.4;

export function computeCamera(shot, lt, epT) {
  const cam = shot.cam;
  const kind = cam.s || 'wide';
  const ids = Object.keys(shot.cast);
  const on = subject(shot, cam.on || ids[0], lt);
  const yaw = (on ? on.yaw : 0) + (cam.angle || 0);
  const dir = dirFromYaw(yaw);
  let pos;
  let look;

  switch (kind) {
    case 'medium':
      pos = on.head.clone().addScaledVector(dir, cam.dist ?? 2.1);
      pos.y = on.head.y - 0.1;
      look = on.head.clone().setY(on.head.y - 0.3);
      break;
    case 'close':
      pos = on.head.clone().addScaledVector(dir, cam.dist ?? 0.95);
      look = on.head.clone().setY(on.head.y - 0.08);
      break;
    case 'xclose':
      pos = on.head.clone().addScaledVector(dir, cam.dist ?? 0.5).add(V(0, 0.02, 0));
      look = on.head.clone().setY(on.head.y + 0.02);
      break;
    case 'ots': {
      const from = subject(shot, cam.from, lt);
      const toS = on.head.clone().sub(from.head).setY(0).normalize();
      const right = V(toS.z, 0, -toS.x);
      pos = from.head.clone().addScaledVector(toS, -0.75).addScaledVector(right, cam.side ?? 0.35).add(V(0, 0.1, 0));
      look = on.head.clone().setY(on.head.y - 0.05);
      break;
    }
    case 'low':
      pos = on.pos.clone().addScaledVector(dir, cam.dist ?? 1.7).setY(0.3);
      look = on.head.clone().setY(on.head.y - 0.1);
      break;
    case 'high':
      pos = on.pos.clone().addScaledVector(dir, cam.dist ?? 1.4).setY(3.1);
      look = on.pos.clone().setY(0.45);
      break;
    case 'insert': {
      const p = V(...cam.point);
      pos = p.clone().add(V(...(cam.off || [0, 0.25, 0.7])));
      look = p;
      break;
    }
    case 'free':
      pos = V(...cam.pos);
      look = V(...cam.look);
      break;
    default: { // wide
      const c = V();
      const all = ids.map((id) => subject(shot, id, lt));
      all.forEach((s) => c.add(s.pos));
      if (all.length) c.divideScalar(all.length);
      pos = c.clone().addScaledVector(dirFromYaw(cam.angle || 0), cam.dist ?? 5.2).setY(cam.y ?? 1.55);
      look = c.clone().setY(1.05);
    }
  }

  // gerak kamera
  const k = ease(lt / shot.d);
  const amt = cam.amt ?? 1;
  const toLook = look.clone().sub(pos);
  const side = V(toLook.z, 0, -toLook.x).normalize();
  switch (cam.m || 'drift') {
    case 'push': pos.addScaledVector(toLook, 0.22 * amt * k); break;
    case 'pull': pos.addScaledVector(toLook, 0.22 * amt * (1 - k) - 0.05 * amt); break;
    case 'pan': pos.addScaledVector(side, (k - 0.5) * 0.6 * amt); look.addScaledVector(side, (k - 0.5) * 0.3 * amt); break;
    case 'orbit': {
      const off = pos.clone().sub(look).applyAxisAngle(V(0, 1, 0), (k - 0.5) * 0.45 * amt);
      pos = look.clone().add(off);
      break;
    }
    case 'rise': pos.y += (k - 0.5) * 0.6 * amt; break;
    case 'tilt': look.y += (k - 0.5) * 0.7 * amt; break;
    case 'handheld':
      pos.add(V(wobble(epT * 4, 1), wobble(epT * 4, 2), 0).multiplyScalar(0.02 * amt));
      break;
    default: pos.addScaledVector(toLook, 0.07 * k);
  }
  // napas kamera (selalu ada)
  pos.x += wobble(epT, 3) * 0.006;
  pos.y += wobble(epT, 5) * 0.005;

  // efek
  if (shot.fx.includes('shake') && lt < 0.6) {
    const s = (0.6 - lt) * 0.08;
    pos.add(V(Math.sin(lt * 90) * s, Math.cos(lt * 77) * s, 0));
  }
  let fov = cam.fov ?? 40;
  if (shot.fx.includes('zoom')) fov -= 8 * Math.max(0, 1 - lt / 0.35);
  return { pos, look, fov };
}
