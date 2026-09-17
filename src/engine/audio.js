// Mesin audio: memutar dialog/SFX/BGM tepat waktu, menyediakan level suara
// per karakter untuk lip-sync, dan stream audio untuk perekaman.
// AudioContext.currentTime dipakai sebagai jam utama supaya gambar & suara sinkron.
import { fetchAsset } from './asset.js';
import { getVoice } from './voiceStore.js';

const EXTS = ['.mp3', '.wav', '.m4a', '.ogg'];
const hasExt = (p) => /\.[a-z0-9]{2,4}$/i.test(p);

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.buffers = new Map(); // path -> AudioBuffer | null
    this.sources = [];
    this.analysers = {};
    this.startAt = 0;
    this.rates = {}; // kecepatan/nada suara per karakter
    this.preview = null;
    this._buf = new Uint8Array(512);
  }

  ensure() {
    if (this.ctx) return this.ctx;
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.connect(ctx.destination);
    this.recDest = ctx.createMediaStreamDestination();
    this.master.connect(this.recDest);
    return ctx;
  }

  analyser(id) {
    if (!this.analysers[id]) {
      const a = this.ctx.createAnalyser();
      a.fftSize = 512;
      a.smoothingTimeConstant = 0.35;
      a.connect(this.master);
      this.analysers[id] = a;
    }
    return this.analysers[id];
  }

  async load(path) {
    if (this.buffers.has(path)) return this.buffers.get(path);
    const p = (async () => {
      let data = null;
      const stored = await getVoice(path);
      if (stored?.blob) data = await stored.blob.arrayBuffer();
      if (!data) {
        for (const c of hasExt(path) ? [path] : EXTS.map((e) => path + e)) {
          const res = await fetchAsset(c);
          if (res) { data = await res.arrayBuffer(); break; }
        }
      }
      if (!data) return null;
      try { return await this.ctx.decodeAudioData(data); } catch { return null; }
    })();
    this.buffers.set(path, p);
    const buf = await p;
    this.buffers.set(path, buf);
    return buf;
  }

  invalidate(path) {
    this.buffers.delete(path);
  }

  rate(who) {
    return this.rates[who] || 1;
  }

  // Memuat semua audio episode. Mengembalikan durasi dialog untuk buildEpisode().
  async preload(ep) {
    this.ensure();
    const durations = {};
    const whoOf = {};
    ep.shots.forEach((s) => s.lines.forEach((l) => { whoOf[l.file] = l.who; }));
    let missing = 0;
    let voices = 0;
    await Promise.all(ep.audioFiles.map(async (f) => {
      const b = await this.load(f);
      if (!b) { missing += 1; return; }
      if (whoOf[f]) { voices += 1; durations[f] = b.duration / this.rate(whoOf[f]); }
    }));
    const lineCount = Object.keys(whoOf).length;
    return { durations, missing, total: ep.audioFiles.length, voices, lineCount };
  }

  // Putar satu file (untuk panel suara)
  async playOne(path, who) {
    const ctx = this.ensure();
    if (ctx.state !== 'running') await ctx.resume();
    this.stopOne();
    const buf = await this.load(path);
    if (!(buf instanceof AudioBuffer)) return false;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = this.rate(who);
    src.connect(this.master);
    src.start();
    this.preview = src;
    return true;
  }

  stopOne() {
    try { this.preview?.stop(); } catch { /* sudah berhenti */ }
    this.preview = null;
  }

  async play(ep, fromT) {
    const ctx = this.ensure();
    if (ctx.state !== 'running') await ctx.resume();
    this.stop();
    const now = ctx.currentTime + 0.08;
    this.startAt = now - fromT;

    const sched = (buf, T, dest, gain = 1, rate = 1) => {
      if (!(buf instanceof AudioBuffer) || T + buf.duration / rate <= fromT) return;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = rate;
      const g = ctx.createGain();
      g.gain.value = gain;
      src.connect(g).connect(dest);
      const offset = Math.max(0, fromT - T) * rate;
      src.start(Math.max(now, this.startAt + T), offset);
      this.sources.push(src);
    };

    const bgm = ep.bgm && this.buffers.get(ep.bgm);
    if (bgm instanceof AudioBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = bgm;
      src.loop = true;
      const g = ctx.createGain();
      g.gain.value = ep.bgmVolume ?? 0.22;
      // fade-out di 1,5 detik terakhir
      const endAt = this.startAt + ep.total;
      g.gain.setValueAtTime(g.gain.value, Math.max(now, endAt - 1.5));
      g.gain.linearRampToValueAtTime(0, Math.max(now + 0.01, endAt));
      src.connect(g).connect(this.master);
      src.start(now, fromT % bgm.duration);
      this.sources.push(src);
    }
    for (const s of ep.shots) {
      for (const l of s.lines) sched(this.buffers.get(l.file), l.T, this.analyser(l.who), 1, this.rate(l.who));
      for (const x of s.sfx) sched(this.buffers.get(x.src), x.T, this.master, x.vol);
    }
  }

  time() {
    return this.ctx ? this.ctx.currentTime - this.startAt : 0;
  }

  stop() {
    for (const s of this.sources) { try { s.stop(); } catch { /* sudah berhenti */ } }
    this.sources = [];
  }

  // Level suara 0..1 untuk lip-sync
  level(id) {
    const a = this.analysers[id];
    if (!a) return 0;
    a.getByteTimeDomainData(this._buf);
    let sum = 0;
    for (let i = 0; i < this._buf.length; i++) {
      const x = (this._buf[i] - 128) / 128;
      sum += x * x;
    }
    return Math.min(1, Math.sqrt(sum / this._buf.length) * 6);
  }
}
