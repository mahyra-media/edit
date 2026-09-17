// Panel suara: rekam dialog per baris via mikrofon, impor file, atur nada per karakter, unduh ZIP.
import { useRef, useState } from 'react';
import { CHARACTERS } from '../data/characters.js';
import { putVoice, deleteVoice, getVoice } from '../engine/voiceStore.js';
import { processAudioBlob } from '../engine/voiceTools.js';
import { makeZip } from '../engine/zip.js';
import { downloadBlob } from '../engine/recorder.js';

const baseName = (name) => name.replace(/\.[^.]+$/, '').toLowerCase();

export function VoicePanel({ ep, audio, storedKeys, rates, setRates, onChanged, onPreview, disabled }) {
  const [recKey, setRecKey] = useState(null);
  const [busyKey, setBusyKey] = useState(null);
  const [msg, setMsg] = useState(null);
  const recRef = useRef(null);
  const meterRef = useRef(null);
  const pickRef = useRef(null);
  const pickTarget = useRef(null);

  const lines = ep.shots.flatMap((s) => s.lines.map((l) => ({ ...l, shotNo: s.i + 1 })));
  const speakers = [...new Set(lines.map((l) => l.who))];
  const doneCount = lines.filter((l) => l.hasAudio).length;
  const stored = lines.filter((l) => storedKeys.has(l.file));

  const say = (text, bad = false) => setMsg({ text, bad });

  const saveBlob = async (line, blob) => {
    setBusyKey(line.file);
    try {
      const { wav, duration } = await processAudioBlob(blob, audio.ensure());
      await putVoice(line.file, wav);
      audio.invalidate(line.file);
      say(`Baris ${line.n} tersimpan (${duration.toFixed(1)} dtk).`);
      onChanged();
    } catch (e) {
      say(e.message, true);
    } finally {
      setBusyKey(null);
    }
  };

  const startRec = async (line) => {
    setMsg(null);
    audio.stopOne();
    try {
      const ctx = audio.ensure();
      if (ctx.state !== 'running') await ctx.resume();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      const mr = new MediaRecorder(stream);
      const chunks = [];
      mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser();
      an.fftSize = 512;
      src.connect(an);
      const buf = new Uint8Array(512);
      let raf = 0;
      const tick = () => {
        an.getByteTimeDomainData(buf);
        let m = 0;
        for (let i = 0; i < buf.length; i++) m = Math.max(m, Math.abs(buf[i] - 128));
        if (meterRef.current) meterRef.current.style.width = `${Math.min(100, (m / 128) * 160)}%`;
        raf = requestAnimationFrame(tick);
      };
      tick();
      mr.onstop = async () => {
        cancelAnimationFrame(raf);
        src.disconnect();
        stream.getTracks().forEach((tr) => tr.stop());
        if (meterRef.current) meterRef.current.style.width = '0%';
        await saveBlob(line, new Blob(chunks, { type: mr.mimeType }));
      };
      mr.start();
      recRef.current = mr;
      setRecKey(line.file);
    } catch (e) {
      say(e.name === 'NotAllowedError'
        ? 'Izin mikrofon ditolak. Klik ikon gembok di kiri alamat web → izinkan Mikrofon, lalu coba lagi.'
        : e.name === 'NotFoundError' ? 'Mikrofon tidak ditemukan.' : e.message, true);
    }
  };

  const stopRec = () => {
    recRef.current?.stop();
    recRef.current = null;
    setRecKey(null);
  };

  const play = async (line) => {
    const ok = await audio.playOne(line.file, line.who);
    if (!ok) say('Belum ada suara untuk baris ini.', true);
  };

  const remove = async (line) => {
    await deleteVoice(line.file);
    audio.invalidate(line.file);
    onChanged();
    say(`Rekaman baris ${line.n} dihapus.`);
  };

  const onPick = async (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    if (!files.length) return;
    if (pickTarget.current) {
      await saveBlob(pickTarget.current, files[0]);
      pickTarget.current = null;
      return;
    }
    // impor banyak: cocokkan nama file dengan kode baris, mis. L03_mira.mp3
    let ok = 0;
    const miss = [];
    for (const f of files) {
      const b = baseName(f.name);
      const line = lines.find((l) => b.endsWith(l.file.split('/').pop().toLowerCase()));
      if (!line) { miss.push(f.name); continue; }
      try {
        const { wav } = await processAudioBlob(f, audio.ensure());
        await putVoice(line.file, wav);
        audio.invalidate(line.file);
        ok += 1;
      } catch { miss.push(f.name); }
    }
    onChanged();
    say(`${ok} file diimpor.${miss.length ? ` Tidak cocok: ${miss.join(', ')}` : ''}`, miss.length > 0 && ok === 0);
  };

  const pickFor = (line) => {
    pickTarget.current = line;
    pickRef.current.multiple = false;
    pickRef.current.click();
  };

  const pickMany = () => {
    pickTarget.current = null;
    pickRef.current.multiple = true;
    pickRef.current.click();
  };

  const downloadAll = async () => {
    const files = [];
    for (const l of stored) {
      const v = await getVoice(l.file);
      if (v?.blob) files.push({ name: `public/${l.file}.wav`, blob: v.blob });
    }
    if (!files.length) return;
    downloadBlob(await makeZip(files), `suara-${ep.id}.zip`);
  };

  return (
    <div className="card voice">
      <div className="row between">
        <strong>Suara dialog</strong>
        <span className={`muted small ${doneCount === lines.length ? 'good' : ''}`}>{doneCount}/{lines.length} baris ada suaranya</span>
      </div>

      <p className="muted small">
        Klik <b>● Rekam</b>, ucapkan dialognya, lalu klik <b>■ Selesai</b>. Hening di awal & akhir dipotong otomatis,
        volume disamakan, dan durasi shot menyesuaikan. Pakai earphone supaya suara lain tidak ikut terekam.
      </p>
      <div className="meter"><div ref={meterRef} /></div>

      {msg && <p className={`small ${msg.bad ? 'err' : 'good'}`}>{msg.text}</p>}

      <details className="rates">
        <summary>Nada suara per karakter</summary>
        <p className="muted small">Berguna kalau satu orang mengisi beberapa karakter. Angka di atas 1 = lebih tinggi & sedikit lebih cepat.</p>
        {speakers.map((id) => (
          <label key={id} className="slider">
            <span style={{ color: CHARACTERS[id].color }}>{CHARACTERS[id].name} <b>{(rates[id] || 1).toFixed(2)}×</b></span>
            <input type="range" min={0.8} max={1.3} step={0.01} value={rates[id] || 1} disabled={disabled}
              onChange={(e) => setRates({ ...rates, [id]: +e.target.value === 1 ? undefined : +e.target.value })} />
          </label>
        ))}
      </details>

      <ol className="lines">
        {lines.map((l) => {
          const def = CHARACTERS[l.who];
          const isRec = recKey === l.file;
          const inBrowser = storedKeys.has(l.file);
          return (
            <li key={l.file} className={isRec ? 'rec' : ''}>
              <div className="lh">
                <span className="who" style={{ background: def.color }}>{l.hideName ? `${def.name} (???)` : def.name}{l.vo ? ' · VO' : ''}</span>
                <span className="muted small">shot {l.shotNo} · L{String(l.n).padStart(2, '0')}</span>
                <span className={`st small ${l.hasAudio ? 'good' : ''}`}>
                  {l.hasAudio ? `✔ ${l.dur.toFixed(1)}s${inBrowser ? '' : ' (file)'}` : 'belum'}
                </span>
              </div>
              <p className="lt">"{l.text}"</p>
              {l.note && <p className="muted small">Arahan: {l.note}</p>}
              <div className="row">
                {isRec
                  ? <button className="btn danger" onClick={stopRec}>■ Selesai</button>
                  : <button className="btn rec" onClick={() => startRec(l)} disabled={disabled || !!recKey || busyKey === l.file}>● Rekam</button>}
                <button className="btn" onClick={() => play(l)} disabled={!l.hasAudio || !!recKey}>▶ Dengar</button>
                <button className="btn" onClick={() => onPreview(l)} disabled={disabled || !!recKey}>🎬 Di adegan</button>
                <button className="btn" onClick={() => pickFor(l)} disabled={disabled || !!recKey}>📂</button>
                {inBrowser && <button className="btn" onClick={() => remove(l)} disabled={!!recKey}>🗑</button>}
              </div>
            </li>
          );
        })}
      </ol>

      <input ref={pickRef} type="file" accept="audio/*" hidden onChange={onPick} />
      <div className="row">
        <button className="btn" onClick={pickMany} disabled={disabled || !!recKey}>📂 Impor banyak file</button>
        <button className="btn primary" onClick={downloadAll} disabled={!stored.length}>⬇ Unduh semua suara (ZIP)</button>
      </div>
      <p className="muted small">
        Rekaman tersimpan di browser ini saja. Supaya permanen dan bisa dipakai di komputer lain, klik <b>Unduh semua suara</b>,
        ekstrak ZIP-nya ke folder project, lalu upload ke GitHub. Untuk impor banyak file, beri nama sesuai kode baris
        (mis. <code>L03_mira.mp3</code>).
      </p>
    </div>
  );
}
