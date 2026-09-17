// Menggambar semua teks & efek layar ke canvas 1080x1920 (ikut terekam).
// Zona aman Shorts: atas ~200px, bawah mulai ~1500px, kanan bawah dipakai tombol.
import * as THREE from 'three';
import { CHARACTERS, HIDDEN_NAME } from '../data/characters.js';
import { castPose, TYPE_CPS } from '../engine/build.js';

export const W = 1080;
export const H = 1920;
export const SAFE = { top: 200, bottom: 1500, side: 70 };

const UI = "'M PLUS Rounded 1c', system-ui, sans-serif";
const DISPLAY = "'Dela Gothic One', 'M PLUS Rounded 1c', sans-serif";
const v3 = new THREE.Vector3();

// Zona vertikal tiap jenis teks
const Z = {
  hook: { center: 400, maxH: 380 },   // 210–590
  bubbleTop: 250,
  bubbleTopWithHook: 620,
  bubbleBottom: 1290,
  caption: 1395,                      // 1330–1460
  pop: 720,
  popWithHook: 1150,
  vo: 1170,
  end: 860,
};

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const easeOut = (x) => 1 - (1 - x) ** 3;
const easeOutBack = (x) => { const c1 = 1.4; const t = x - 1; return 1 + (c1 + 1) * t * t * t + c1 * t * t; };

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
  for (const w of String(text).split(/\s+/)) {
    const test = line ? `${line} ${w}` : w;
    if (g.measureText(test).width > maxW && line) { out.push(line); line = w; } else line = test;
  }
  if (line) out.push(line);
  return out;
}

// Cari ukuran font terbesar yang muat: tiap baris <= maxW dan jumlah baris <= maxLines
const fitCache = new Map();
function fit(g, text, font, opts) {
  const key = `${text}|${font(1)}|${JSON.stringify(opts)}`;
  let r = fitCache.get(key);
  if (!r) {
    r = fitRaw(g, text, font, opts);
    if (fitCache.size > 500) fitCache.clear();
    fitCache.set(key, r);
  }
  return r;
}
function fitRaw(g, text, font, { maxW, maxLines, start, min, lineH = 1.15, maxH = Infinity }) {
  for (let size = start; size >= min; size -= 2) {
    g.font = font(size);
    const lines = wrap(g, text, maxW);
    const widest = Math.max(...lines.map((l) => g.measureText(l).width));
    if (lines.length <= maxLines && widest <= maxW && lines.length * size * lineH <= maxH) {
      return { size, lines, lh: size * lineH, width: widest };
    }
  }
  g.font = font(min);
  const lines = wrap(g, text, maxW);
  return { size: min, lines, lh: min * lineH, width: Math.min(maxW, Math.max(...lines.map((l) => g.measureText(l).width))) };
}

function strokeText(g, text, x, y, fill, stroke, lw) {
  g.lineJoin = 'round';
  g.miterLimit = 2;
  g.lineWidth = lw;
  g.strokeStyle = stroke;
  g.strokeText(text, x, y);
  g.fillStyle = fill;
  g.fillText(text, x, y);
}

function drawHook(g, text, lt) {
  const f = fit(g, text, (s) => `400 ${s}px ${DISPLAY}`, { maxW: 860, maxLines: 3, start: 100, min: 54, lineH: 1.14, maxH: Z.hook.maxH });
  const s = 0.75 + 0.25 * easeOut(clamp(lt / 0.2, 0, 1));
  g.save();
  g.translate(W / 2, Z.hook.center);
  g.scale(s, s);
  g.font = `400 ${f.size}px ${DISPLAY}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  f.lines.forEach((l, i) => {
    const y = (i - (f.lines.length - 1) / 2) * f.lh;
    strokeText(g, l, 0, y, i % 2 ? '#FFFFFF' : '#FFE14D', '#111', Math.round(f.size * 0.2));
  });
  g.restore();
}

function drawPop(g, text, lt, y = Z.pop) {
  if (lt > 1.6) return;
  const f = fit(g, text, (s) => `400 ${s}px ${DISPLAY}`, { maxW: 760, maxLines: 1, start: 170, min: 70 });
  const s = (0.4 + 0.6 * easeOutBack(clamp(lt / 0.18, 0, 1))) * (1 - Math.max(0, lt - 1.2) * 0.6);
  g.save();
  g.globalAlpha = clamp((1.6 - lt) / 0.4, 0, 1);
  g.translate(W / 2, y);
  g.rotate(-0.1);
  g.scale(s, s);
  g.font = `400 ${f.size}px ${DISPLAY}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  strokeText(g, text, 0, 0, '#FF3B5C', '#FFFFFF', Math.round(f.size * 0.16));
  g.restore();
}

