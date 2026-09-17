// Mesin audio: memutar dialog/SFX/BGM tepat waktu (realtime & offline untuk render MP4),
// dan menyediakan envelope volume tiap rekaman untuk lip-sync yang deterministik.
// AudioContext.currentTime dipakai sebagai jam utama saat preview.
import { fetchAsset } from './asset.js';
import { getVoice } from './voiceStore.js';

const EXTS = ['.mp3', '.wav', '.m4a', '.ogg'];
const hasExt = (p) => /\.[a-z0-9]{2,4}$/i.test(p);
const ENV_HZ = 60;

function makeEnvelope(buf) {
  const hop = Math.max(1, Math.floor(buf.sampleRate / ENV_HZ));
  const n = Math.ceil(buf.length / hop);
  const d = buf.getChannelData(0);
  const env = new Float32Array(n);
  let max = 1e-6;
  for (let i = 0; i < n; i++) {
    let sum = 0;
    const s = i * hop;
    const e = Math.min(d.length, s + hop);
    for (let k = s; k < e; k++) sum += d[k] * d[k];
    env[i] = Math.sqrt(sum / Math.max(1, e - s));
    if (env[i] > max) max = env[i];
  }
  for (let i = 0; i < n; i++) {
    const v = env[i] / (max * 0.6);
    env[i] = v < 0.12 ? 0 : Math.min(1, v);
  }
  return env;
}

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.buffers = new Map(); // path -> Promise | AudioBuffer | null
    this.envelopes = new Map(); // path -> Float32Array
    this.sources = [];
    this.startAt = 0;
    this.rates = {}; // kecepatan/nada suara per karakter
    this.preview = null;
  }

  ensure() {
    if (this.ctx) return this.ctx;
    const ctx = new AudioContext({ latencyHint: 'playback' });
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.connect(ctx.destination);
    this.recDest = ctx.createMediaStreamDestination();
    this.master.connect(this.recDest);
    return ctx;
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
      try {
        const buf = await this.ensure().decodeAudioData(data);
        this.envelopes.set(path, makeEnvelope(buf));
        return buf;
      } catch {
        return null;
      }
    })();
    this.buffers.set(path, p);
    const buf = await p;
    if (this.buffers.get(path) === p) this.buffers.set(path, buf);
    return buf;
  }

  invalidate(path) {
    this.buffers.delete(path);
    this.envelopes.delete(path);
  }

  rate(who) {
    return this.rates[who] || 1;
  }

  // Level mulut 0..1 untuk dialog pada waktu lokal (detik sejak dialog mulai)
  mouth(path, who, since) {
    const env = this.envelopes.get(path);
    if (!env || since < 0) return 0;
    const x = since * this.rate(who) * ENV_HZ;
    const i = Math.floor(x);
    if (i >= env.length) return 0;
    const a = env[i];
    const b = env[Math.min(env.length - 1, i + 1)];
    return a + (b - a) * (x - i);
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
      if (!(b instanceof AudioBuffer)) { missing += 1; return; }
      if (whoOf[f]) { voices += 1; durations[f] = b.duration / this.rate(whoOf[f]); }
    }));
    return { durations, missing, total: ep.audioFiles.length, voices, lineCount: Object.keys(whoOf).length };
  }

  // Jadwalkan seluruh audio episode ke context mana pun (realtime atau offline)
  schedule(ctx, dest, ep, fromT, startAt, now) {
    const out = [];
    const sched = (buf, T, gain = 1, rate = 1) => {
      if (!(buf instanceof AudioBuffer) || T + buf.duration / rate <= fromT) return;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = rate;
      const g = ctx.createGain();
      g.gain.value = gain;
      src.connect(g).connect(dest);
      src.start(Math.max(now, startAt + T), Math.max(0, fromT - T) * rate);
      out.push(src);
    };

    const bgm = ep.bgm && this.buffers.get(ep.bgm);
    if (bgm instanceof AudioBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = bgm;
      src.loop = true;
      const g = ctx.createGain();
      const vol = ep.bgmVolume ?? 0.22;
      const endAt = startAt + ep.total;
      g.gain.setValueAtTime(vol, now);
      g.gain.setValueAtTime(vol, Math.max(now, endAt - 1.5));
      g.gain.linearRampToValueAtTime(0, Math.max(now + 0.01, endAt));
      src.connect(g).connect(dest);
      src.start(now, fromT % bgm.duration);
      out.push(src);
    }
    for (const s of ep.shots) {
      for (const l of s.lines) sched(this.buffers.get(l.file), l.T, 1, this.rate(l.who));
      for (const x of s.sfx) sched(this.buffers.get(x.src), x.T, x.vol);
    }
    return out;
  }

  async play(ep, fromT) {
    const ctx = this.ensure();
    if (ctx.state !== 'running') await ctx.resume();
    this.stop();
    const now = ctx.currentTime + 0.1;
    this.startAt = now - fromT;
    this.sources = this.schedule(ctx, this.master, ep, fromT, this.startAt, now);
  }

  // Render seluruh audio episode tanpa diputar (untuk file MP4)
  async renderOffline(ep, sampleRate = 48000) {
    const length = Math.max(1, Math.ceil(ep.total * sampleRate));
    const ctx = new OfflineAudioContext(2, length, sampleRate);
    this.schedule(ctx, ctx.destination, ep, 0, 0, 0);
    return ctx.startRendering();
  }

  time() {
    return this.ctx ? this.ctx.currentTime - this.startAt : 0;
  }

  stop() {
    for (const s of this.sources) { try { s.stop(); } catch { /* sudah berhenti */ } }
    this.sources = [];
  }

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
}
