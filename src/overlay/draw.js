// Menggambar semua teks & efek layar ke canvas 1080x1920 (ikut terekam).
// Zona aman Shorts: hindari 12% atas dan ~22% bawah serta 15% kanan bawah.
import * as THREE from 'three';
import { CHARACTERS, HIDDEN_NAME } from '../data/characters.js';
import { castPose, TYPE_CPS } from '../engine/build.js';

export const W = 1080;
export const H = 1920;
const UI = "'M PLUS Rounded 1c', system-ui, sans-serif";
const DISPLAY = "'Dela Gothic One', 'M PLUS Rounded 1c', sans-serif";
const v3 = new THREE.Vector3();

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const easeOutBack = (x) => { const c1 = 1.70158; const c3 = c1 + 1; const t = x - 1; return 1 + c3 * t * t * t + c1 * t * t; };

function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function wrap(g, text, maxW) {
  const out = [];
  let line = '';
  for (const w of text.split(/\s+/)) {
    const test = line ? `${line} ${w}` : w;
    if (g.measureText(test).width > maxW && line) { out.push(line); line = w; } else line = test;
  }
  if (line) out.push(line);
  return out;
}

function strokeText(g, text, x, y, fill, stroke, lw) {
  g.lineJoin = 'round';
  g.lineWidth = lw;
  g.strokeStyle = stroke;
  g.strokeText(text, x, y);
  g.fillStyle = fill;
  g.fillText(text, x, y);
}

function drawHook(g, text, lt) {
  const p = clamp(lt / 0.22, 0, 1);
  const s = 0.6 + 0.4 * easeOutBack(p);
  g.save();
  g.translate(W / 2, 420);
  g.scale(s, s);
  g.font = `400 104px ${DISPLAY}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const lines = wrap(g, text, 940);
  const lh = 118;
  lines.forEach((l, i) => {
    const y = (i - (lines.length - 1) / 2) * lh;
    strokeText(g, l, 0, y, i % 2 ? '#FFFFFF' : '#FFE14D', '#111', 22);
  });
  g.restore();
}

function drawPop(g, text, lt) {
  if (lt > 1.6) return;
  const p = clamp(lt / 0.18, 0, 1);
  const s = 0.3 + 0.9 * easeOutBack(p) - Math.max(0, lt - 1.2) * 0.8;
  g.save();
  g.globalAlpha = clamp((1.6 - lt) / 0.4, 0, 1);
  g.translate(W / 2 + 60, 900);
  g.rotate(-0.12);
  g.scale(s, s);
  g.font = `400 200px ${DISPLAY}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  strokeText(g, text, 0, 0, '#FF3B5C', '#FFFFFF', 30);
  g.restore();
}

