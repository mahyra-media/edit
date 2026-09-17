// Mengecek naskah terhadap FORMULA 1 SHORT dan aturan produksi.
import { CHARACTERS } from '../data/characters.js';
import { LOCATIONS } from '../data/locations.js';
import { ANIMS, EXPRESSIONS, FX, CAM_SHOTS, CAM_MOVES } from '../data/motion.js';
import { countWords, WORDS_MAX } from './build.js';

export function validateEpisode(ep) {
  const errors = [];
  const warns = [];
  const at = (s) => `shot ${s.i + 1} (${s.t.toFixed(1)}s)`;

  if (ep.total < 45 || ep.total > 55) errors.push(`Durasi ${ep.total.toFixed(1)}s, harus 45–55 detik`);

  const first = ep.shots[0];
  if (!first?.hook) errors.push('Shot pertama wajib punya hook teks besar');
  if (first && first.d > 2.5) warns.push('Hook sebaiknya 0–2 detik (shot pertama ≤ 2,5 dtk)');

  const beat = (name) => ep.shots.find((s) => s.beat === name);
  const twist = beat('twist');
  if (!twist) errors.push('Belum ada shot dengan beat "twist"');
  else if (twist.t < 34 || twist.t > 48) errors.push(`Twist mulai di ${twist.t.toFixed(1)}s, idealnya 36–48s`);
  const konflik = beat('konflik');
  if (!konflik) warns.push('Tandai shot konflik pertama dengan beat "konflik"');
  else if (konflik.t > 3.5) warns.push(`Konflik mulai di ${konflik.t.toFixed(1)}s, idealnya ≤ 3s`);

  const last = ep.shots[ep.shots.length - 1];
  if (!last?.end) errors.push('Shot terakhir wajib end: true (kartu "PART 2?")');
  else if (last.t < 46.5) warns.push(`Cliffhanger mulai di ${last.t.toFixed(1)}s, idealnya 49–55s`);

  for (const s of ep.shots) {
    if (!LOCATIONS[s.loc]) errors.push(`${at(s)}: lokasi "${s.loc}" tidak ada`);
    if (!CAM_SHOTS.includes(s.cam.s || 'wide')) errors.push(`${at(s)}: jenis kamera "${s.cam.s}" tidak dikenal`);
    if (s.cam.m && !CAM_MOVES.includes(s.cam.m)) errors.push(`${at(s)}: gerak kamera "${s.cam.m}" tidak dikenal`);
    if (s.cam.m === 'static') errors.push(`${at(s)}: kamera harus selalu bergerak`);
    if (s.cam.on && !s.cast[s.cam.on]) errors.push(`${at(s)}: kamera fokus ke "${s.cam.on}" yang tidak ada di shot`);
    if (s.cam.from && !s.cast[s.cam.from]) errors.push(`${at(s)}: kamera ots dari "${s.cam.from}" yang tidak ada di shot`);
    for (const f of s.fx) if (!FX.includes(f)) errors.push(`${at(s)}: efek "${f}" tidak dikenal`);
    for (const [id, c] of Object.entries(s.cast)) {
      if (!CHARACTERS[id]) errors.push(`${at(s)}: karakter "${id}" tidak ada`);
      if (!ANIMS[c.anim]) errors.push(`${at(s)}: animasi "${c.anim}" tidak ada`);
      if (!EXPRESSIONS[c.expr]) errors.push(`${at(s)}: ekspresi "${c.expr}" tidak ada`);
    }
    const hasText = s.hook || s.caption || s.pop || s.end || s.lines.length;
    if (!hasText) errors.push(`${at(s)}: tidak ada teks di layar`);
    for (const l of s.lines) {
      if (!CHARACTERS[l.who]) errors.push(`${at(s)}: pembicara "${l.who}" tidak ada`);
      const n = countWords(l.text);
      if (n > WORDS_MAX) errors.push(`${at(s)}: dialog ${n} kata (maks ${WORDS_MAX}): "${l.text}"`);
      if (l.at + l.dur > s.d + 0.05) warns.push(`${at(s)}: dialog ${l.who} terpotong (${(l.at + l.dur).toFixed(1)}s > ${s.d}s)`);
    }
    if (s.d < 1.5) warns.push(`${at(s)}: shot terlalu pendek`);
  }
  return { errors, warns, ok: errors.length === 0 };
}
