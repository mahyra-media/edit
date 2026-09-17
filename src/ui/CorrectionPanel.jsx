// Panel untuk menandai & mengoreksi shot: kamera, catatan masalah, screenshot, ekspor.
import { useState } from 'react';
import { CHARACTERS } from '../data/characters.js';
import { downloadBlob } from '../engine/recorder.js';

export const TAGS = ['Terlalu dekat', 'Terlalu jauh', 'Karakter terpotong', 'Salah arah/menghadap', 'Teks ketutup', 'Teks kepotong', 'Teks menutupi wajah', 'Kurang halus', 'Gerakan aneh', 'Timing dialog'];

const SLIDERS = [
  { key: 'zoom', label: 'Jarak kamera', min: 0.4, max: 3, step: 0.05, def: 1, fmt: (v) => `${v.toFixed(2)}×` },
  { key: 'angle', label: 'Putar kamera', min: -180, max: 180, step: 5, def: 0, fmt: (v) => `${v}°` },
  { key: 'dy', label: 'Tinggi kamera', min: -1, max: 1.5, step: 0.05, def: 0, fmt: (v) => `${v > 0 ? '+' : ''}${v.toFixed(2)} m` },
  { key: 'fov', label: 'Lebar lensa (FOV)', min: 25, max: 80, step: 1, def: 50, fmt: (v) => `${v}°` },
];

const CAM_KEYS = ['zoom', 'angle', 'dy', 'fov'];

export function exportText(eps, data) {
  const out = [];
  for (const ep of eps) {
    const rows = data[ep.id];
    if (!rows || !Object.keys(rows).length) continue;
    out.push(`KOREKSI Ep ${ep.no} — ${ep.title}`);
    for (const [i, r] of Object.entries(rows).sort((a, b) => a[0] - b[0])) {
      const s = ep.shots[i];
      if (!s) continue;
      const cam = CAM_KEYS.filter((k) => r[k] != null).map((k) => `${k}=${r[k]}`).join(', ');
      const parts = [cam && `kamera: ${cam}`, r.tags?.length && `masalah: ${r.tags.join(', ')}`, r.note && `catatan: ${r.note}`].filter(Boolean);
      if (parts.length) out.push(`- Shot ${+i + 1} (${s.t.toFixed(1)}s, ${s.cam.s || 'wide'}${s.cam.on ? ' ' + CHARACTERS[s.cam.on].name : ''}): ${parts.join(' | ')}`);
    }
    out.push('');
  }
  out.push('JSON:', JSON.stringify(data));
  return out.join('\n');
}

export function CorrectionPanel({ ep, shot, t, data, setData, canvasRef, disabled }) {
  const [copied, setCopied] = useState('');
  const row = data[ep.id]?.[shot.i] || {};

  const update = (patch) => {
    const next = { ...row, ...patch };
    for (const k of Object.keys(next)) {
      const v = next[k];
      if (v == null || v === '' || (Array.isArray(v) && !v.length)) delete next[k];
    }
    const epRows = { ...(data[ep.id] || {}) };
    if (Object.keys(next).length) epRows[shot.i] = next; else delete epRows[shot.i];
    setData({ ...data, [ep.id]: epRows });
  };

  const toggleTag = (tag) => {
    const tags = new Set(row.tags || []);
    tags.has(tag) ? tags.delete(tag) : tags.add(tag);
    update({ tags: [...tags] });
  };

  const snap = () => {
    canvasRef.current?.toBlob((b) => b && downloadBlob(b, `${ep.id}-shot${shot.i + 1}-${t.toFixed(1)}s.png`), 'image/png');
  };

  const copyAll = async () => {
    const text = exportText([ep], data);
    try {
      await navigator.clipboard.writeText(text);
      setCopied('Tersalin! Tempel ke chat.');
    } catch {
      setCopied(text);
    }
  };

  const count = Object.keys(data[ep.id] || {}).length;

  return (
    <div className="card koreksi">
      <div className="row between">
        <strong>Koreksi shot {shot.i + 1}</strong>
        <span className="muted small">{count} shot ditandai di episode ini</span>
      </div>

      {SLIDERS.map((sl) => {
        const v = row[sl.key] ?? sl.def;
        return (
          <label key={sl.key} className="slider">
            <span>{sl.label} <b>{sl.fmt(v)}</b></span>
            <input type="range" min={sl.min} max={sl.max} step={sl.step} value={v} disabled={disabled}
              onChange={(e) => update({ [sl.key]: +e.target.value === sl.def ? null : +e.target.value })} />
          </label>
        );
      })}

      <div className="tags">
        {TAGS.map((tag) => (
          <button key={tag} className={`tag ${row.tags?.includes(tag) ? 'on' : ''}`} onClick={() => toggleTag(tag)} disabled={disabled}>
            {tag}
          </button>
        ))}
      </div>

      <textarea
        rows={2}
        placeholder="Catatan (mis. bubble Mira menutupi muka Hana)"
        value={row.note || ''}
        disabled={disabled}
        onChange={(e) => update({ note: e.target.value })}
      />

      <div className="row">
        <button className="btn" onClick={snap}>📸 Simpan gambar frame</button>
        <button className="btn" onClick={() => update({ zoom: null, angle: null, dy: null, fov: null, tags: null, note: null })} disabled={disabled}>Reset shot</button>
        <button className="btn primary" onClick={copyAll} disabled={!count}>Salin semua koreksi</button>
      </div>
      {copied && (copied.startsWith('Tersalin')
        ? <p className="muted small">{copied}</p>
        : <textarea rows={6} readOnly value={copied} onFocus={(e) => e.target.select()} />)}
      <p className="muted small">Perubahan kamera langsung terlihat & ikut terekam. Koreksi tersimpan di browser ini.</p>
    </div>
  );
}