function drawCaption(g, text, lt) {
  const f = fit(g, text, (s) => `800 ${s}px ${UI}`, { maxW: 840, maxLines: 2, start: 48, min: 34, lineH: 1.3 });
  const padX = 34;
  const padY = 18;
  const w = f.width + padX * 2;
  const h = f.lines.length * f.lh + padY * 2;
  const y = Z.caption - h / 2;
  g.save();
  g.globalAlpha = clamp(lt / 0.2, 0, 1);
  g.fillStyle = 'rgba(10,12,28,.8)';
  rr(g, (W - w) / 2, y, w, h, 24);
  g.fill();
  g.font = `800 ${f.size}px ${UI}`;
  g.fillStyle = '#F5F3EA';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  f.lines.forEach((l, i) => g.fillText(l, W / 2, y + padY + f.lh * (i + 0.5)));
  g.restore();
}

function headScreen(shot, id, lt, camera) {
  const c = shot.cast[id];
  if (!c) return null;
  const p = castPose(c, lt, shot.d);
  const h = CHARACTERS[id].height;
  const k = ['sit', 'piano'].includes(c.anim) ? 0.66 : ['floorsit', 'fall'].includes(c.anim) ? 0.5 : 1;
  const top = v3.set(p.x, h * k + 0.1, p.z).clone().project(camera);
  const chin = v3.set(p.x, h * k - 0.25, p.z).project(camera);
  if (top.z > 1 || Math.abs(top.x) > 1.05 || top.y > 1.05 || chin.y < -1.05) return null;
  return {
    x: ((top.x + 1) / 2) * W,
    top: ((1 - top.y) / 2) * H,
    chin: ((1 - chin.y) / 2) * H,
  };
}

function drawBubble(g, line, shot, lt, camera) {
  const def = CHARACTERS[line.who];
  const name = line.hideName ? HIDDEN_NAME : def.name;
  const color = line.hideName ? '#444A5E' : def.color;
  const f = fit(g, line.text, (s) => `800 ${s}px ${UI}`, { maxW: 720, maxLines: 3, start: 58, min: 42, lineH: 1.25 });
  const shownN = Math.max(0, Math.floor((lt - line.at) * TYPE_CPS) + 1);
  const padX = 38;
  const padY = 34;
  g.font = `800 38px ${UI}`;
  const nameW = g.measureText(name).width + 44;
  const bw = Math.max(f.width, nameW + 20) + padX * 2;
  const bh = f.lines.length * f.lh + padY * 2;

  const top = shot.hook ? Z.bubbleTopWithHook : Z.bubbleTop;
  const bottom = shot.caption ? Z.bubbleBottom : SAFE.bottom - 40;
  const a = headScreen(shot, line.who, lt, camera);
  const gap = 50;
  let bx;
  let by;
  let tail = null; // 'down' (bubble di atas kepala) | 'up' (bubble di bawah dagu)
  if (a) {
    bx = clamp(a.x - bw / 2, SAFE.side, W - bw - SAFE.side);
    if (a.top - gap - bh >= top) { by = a.top - gap - bh; tail = 'down'; }
    else if (a.chin + gap + bh <= bottom) { by = Math.max(top, a.chin + gap); tail = 'up'; }
    else { by = clamp(a.top - gap - bh, top, bottom - bh); }
  } else {
    bx = (W - bw) / 2;
    by = clamp(1050, top, bottom - bh);
  }

  const pop = easeOutBack(clamp((lt - line.at) / 0.16, 0, 1));
  g.save();
  g.translate(bx + bw / 2, by + bh / 2);
  g.scale(pop, pop);
  g.translate(-(bx + bw / 2), -(by + bh / 2));

  const drawTail = (fill) => {
    if (!tail) return;
    const tx = clamp(a.x, bx + 70, bx + bw - 70);
    const baseY = tail === 'down' ? by + bh - 4 : by + 4;
    const tipY = tail === 'down' ? Math.min(a.top - 8, by + bh + 46) : Math.max(a.chin + 8, by - 46);
    g.beginPath();
    g.moveTo(tx - 26, baseY);
    g.lineTo(clamp(a.x, bx + 30, bx + bw - 30), tipY);
    g.lineTo(tx + 26, baseY);
    if (fill) g.fill(); else g.stroke();
  };
  g.fillStyle = '#FFFFFF';
  g.strokeStyle = color;
  g.lineWidth = 8;
  drawTail(false);
  rr(g, bx, by, bw, bh, 36);
  g.fill();
  g.stroke();
  drawTail(true);

  // label nama
  const nx = bx + 28;
  const ny = tail === 'up' ? by + bh - 28 : by - 28;
  rr(g, nx, ny, nameW, 56, 28);
  g.fillStyle = color;
  g.fill();
  g.font = `800 38px ${UI}`;
  g.fillStyle = '#FFFFFF';
  g.textBaseline = 'middle';
  g.fillText(name, nx + 22, ny + 29);

  // teks (efek ketik, tata letak baris dari teks penuh supaya tidak melompat)
  g.font = `800 ${f.size}px ${UI}`;
  g.fillStyle = '#16192E';
  g.textBaseline = 'middle';
  let left = shownN;
  f.lines.forEach((l, i) => {
    if (left <= 0) return;
    g.fillText(l.slice(0, left), bx + padX, by + padY + f.lh * (i + 0.5));
    left -= l.length + 1;
  });
  g.restore();
}

