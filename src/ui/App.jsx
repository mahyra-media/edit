import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EPISODES, SERIES } from '../episodes/index.js';
import { buildEpisode } from '../engine/build.js';
import { validateEpisode } from '../engine/validate.js';
import { AudioEngine } from '../engine/audio.js';
import { startRecording, downloadBlob } from '../engine/recorder.js';
import { CHARACTERS } from '../data/characters.js';
import { LOCATIONS } from '../data/locations.js';
import { Studio } from '../scene/Studio.jsx';
import { CorrectionPanel } from './CorrectionPanel.jsx';
import { VoicePanel } from './VoicePanel.jsx';
import { listVoiceKeys } from '../engine/voiceStore.js';

const LS_KOREKSI = 'bdbk-koreksi';
const LS_PREF = 'bdbk-pref';
const loadJSON = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };

const CAM = { wide: 'Lebar', medium: 'Medium', close: 'Close-up', xclose: 'Extreme CU', ots: 'Over-shoulder', low: 'Low', high: 'High', insert: 'Insert', free: 'Bebas' };

export default function App() {
  const audio = useMemo(() => new AudioEngine(), []);
  const store = useRef({ t: 0, playing: false, frame: null, onEnd: null }).current;
  const canvasRef = useRef(null);
  const recRef = useRef(null);

  const [epIndex, setEpIndex] = useState(0);
  const [durations, setDurations] = useState({});
  const [audioInfo, setAudioInfo] = useState(null);
  const [status, setStatus] = useState({});
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [t, setT] = useState(0);
  const [lastRender, setLastRender] = useState(null);
  const [koreksi, setKoreksi] = useState(() => loadJSON(LS_KOREKSI, {}));
  const [pref, setPref] = useState(() => ({ quality: 1.5, showSafe: true, rates: {}, ...loadJSON(LS_PREF, {}) }));
  const [tab, setTab] = useState('adegan');
  const [audioVersion, setAudioVersion] = useState(0);
  const [storedKeys, setStoredKeys] = useState(() => new Set());
  const bumpAudio = useCallback(() => setAudioVersion((v) => v + 1), []);
  audio.rates = pref.rates || {};

  store.overrides = koreksi;
  useEffect(() => { try { localStorage.setItem(LS_KOREKSI, JSON.stringify(koreksi)); } catch { /* penyimpanan penuh/diblokir */ } }, [koreksi]);
  useEffect(() => { try { localStorage.setItem(LS_PREF, JSON.stringify(pref)); } catch { /* abaikan */ } }, [pref]);

  const raw = EPISODES[epIndex];
  const ep = useMemo(() => buildEpisode(raw, durations), [raw, durations]);
  const report = useMemo(() => validateEpisode(ep), [ep]);

  // muat audio episode (kalau file ada)
  useEffect(() => {
    let alive = true;
    setAudioInfo(null);
    audio.preload(buildEpisode(raw)).then((r) => {
      if (!alive) return;
      setDurations(r.durations);
      setAudioInfo(r);
    });
    listVoiceKeys().then((k) => alive && setStoredKeys(new Set(k)));
    return () => { alive = false; };
  }, [raw, audio, audioVersion, pref.rates]);

  // perbarui jam UI ~12x per detik
  useEffect(() => {
    const id = setInterval(() => setT(store.frame ? store.frame.t : store.t), 80);
    return () => clearInterval(id);
  }, [store]);

  const stop = useCallback(async () => {
    const tt = audio.time();
    audio.stop();
    store.playing = false;
    store.t = Math.min(tt, ep.total);
    setPlaying(false);
    if (recRef.current) {
      const rec = recRef.current;
      recRef.current = null;
      setRecording(false);
      const blob = await rec.stop();
      const name = `${ep.id}-${ep.title.toLowerCase().replace(/\s+/g, '-')}.${rec.ext}`;
      setLastRender({ blob, name, url: URL.createObjectURL(blob), size: blob.size });
    }
  }, [audio, store, ep]);

  useEffect(() => { store.onEnd = () => { store.t = 0; stop(); }; }, [store, stop]);

  const play = useCallback(async (from = store.t) => {
    if (from >= ep.total - 0.05) from = 0;
    store.t = from;
    await audio.play(ep, from);
    store.playing = true;
    setPlaying(true);
  }, [audio, store, ep]);

  const record = useCallback(async () => {
    if (!canvasRef.current) return;
    audio.ensure();
    store.playing = false;
    store.t = 0;
    await new Promise((r) => setTimeout(r, 250)); // biar frame pertama sudah tergambar
    try {
      recRef.current = startRecording(canvasRef.current, audio.recDest.stream, 30);
    } catch (e) {
      alert(e.message);
      return;
    }
    setRecording(true);
    setLastRender(null);
    await play(0);
  }, [audio, store, play]);

  const seek = (v) => {
    if (recording) return;
    if (store.playing) { audio.stop(); store.playing = false; setPlaying(false); }
    store.t = v;
    setT(v);
  };

  const cur = ep.shots.findLast ? ep.shots.findLast((s) => t >= s.t) : [...ep.shots].reverse().find((s) => t >= s.t);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.code === 'Space') { e.preventDefault(); if (recording) return; playing ? stop() : play(); }
      if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
        const i = cur ? cur.i : 0;
        const n = Math.max(0, Math.min(ep.shots.length - 1, i + (e.code === 'ArrowRight' ? 1 : -1)));
        seek(ep.shots[n].t + 0.001);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const changeEp = (i) => {
    if (recording) return;
    audio.stop();
    store.playing = false;
    store.t = 0;
    store.frame = null;
    setPlaying(false);
    setDurations({});
    setStatus({});
    setEpIndex(i);
  };

  const onStatus = useCallback((id, s) => setStatus((p) => ({ ...p, [id]: s })), []);

  return (
    <div className="app">
      <section className="left">
        <Studio ep={ep} store={store} audio={audio} onStatus={onStatus} canvasRef={canvasRef}
          quality={pref.quality} showSafe={pref.showSafe && !recording} />
      </section>

      <section className="right">
        <header>
          <p className="eyebrow">{SERIES.judul}</p>
          <h1>Ep {ep.no} · {ep.title}</h1>
          <p className="muted">{ep.judulUpload}</p>
        </header>

        <div className="row">
          <select value={epIndex} onChange={(e) => changeEp(+e.target.value)} disabled={recording}>
            {EPISODES.map((e, i) => <option key={e.id} value={i}>Ep {e.no} — {e.title}</option>)}
          </select>
        </div>

        <div className="transport">
          <button className="btn primary" disabled={recording} onClick={() => (playing ? stop() : play())}>
            {playing ? '❚❚ Jeda' : '▶ Putar'}
          </button>
          <button className={`btn ${recording ? 'danger' : 'rec'}`} onClick={() => (recording ? stop() : record())}>
            {recording ? '■ Hentikan rekaman' : '● Rekam episode'}
          </button>
          <span className="time">{t.toFixed(1)} / {ep.total.toFixed(1)} dtk</span>
        </div>
        <input className="seek" type="range" min={0} max={ep.total} step={0.05} value={t} disabled={recording}
          onChange={(e) => seek(+e.target.value)} aria-label="Posisi waktu" />

        <div className="row prefs">
          <label>Kualitas
            <select value={pref.quality} disabled={recording} onChange={(e) => setPref({ ...pref, quality: +e.target.value })}>
              <option value={0.6}>Ringan (preview cepat)</option>
              <option value={1}>Normal</option>
              <option value={1.5}>Halus (disarankan untuk rekam)</option>
              <option value={2}>Sangat halus (butuh GPU kuat)</option>
            </select>
          </label>
          <label className="check">
            <input type="checkbox" checked={pref.showSafe} onChange={(e) => setPref({ ...pref, showSafe: e.target.checked })} />
            Tampilkan zona aman Shorts
          </label>
        </div>

        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'adegan'} className={tab === 'adegan' ? 'on' : ''} onClick={() => setTab('adegan')}>🎬 Adegan & koreksi</button>
          <button role="tab" aria-selected={tab === 'suara'} className={tab === 'suara' ? 'on' : ''} onClick={() => setTab('suara')}>
            🎙 Suara {audioInfo ? `(${audioInfo.voices}/${audioInfo.lineCount})` : ''}
          </button>
        </div>

        {tab === 'suara' && (
          <VoicePanel
            ep={ep}
            audio={audio}
            storedKeys={storedKeys}
            rates={pref.rates || {}}
            setRates={(rates) => setPref({ ...pref, rates: Object.fromEntries(Object.entries(rates).filter(([, v]) => v != null)) })}
            onChanged={bumpAudio}
            onPreview={(l) => { const T = Math.max(0, l.T - 0.4); seek(T); play(T); }}
            disabled={recording}
          />
        )}

        {tab === 'adegan' && cur && (
          <CorrectionPanel
            ep={ep}
            shot={cur}
            t={t}
            data={koreksi}
            setData={setKoreksi}
            canvasRef={canvasRef}
            disabled={recording}
          />
        )}

        {lastRender && (
          <div className="card ok">
            <strong>Render selesai</strong> · {(lastRender.size / 1048576).toFixed(1)} MB
            <div className="row">
              <button className="btn primary" onClick={() => downloadBlob(lastRender.blob, lastRender.name)}>Unduh {lastRender.name}</button>
              <a className="btn" href={lastRender.url} target="_blank" rel="noreferrer">Buka</a>
            </div>
          </div>
        )}

        <div className={`card ${report.errors.length ? 'bad' : 'ok'}`}>
          <strong>{report.errors.length ? 'Formula belum lolos' : 'Formula Shorts lolos'}</strong>
          <ul>
            {report.errors.map((m) => <li key={m} className="err">{m}</li>)}
            {report.warns.map((m) => <li key={m}>{m}</li>)}
            {!report.errors.length && !report.warns.length && <li>Hook, twist, cliffhanger, dan batas 8 kata sudah sesuai.</li>}
          </ul>
        </div>

        <div className="card">
          <strong>Aset</strong>
          <p className="muted small">
            Dialog bersuara: {audioInfo ? `${audioInfo.voices}/${audioInfo.lineCount}` : 'memuat...'}
            {audioInfo && audioInfo.voices < audioInfo.lineCount ? ' — rekam di tab Suara. Yang belum ada memakai lip-sync perkiraan.' : ''}
          </p>
          <div className="chips">
            {ep.castIds.map((id) => (
              <span key={id} className={`chip ${status[id] || ''}`} style={{ '--c': CHARACTERS[id].color }}>
                {CHARACTERS[id].name}: {status[id] === 'vrm' ? 'VRM' : status[id] === 'placeholder' ? 'boneka' : status[id] === 'error' ? 'gagal' : '...'}
              </span>
            ))}
          </div>
        </div>

        {tab === 'adegan' && <ol className="shots">
          {ep.shots.map((s) => (
            <li key={s.i}>
              <button className={cur && cur.i === s.i ? 'on' : ''} onClick={() => seek(s.t + 0.001)} disabled={recording}>
                <span className="st">{s.t.toFixed(1)}s</span>
                <span className="sb">
                  {s.beat && <em className={`beat ${s.beat}`}>{s.beat}</em>}
                  {LOCATIONS[s.loc].name} · {CAM[s.cam.s || 'wide']}{s.cam.on ? ` ${CHARACTERS[s.cam.on].name}` : ''}
                  <span className="sl">
                    {s.hook || s.lines.map((l) => `${l.hideName ? '???' : CHARACTERS[l.who].name}: ${l.text}`).join(' / ') || s.caption || s.pop}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>}
        <p className="muted small">Spasi = putar/jeda · ← → = pindah shot · Edit naskah di <code>src/episodes/</code>, halaman ter-update otomatis.</p>
      </section>
    </div>
  );
}
