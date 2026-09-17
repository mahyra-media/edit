// Render episode frame-per-frame langsung ke MP4 (WebCodecs + mp4-muxer).
// Waktu tiap frame dihitung pasti (n / fps), jadi hasil selalu mulus
// walaupun komputer lambat — proses render saja yang lebih lama.
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

export const canExportMp4 = () =>
  typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined' && typeof AudioEncoder !== 'undefined';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// H.264 dulu (paling kompatibel), cadangan VP9 (tetap diterima YouTube)
const VIDEO_CODECS = [
  ['avc1.640028', 'avc'], ['avc1.4d0028', 'avc'], ['avc1.42e028', 'avc'], ['avc1.640032', 'avc'],
  ['vp09.00.40.08', 'vp9'], ['vp09.00.10.08', 'vp9'],
];

async function pickVideo(width, height, fps) {
  for (const [codec, mux] of VIDEO_CODECS) {
    for (const hardwareAcceleration of ['prefer-hardware', 'no-preference']) {
      const cfg = { codec, width, height, bitrate: 12_000_000, framerate: fps, hardwareAcceleration, latencyMode: 'quality' };
      try {
        const r = await VideoEncoder.isConfigSupported(cfg);
        if (r.supported) return { cfg, mux };
      } catch { /* coba berikutnya */ }
    }
  }
  throw new Error('Browser ini tidak bisa membuat video. Pakai Chrome atau Edge versi terbaru.');
}

async function pickAudio(sampleRate) {
  for (const [codec, mux] of [['mp4a.40.2', 'aac'], ['opus', 'opus']]) {
    const cfg = { codec, sampleRate, numberOfChannels: 2, bitrate: 192_000 };
    try {
      const r = await AudioEncoder.isConfigSupported(cfg);
      if (r.supported) return { cfg, mux };
    } catch { /* coba berikutnya */ }
  }
  return null;
}

export async function exportMp4({ ep, audio, canvas, renderFrame, fps = 30, onProgress, signal }) {
  const width = canvas.width;
  const height = canvas.height;
  const sampleRate = 48000;
  const vsel = await pickVideo(width, height, fps);
  const acfg = await pickAudio(sampleRate);

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: vsel.mux, width, height },
    ...(acfg && { audio: { codec: acfg.mux, numberOfChannels: 2, sampleRate } }),
    fastStart: 'in-memory',
  });

  let failure = null;

  // ---- audio ----
  if (acfg) {
    onProgress?.(0, 'Menyiapkan audio...');
    const buf = await audio.renderOffline(ep, sampleRate);
    const ae = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: (e) => { failure = e; } });
    ae.configure(acfg.cfg);
    const step = 4800;
    const ch0 = buf.getChannelData(0);
    const ch1 = buf.getChannelData(buf.numberOfChannels > 1 ? 1 : 0);
    for (let i = 0; i < buf.length; i += step) {
      const n = Math.min(step, buf.length - i);
      const data = new Float32Array(n * 2);
      data.set(ch0.subarray(i, i + n), 0);
      data.set(ch1.subarray(i, i + n), n);
      const ad = new AudioData({ format: 'f32-planar', sampleRate, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round((i / sampleRate) * 1e6), data });
      ae.encode(ad);
      ad.close();
    }
    await ae.flush();
    ae.close();
  }

  // ---- video ----
  const ve = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: (e) => { failure = e; } });
  ve.configure(vsel.cfg);
  const total = Math.max(1, Math.round(ep.total * fps));
  const started = performance.now();
  const frameDur = Math.round(1e6 / fps);

  for (let n = 0; n < total; n++) {
    if (signal?.aborted) { ve.close(); throw new DOMException('Render dibatalkan', 'AbortError'); }
    if (failure) throw failure;
    await renderFrame(Math.min(ep.total - 0.001, n / fps));
    const frame = new VideoFrame(canvas, { timestamp: n * frameDur, duration: frameDur });
    ve.encode(frame, { keyFrame: n % (fps * 2) === 0 });
    frame.close();
    while (ve.encodeQueueSize > 6) await wait(4);
    if (n % 2 === 0) {
      const spent = (performance.now() - started) / 1000;
      onProgress?.((n + 1) / total, `Frame ${n + 1} / ${total}`, (spent / (n + 1)) * (total - n - 1));
      await wait(0);
    }
  }
  await ve.flush();
  ve.close();
  if (failure) throw failure;
  muxer.finalize();
  onProgress?.(1, 'Selesai');
  return new Blob([muxer.target.buffer], { type: 'video/mp4' });
}