function drawVO(g, line, lt) {
  const def = CHARACTERS[line.who];
  const f = fit(g, line.text, (s) => `italic 800 ${s}px ${UI}`, { maxW: 840, maxLines: 3, start: 54, min: 38, lineH: 1.3 });
  const shownN = Math.max(0, Math.floor((lt - line.at) * TYPE_CPS) + 1);
  const y = Z.vo - ((f.lines.length - 1) * f.lh) / 2;
  g.save();
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `800 36px ${UI}`;
  strokeText(g, `— ${def.name} —`, W / 2, y - 64, def.color, '#FFFFFF', 10);
  g.font = `italic 800 ${f.size}px ${UI}`;
  let left = shownN;
  f.lines.forEach((l, i) => {
    if (left <= 0) return;
    const full = g.measureText(l).width;
    const part = l.slice(0, left);
    g.textAlign = 'left';
    strokeText(g, part, W / 2 - full / 2, y + i * f.lh, '#FFFFFF', '#1A1230', 12);
    left -= l.length + 1;
  });
  g.restore();
}

function drawEnd(g, lt, d) {
  const k = clamp((lt - Math.max(0, d - 2.4)) / 0.3, 0, 1);
  if (k <= 0) return;
  g.save();
  g.fillStyle = `rgba(0,0,0,${0.5 * k})`;
  g.fillRect(0, 0, W, H);
  const big = fit(g, 'PART 2?', (s) => `400 ${s}px ${DISPLAY}`, { maxW: 820, maxLines: 1, start: 180, min: 90 });
  const small = fit(g, 'Komen "LANJUT" kalau mau tahu!', (s) => `800 ${s}px ${UI}`, { maxW: 820, maxLines: 1, start: 50, min: 32 });
  const s = easeOutBack(k) * (1 + Math.sin(lt * 7) * 0.02);
  g.translate(W / 2, Z.end);
  g.scale(s, s);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `400 ${big.size}px ${DISPLAY}`;
  strokeText(g, 'PART 2?', 0, 0, '#FFE14D', '#111', Math.round(big.size * 0.16));
  g.font = `800 ${small.size}px ${UI}`;
  strokeText(g, 'Komen "LANJUT" kalau mau tahu!', 0, big.size * 0.85, '#FFFFFF', '#111', 12);
  g.restore();
}

function drawVignette(g, strength = 0.6) {
  const grd = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
  grd.addColorStop(0, 'rgba(0,0,0,0)');
  grd.addColorStop(1, `rgba(0,0,0,${strength})`);
  g.fillStyle = grd;
  g.fillRect(0, 0, W, H);
}

// glCanvas = null → mode lapisan preview (transparan, sepia ditangani CSS)
export function drawFrame(g, glCanvas, { ep, shot, lt, camera }) {
  if (glCanvas) {
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = 'high';
    g.drawImage(glCanvas, 0, 0, W, H);
  }
  const fx = shot.fx;

  if (glCanvas && fx.includes('sepia')) {
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
  if (shot.pop) drawPop(g, shot.pop, lt, shot.hook ? Z.popWithHook : Z.pop);
  if (shot.end) drawEnd(g, lt, shot.d);

  const t = shot.t + lt;
  const fade = Math.max(1 - t / 0.25, 1 - (ep.total - t) / 0.35, 0);
  if (fade > 0) { g.fillStyle = `rgba(0,0,0,${Math.min(1, fade)})`; g.fillRect(0, 0, W, H); }
}