function drawCaption(g, text, lt, y = 1400) {
  g.save();
  g.globalAlpha = clamp(lt / 0.2, 0, 1);
  g.font = `800 50px ${UI}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const lines = wrap(g, text, 860);
  const h = lines.length * 64 + 36;
  const w = Math.max(...lines.map((l) => g.measureText(l).width)) + 64;
  g.fillStyle = 'rgba(10,12,28,.78)';
  rr(g, (W - w) / 2, y - h / 2, w, h, 26);
  g.fill();
  g.fillStyle = '#F5F3EA';
  lines.forEach((l, i) => g.fillText(l, W / 2, y - h / 2 + 18 + 32 + i * 64));
  g.restore();
}

function headScreen(shot, id, lt, camera) {
  const c = shot.cast[id];
  if (!c) return null;
  const p = castPose(c, lt, shot.d);
  const h = CHARACTERS[id].height;
  const sit = ['sit', 'piano'].includes(c.anim) ? 0.66 : ['floorsit', 'fall'].includes(c.anim) ? 0.5 : 1;
  v3.set(p.x, h * sit + 0.25, p.z).project(camera);
  if (v3.z > 1 || Math.abs(v3.x) > 1.1 || Math.abs(v3.y) > 1.1) return null;
  return { x: ((v3.x + 1) / 2) * W, y: ((1 - v3.y) / 2) * H };
}

function drawBubble(g, line, shot, lt, camera) {
  const def = CHARACTERS[line.who];
  const shown = line.text.slice(0, Math.max(0, Math.floor((lt - line.at) * TYPE_CPS) + 1));
  const name = line.hideName ? HIDDEN_NAME : def.name;
  const color = line.hideName ? '#444A5E' : def.color;
  const pop = easeOutBack(clamp((lt - line.at) / 0.18, 0, 1));

  g.save();
  g.font = `800 60px ${UI}`;
  const full = wrap(g, line.text, 740);
  const lines = wrap(g, shown, 740);
  const bw = Math.max(...full.map((l) => g.measureText(l).width)) + 80;
  const bh = full.length * 76 + 70;

  const anchor = headScreen(shot, line.who, lt, camera);
  let bx;
  let by;
  if (anchor) {
    bx = clamp(anchor.x - bw / 2, 50, W - bw - 50);
    by = clamp(anchor.y - bh - 70, 260, 1280);
  } else {
    bx = (W - bw) / 2;
    by = 1150;
  }
  g.translate(bx + bw / 2, by + bh / 2);
  g.scale(pop, pop);
  g.translate(-(bx + bw / 2), -(by + bh / 2));

  // ekor bubble
  if (anchor) {
    const tx = clamp(anchor.x, bx + 60, bx + bw - 60);
    g.fillStyle = '#FFFFFF';
    g.strokeStyle = color;
    g.lineWidth = 8;
    g.beginPath();
    g.moveTo(tx - 28, by + bh - 4);
    g.lineTo(clamp(anchor.x, bx + 20, bx + bw - 20), Math.min(anchor.y - 10, by + bh + 60));
    g.lineTo(tx + 28, by + bh - 4);
    g.fill();
    g.stroke();
  }
  rr(g, bx, by, bw, bh, 40);
  g.fillStyle = '#FFFFFF';
  g.fill();
  g.lineWidth = 8;
  g.strokeStyle = color;
  g.stroke();
  // tutup garis ekor di dalam bubble
  if (anchor) {
    const tx = clamp(anchor.x, bx + 60, bx + bw - 60);
    g.fillStyle = '#FFFFFF';
    g.fillRect(tx - 24, by + bh - 14, 48, 12);
  }

  // label nama
  g.font = `800 40px ${UI}`;
  const nw = g.measureText(name).width + 44;
  rr(g, bx + 30, by - 30, nw, 60, 30);
  g.fillStyle = color;
  g.fill();
  g.fillStyle = '#FFFFFF';
  g.textBaseline = 'middle';
  g.fillText(name, bx + 52, by);

  g.font = `800 60px ${UI}`;
  g.fillStyle = '#16192E';
  g.textBaseline = 'top';
  lines.forEach((l, i) => g.fillText(l, bx + 40, by + 44 + i * 76));
  g.restore();
}

function drawVO(g, line, lt) {
  const def = CHARACTERS[line.who];
  const shown = line.text.slice(0, Math.max(0, Math.floor((lt - line.at) * TYPE_CPS) + 1));
  g.save();
  g.font = `italic 800 56px ${UI}`;
  g.textAlign = 'center';
  g.textBaseline = 'top';
  const lines = wrap(g, shown, 860);
  const y = 1080;
  g.font = `800 38px ${UI}`;
  strokeText(g, `— ${def.name} —`, W / 2, y - 60, def.color, '#FFFFFF', 10);
  g.font = `italic 800 56px ${UI}`;
  lines.forEach((l, i) => strokeText(g, l, W / 2, y + i * 72, '#FFFFFF', '#1A1230', 14));
  g.restore();
}

function drawEnd(g, lt, d) {
  const k = clamp((lt - Math.max(0, d - 2.4)) / 0.3, 0, 1);
  if (k <= 0) return;
  g.save();
  g.fillStyle = `rgba(0,0,0,${0.45 * k})`;
  g.fillRect(0, 0, W, H);
  const pulse = 1 + Math.sin(lt * 7) * 0.03;
  g.translate(W / 2, 820);
  g.scale(easeOutBack(k) * pulse, easeOutBack(k) * pulse);
  g.font = `400 200px ${DISPLAY}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  strokeText(g, 'PART 2?', 0, 0, '#FFE14D', '#111', 34);
  g.font = `800 52px ${UI}`;
  strokeText(g, 'Komen "LANJUT" kalau mau tahu!', 0, 150, '#FFFFFF', '#111', 14);
  g.restore();
}

function drawVignette(g, strength = 0.65) {
  const grd = g.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.72);
  grd.addColorStop(0, 'rgba(0,0,0,0)');
  grd.addColorStop(1, `rgba(0,0,0,${strength})`);
  g.fillStyle = grd;
  g.fillRect(0, 0, W, H);
}

export function drawFrame(g, glCanvas, { ep, shot, lt, camera }) {
  g.drawImage(glCanvas, 0, 0, W, H);
  const fx = shot.fx;

  if (fx.includes('sepia')) {
    g.save();
    g.globalCompositeOperation = 'color';
    g.fillStyle = 'rgba(150,100,50,0.75)';
    g.fillRect(0, 0, W, H);
    g.restore();
    g.fillStyle = 'rgba(255,235,200,0.08)';
    g.fillRect(0, 0, W, H);
  }
  if (fx.includes('dark')) { g.fillStyle = 'rgba(0,0,20,0.35)'; g.fillRect(0, 0, W, H); }
  if (fx.includes('vignette') || fx.includes('sepia')) drawVignette(g);
  if (fx.includes('flash') && lt < 0.3) {
    g.fillStyle = `rgba(255,255,255,${1 - lt / 0.3})`;
    g.fillRect(0, 0, W, H);
  }

  if (shot.caption) drawCaption(g, shot.caption, lt);
  for (const l of shot.lines) {
    if (lt < l.at || lt > l.end) continue;
    if (l.vo) drawVO(g, l, lt); else drawBubble(g, l, shot, lt, camera);
  }
  if (shot.hook) drawHook(g, shot.hook, lt);
  if (shot.pop) drawPop(g, shot.pop, lt);
  if (shot.end) drawEnd(g, lt, shot.d);

  // fade masuk & keluar episode
  const t = shot.t + lt;
  const fade = Math.max(1 - t / 0.25, 1 - (ep.total - t) / 0.35, 0);
  if (fade > 0) { g.fillStyle = `rgba(0,0,0,${Math.min(1, fade)})`; g.fillRect(0, 0, W, H); }
}
