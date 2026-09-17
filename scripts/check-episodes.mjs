// npm run check — validasi semua episode terhadap formula Shorts
import { EPISODES } from '../src/episodes/index.js';
import { buildEpisode } from '../src/engine/build.js';
import { validateEpisode } from '../src/engine/validate.js';

let failed = 0;
for (const raw of EPISODES) {
  let ep;
  try { ep = buildEpisode(raw); } catch (e) { console.log(`✖ ${raw.id}: ${e.message}`); failed++; continue; }
  const { errors, warns } = validateEpisode(ep);
  const twist = ep.shots.find((s) => s.beat === 'twist');
  console.log(`${errors.length ? '✖' : '✔'} ${ep.id} "${ep.title}" — ${ep.total.toFixed(1)}s, ${ep.shots.length} shot, ${ep.shots.reduce((a, s) => a + s.lines.length, 0)} dialog, twist @${twist?.t.toFixed(1)}s`);
  errors.forEach((m) => console.log(`   ERROR  ${m}`));
  warns.forEach((m) => console.log(`   cek    ${m}`));
  if (errors.length) failed++;
}
process.exit(failed ? 1 : 0);
