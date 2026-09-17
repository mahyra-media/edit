// Mengubah naskah mentah (src/episodes/epXX.js) jadi timeline siap putar.
// Pure JS: dipakai oleh studio dan oleh script `npm run check` / `npm run naskah`.
import { LOCATIONS } from '../data/locations.js';

export const WORDS_MAX = 8;
export const TYPE_CPS = 30; // kecepatan teks muncul (karakter/detik)

export function countWords(text) {
  return String(text).split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

// Perkiraan lama bicara kalau file suara belum ada
export function estimateSpeech(text) {
  return Math.max(1.0, countWords(text) * 0.36 + 0.5);
}

const pad = (n) => String(n).padStart(2, '0');

function resolvePoint(p, loc) {
  if (Array.isArray(p)) return p;
  const m = LOCATIONS[loc]?.marks?.[p];
  if (!m) throw new Error(`Titik "${p}" tidak ada di lokasi "${loc}"`);
  return m;
}

function yawTo(from, to) {
  return (Math.atan2(to[0] - from[0], to[1] - from[1]) * 180) / Math.PI;
}

export function buildEpisode(raw, audioDur = {}) {
  let t = 0;
  let lineNo = 0;
  const castIds = new Set();
  const animsByChar = {};
  const lastPos = {}; // posisi terakhir tiap karakter (untuk face ke karakter di luar frame)
  const shots = raw.shots.map((s, i) => {
    const shot = { ...s, i, cam: s.cam || {}, fx: s.fx || [], props: s.props || [] };

    // posisi pemeran
    const cast = {};
    for (const [id, c] of Object.entries(s.cast || {})) {
      const at = resolvePoint(c.at ?? 'A', s.loc);
      const to = c.to != null ? resolvePoint(c.to, s.loc) : null;
      cast[id] = { anim: 'idle', expr: 'neutral', ...c, at, to };
    }
    for (const [id, c] of Object.entries(cast)) {
      const f = c.face;
      if (typeof f === 'number') c.yaw = f;
      else if (f === 'cam' || f == null) c.yaw = to180(f == null && c.to ? yawTo(c.at, c.to) : 0);
      else if (cast[f]) c.yaw = yawTo(c.at, cast[f].at);
      else if (lastPos[f]) c.yaw = yawTo(c.at, lastPos[f]);
      else throw new Error(`face "${f}" tidak dikenal (shot ${i + 1})`);
      castIds.add(id);
      (animsByChar[id] ||= new Set()).add(c.anim);
    }
    for (const [id, c] of Object.entries(cast)) lastPos[id] = c.to || c.at;
    shot.cast = cast;

    // dialog berurutan dalam satu shot.
    // file = kunci suara TANPA ekstensi (dicari di browser, lalu public/<file>.mp3/.wav/.m4a)
    let cursor = 0.25;
    shot.lines = (s.lines || []).map((l) => {
      lineNo += 1;
      const file = l.voice ?? `audio/${raw.id}/L${pad(lineNo)}_${l.who}`;
      const dur = audioDur[file] ?? estimateSpeech(l.text);
      const at = l.at ?? cursor;
      cursor = at + dur + 0.15;
      return { ...l, n: lineNo, file, dur, at, hasAudio: file in audioDur };
    });

    // shot memanjang otomatis kalau rekaman suara lebih panjang dari rencana
    const lastEnd = shot.lines.reduce((m, l) => Math.max(m, l.at + l.dur), 0);
    shot.plannedD = s.d;
    shot.d = s.fit === false ? s.d : Math.max(s.d, lastEnd + 0.3);
    shot.t = t;
    t += shot.d;

    shot.lines.forEach((l, k) => {
      const next = shot.lines[k + 1];
      l.T = shot.t + l.at;
      l.end = Math.min(l.at + l.dur + 0.6, next ? next.at : Infinity, shot.d);
    });
    shot.sfx = (s.sfx || []).map((x) => ({ at: 0, vol: 1, ...x, T: shot.t + (x.at || 0) }));
    return shot;
  });

  // animasi & ekspresi sebelumnya (untuk transisi halus)
  shots.forEach((shot, i) => {
    const prev = shots[i - 1];
    for (const [id, c] of Object.entries(shot.cast)) {
      const pc = prev?.cast?.[id];
      c.prevAnim = pc?.anim ?? null;
      c.prevExpr = pc?.expr ?? 'neutral';
      c.prevLt = prev ? prev.d : 0;
    }
  });

  const audioFiles = new Set();
  shots.forEach((s) => {
    s.lines.forEach((l) => audioFiles.add(l.file));
    s.sfx.forEach((x) => audioFiles.add(x.src));
  });
  if (raw.bgm) audioFiles.add(raw.bgm);

  return {
    ...raw,
    shots,
    total: t,
    castIds: [...castIds],
    animsByChar: Object.fromEntries(Object.entries(animsByChar).map(([k, v]) => [k, [...v]])),
    locIds: [...new Set(shots.map((s) => s.loc))],
    audioFiles: [...audioFiles],
  };
}

function to180(a) {
  let x = ((a + 180) % 360 + 360) % 360 - 180;
  return x;
}

export function shotIndexAt(ep, t) {
  const s = ep.shots;
  for (let i = s.length - 1; i >= 0; i--) if (t >= s[i].t) return i;
  return 0;
}

const clamp01 = (x) => Math.max(0, Math.min(1, x));
export const ease = (x) => { const k = clamp01(x); return k * k * (3 - 2 * k); };

// Posisi pemeran pada waktu lokal lt
export function castPose(c, lt, d) {
  if (!c.to) return { x: c.at[0], z: c.at[1], yaw: c.yaw };
  const [s, e] = c.move || [0, 1];
  const k = ease((lt / d - s) / Math.max(0.001, e - s));
  return { x: c.at[0] + (c.to[0] - c.at[0]) * k, z: c.at[1] + (c.to[1] - c.at[1]) * k, yaw: c.yaw };
}
