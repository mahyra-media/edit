// npm run naskah — tulis docs/naskah-episode.md (naskah baca + daftar file suara)
import { writeFileSync, mkdirSync } from 'node:fs';
import { EPISODES, SERIES } from '../src/episodes/index.js';
import { buildEpisode } from '../src/engine/build.js';
import { CHARACTERS } from '../src/data/characters.js';
import { LOCATIONS } from '../src/data/locations.js';

const CAM = { wide: 'Lebar', medium: 'Medium', close: 'Close-up', xclose: 'Extreme close-up', ots: 'Over-shoulder', low: 'Low angle', high: 'High angle', insert: 'Insert', free: 'Bebas' };
const MOVE = { push: 'dorong masuk', pull: 'tarik mundur', pan: 'geser', orbit: 'memutar', rise: 'naik', tilt: 'tilt', handheld: 'goyang tangan', drift: 'melayang pelan' };
const fmt = (t) => `${Math.floor(t / 60)}:${t.toFixed(1).padStart(4, '0')}`;
const esc = (s) => String(s).replace(/\|/g, '\\|');

let md = `# ${SERIES.judul} — Naskah Episode\n\n_${SERIES.logline}_\n\nDihasilkan otomatis dari \`src/episodes/\`. Jangan edit file ini; edit naskah datanya lalu jalankan \`npm run naskah\`.\n\n`;
const rekaman = {};

for (const raw of EPISODES) {
  const ep = buildEpisode(raw);
  md += `## Episode ${ep.no} — ${ep.title}\n\n**Judul upload:** ${ep.judulUpload}  \n**Durasi:** ${ep.total.toFixed(1)} detik · **Lokasi:** ${ep.locIds.map((l) => LOCATIONS[l].name).join(', ')}\n\n`;
  md += `| Waktu | Beat | Lokasi & kamera | Aksi | Dialog | Teks layar |\n|---|---|---|---|---|---|\n`;
  for (const s of ep.shots) {
    const cam = `${LOCATIONS[s.loc].name}<br>${CAM[s.cam.s || 'wide']}${s.cam.on ? ' → ' + CHARACTERS[s.cam.on].name : ''}, ${MOVE[s.cam.m || 'drift']}`;
    const aksi = Object.entries(s.cast).map(([id, c]) => `${CHARACTERS[id].name}${c.silhouette ? ' (siluet)' : ''}: ${c.anim}/${c.expr}`).join('<br>');
    const dialog = s.lines.map((l) => {
      const nm = l.hideName ? '???' : CHARACTERS[l.who].name;
      return `**${nm}${l.vo ? ' (VO)' : ''}:** "${esc(l.text)}"${l.note ? ` _(${esc(l.note)})_` : ''}`;
    }).join('<br>') || '—';
    const layar = [s.hook && `HOOK: ${s.hook}`, s.pop && `POP: ${s.pop}`, s.caption && `Caption: ${s.caption}`, s.end && 'PART 2?', s.fx.length && `FX: ${s.fx.join(', ')}`].filter(Boolean).map(esc).join('<br>') || '—';
    md += `| ${fmt(s.t)}–${fmt(s.t + s.d)} | ${s.beat || ''} | ${cam} | ${aksi} | ${dialog} | ${layar} |\n`;
    for (const l of s.lines) (rekaman[l.who] ||= []).push(l);
  }
  md += `\n`;
}

md += `## Daftar rekaman suara\n\nSimpan tiap file di \`public/<nama file>\` (MP3 atau ubah ekstensi di naskah). Durasi dialog di timeline otomatis mengikuti panjang file.\n\n`;
for (const [who, lines] of Object.entries(rekaman)) {
  md += `### ${CHARACTERS[who].name} (${lines.length} baris)\n\n| File | Dialog | Arahan |\n|---|---|---|\n`;
  for (const l of lines) md += `| \`${l.file}\` | ${esc(l.text)} | ${esc(l.note || '')} |\n`;
  md += `\n`;
}

mkdirSync('docs', { recursive: true });
writeFileSync('docs/naskah-episode.md', md);
console.log('✔ docs/naskah-episode.md ditulis');
